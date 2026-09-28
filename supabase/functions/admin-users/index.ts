// Privileged account management for the admin portal.
// Runs with the service role; every request is authorised against the caller's
// own JWT (must be an active admin / super admin) and written to audit_logs.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Json = Record<string, unknown>;

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const json = (status: number, body: Json) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

function requirePassword(p: unknown): string {
  const pw = typeof p === 'string' ? p : '';
  if (pw.length < 8) throw new HttpError(400, 'Password must be at least 8 characters.');
  return pw;
}

const VENDOR_FIELDS = [
  'business_name', 'contact_name', 'email', 'phone', 'whatsapp', 'gstin', 'address_line', 'city', 'district',
  'state', 'pincode', 'area', 'assigned_manager', 'tier', 'credit_limit', 'notes',
] as const;

function pickVendor(input: Json): Json {
  const out: Json = {};
  for (const k of VENDOR_FIELDS) {
    if (input[k] === undefined) continue;
    out[k] = k === 'credit_limit' ? Number(input[k]) || 0 : typeof input[k] === 'string' ? str(input[k], 300) || null : input[k];
  }
  return out;
}

async function audit(admin: SupabaseClient, actor: { id: string; email?: string }, action: string, entity: string, entityId: string | null, after: Json) {
  await admin.from('audit_logs').insert({
    actor_id: actor.id,
    actor_email: actor.email ?? null,
    action,
    entity,
    entity_id: entityId,
    after_data: after,
  });
}

/** The auth trigger creates the profile; make its role/status explicit regardless of trigger timing. */
async function ensureProfile(admin: SupabaseClient, userId: string, role: string, status: string) {
  const { error } = await admin.from('profiles').update({ role, status }).eq('id', userId);
  if (error) throw new HttpError(500, 'Account created but profile setup failed. Please retry.');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) throw new HttpError(401, 'Sign in required.');

    // Identify the caller with their own token (RLS applies).
    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
    const { data: userData, error: userErr } = await caller.auth.getUser(authHeader.slice(7));
    if (userErr || !userData.user) throw new HttpError(401, 'Your session has expired. Please sign in again.');
    const { data: me } = await caller.from('profiles').select('id, role, status, email').eq('id', userData.user.id).maybeSingle();
    if (!me || me.status !== 'active' || !['admin', 'super_admin'].includes(me.role)) throw new HttpError(403, 'Administrator access required.');
    const actor = { id: me.id as string, email: (me.email as string) ?? userData.user.email };

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const body = (await req.json().catch(() => ({}))) as Json;
    const action = str(body.action, 40);

    switch (action) {
      case 'create_vendor': {
        const email = str(body.email, 200).toLowerCase();
        const fullName = str(body.full_name, 120);
        if (!emailOk(email)) throw new HttpError(400, 'Enter a valid login email.');
        const vendor = pickVendor((body.vendor as Json) ?? {});
        if (!vendor.business_name || String(vendor.business_name).length < 2) throw new HttpError(400, 'Business name is required.');
        const password = requirePassword(body.password);

        const { data: created, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          app_metadata: { role: 'vendor' },
          user_metadata: { full_name: fullName || vendor.contact_name || vendor.business_name, phone: vendor.phone ?? null },
        });
        if (error || !created.user) throw new HttpError(400, error?.message.includes('already') ? 'A login with this email already exists.' : error?.message ?? 'Could not create login.');
        await ensureProfile(admin, created.user.id, 'vendor', 'active');

        const { data: row, error: vErr } = await admin
          .from('vendors')
          .insert({ ...vendor, email: vendor.email ?? email, contact_name: vendor.contact_name ?? fullName, profile_id: created.user.id, status: 'active' })
          .select('*')
          .single();
        if (vErr) {
          await admin.auth.admin.deleteUser(created.user.id);
          throw new HttpError(400, vErr.code === '23505' ? 'That vendor code is already in use.' : vErr.message);
        }
        await audit(admin, actor, 'create', 'vendors', row.id, { ...row, login_email: email });
        return json(200, { vendor: row });
      }

      case 'link_vendor_login': {
        const vendorId = str(body.vendor_id, 60);
        const email = str(body.email, 200).toLowerCase();
        if (!emailOk(email)) throw new HttpError(400, 'Enter a valid login email.');
        const password = requirePassword(body.password);
        const { data: v } = await admin.from('vendors').select('id, profile_id, contact_name, business_name, phone, status').eq('id', vendorId).maybeSingle();
        if (!v) throw new HttpError(404, 'Vendor not found.');
        if (v.profile_id) throw new HttpError(400, 'This vendor already has a login.');
        const { data: created, error } = await admin.auth.admin.createUser({
          email, password, email_confirm: true,
          app_metadata: { role: 'vendor' },
          user_metadata: { full_name: v.contact_name || v.business_name, phone: v.phone },
        });
        if (error || !created.user) throw new HttpError(400, error?.message ?? 'Could not create login.');
        await ensureProfile(admin, created.user.id, 'vendor', v.status as string);
        await admin.from('vendors').update({ profile_id: created.user.id }).eq('id', vendorId);
        await audit(admin, actor, 'link_login', 'vendors', vendorId, { login_email: email });
        return json(200, { ok: true });
      }

      case 'set_vendor_status': {
        const vendorId = str(body.vendor_id, 60);
        const status = str(body.status, 20);
        if (!['active', 'inactive', 'suspended'].includes(status)) throw new HttpError(400, 'Invalid status.');
        const { data: v, error } = await admin.from('vendors').update({ status }).eq('id', vendorId).select('id, profile_id').single();
        if (error) throw new HttpError(400, error.message);
        if (v.profile_id) {
          await admin.from('profiles').update({ status }).eq('id', v.profile_id);
          await admin.auth.admin.updateUserById(v.profile_id, { ban_duration: status === 'active' ? 'none' : '876000h' });
        }
        await audit(admin, actor, 'set_status', 'vendors', vendorId, { status });
        return json(200, { ok: true });
      }

      case 'reset_password': {
        const userId = str(body.user_id, 60);
        const password = requirePassword(body.password);
        const { data: target } = await admin.from('profiles').select('id, role').eq('id', userId).maybeSingle();
        if (!target) throw new HttpError(404, 'User not found.');
        if (target.role !== 'vendor' && me.role !== 'super_admin') throw new HttpError(403, 'Only a super admin can reset another administrator\'s password.');
        const { error } = await admin.auth.admin.updateUserById(userId, { password });
        if (error) throw new HttpError(400, error.message);
        await audit(admin, actor, 'reset_password', 'profiles', userId, {});
        return json(200, { ok: true });
      }

      case 'create_admin': {
        if (me.role !== 'super_admin') throw new HttpError(403, 'Only a super admin can add administrators.');
        const email = str(body.email, 200).toLowerCase();
        const fullName = str(body.full_name, 120);
        const role = str(body.role, 20) === 'super_admin' ? 'super_admin' : 'admin';
        if (!emailOk(email)) throw new HttpError(400, 'Enter a valid email.');
        if (fullName.length < 2) throw new HttpError(400, 'Name is required.');
        const password = requirePassword(body.password);
        const { data: created, error } = await admin.auth.admin.createUser({
          email, password, email_confirm: true,
          app_metadata: { role },
          user_metadata: { full_name: fullName, phone: str(body.phone, 20) || null },
        });
        if (error || !created.user) throw new HttpError(400, error?.message.includes('already') ? 'A user with this email already exists.' : error?.message ?? 'Could not create user.');
        await ensureProfile(admin, created.user.id, role, 'active');
        await audit(admin, actor, 'create', 'profiles', created.user.id, { email, role, full_name: fullName });
        return json(200, { user_id: created.user.id });
      }

      case 'set_admin_status': {
        if (me.role !== 'super_admin') throw new HttpError(403, 'Only a super admin can change administrator access.');
        const userId = str(body.user_id, 60);
        const status = str(body.status, 20);
        if (userId === me.id) throw new HttpError(400, 'You cannot change your own access.');
        if (!['active', 'inactive', 'suspended'].includes(status)) throw new HttpError(400, 'Invalid status.');
        const { error } = await admin.from('profiles').update({ status }).eq('id', userId).in('role', ['admin', 'super_admin']);
        if (error) throw new HttpError(400, error.message);
        await admin.auth.admin.updateUserById(userId, { ban_duration: status === 'active' ? 'none' : '876000h' });
        await audit(admin, actor, 'set_status', 'profiles', userId, { status });
        return json(200, { ok: true });
      }

      default:
        throw new HttpError(400, 'Unknown action.');
    }
  } catch (e) {
    if (e instanceof HttpError) return json(e.status, { error: e.message });
    console.error(e);
    return json(500, { error: 'Unexpected server error. Please try again.' });
  }
});
