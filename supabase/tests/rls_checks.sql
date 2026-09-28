-- RLS & business-rule checks. Run against a seeded database:
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_checks.sql
-- Every check raises an exception on failure; the script ends with "ALL RLS CHECKS PASSED".
begin;

create or replace function pg_temp.as_user(p_uid uuid, p_email text default null) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'email', p_email)::text, true);
  execute 'set local role authenticated';
end $$;

create or replace function pg_temp.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  execute 'set local role anon';
end $$;

create or replace function pg_temp.check(p_ok boolean, p_msg text) returns void language plpgsql as $$
begin
  if not coalesce(p_ok, false) then raise exception 'RLS CHECK FAILED: %', p_msg; end if;
  raise notice 'ok - %', p_msg;
end $$;

-- ---------- anon ----------
select pg_temp.as_anon();
select pg_temp.check((select count(*) from products) > 0, 'anon sees published products');
select pg_temp.check((select count(*) from products where status <> 'published') = 0, 'anon never sees drafts');
select pg_temp.check((select count(*) from product_trade_prices) = 0, 'anon cannot read trade prices');
select pg_temp.check((select count(*) from orders) = 0, 'anon cannot read orders');
select pg_temp.check((select count(*) from vendors) = 0, 'anon cannot read vendors');
select pg_temp.check((select count(*) from enquiries) = 0, 'anon cannot read enquiries');
select pg_temp.check((select count(*) from leads) = 0, 'anon cannot read leads');
select pg_temp.check((select count(*) from audit_logs) = 0, 'anon cannot read audit logs');
select pg_temp.check(log_enquiry((select id from products limit 1), 5, 'product_page', '/products/x', null, 'mobile') like 'ENQ-%', 'anon can log a WhatsApp enquiry');
select pg_temp.check(submit_lead('contact', 'Test Person', '9876543210', null, null, 'Kishanganj', 'Hi', 'Hello') is not null, 'anon can submit a lead');
do $$ begin
  begin
    insert into enquiries (product_name) values ('x');
    raise exception 'RLS CHECK FAILED: anon inserted enquiry directly';
  exception when insufficient_privilege then raise notice 'ok - anon cannot insert enquiries directly';
  end;
  begin
    perform place_order('[]'::jsonb);
    raise exception 'RLS CHECK FAILED: anon could call place_order';
  exception when insufficient_privilege then raise notice 'ok - anon cannot call place_order';
  end;
end $$;
reset role;

-- ---------- vendor A (Sharma) ----------
select pg_temp.as_user('00000000-0000-4000-a000-000000000011');
select pg_temp.check(current_vendor_id() = '20000000-0000-4000-a000-000000000001', 'vendor resolves own vendor id');
select pg_temp.check((select count(*) from vendors) = 1, 'vendor sees only own vendor record');
select pg_temp.check((select count(*) from orders where vendor_id <> current_vendor_id()) = 0, 'vendor sees no other vendor orders');
select pg_temp.check((select count(*) from orders) > 0, 'vendor sees own orders');
select pg_temp.check((select count(*) from order_items oi join orders o on o.id = oi.order_id where o.vendor_id <> current_vendor_id()) = 0, 'vendor sees no other vendor order items');
select pg_temp.check((select count(*) from targets where vendor_id <> current_vendor_id()) = 0, 'vendor sees no other vendor targets');
select pg_temp.check((select count(*) from target_progress where vendor_id <> current_vendor_id()) = 0, 'target_progress view respects RLS');
select pg_temp.check((select count(*) from vendor_incentives where vendor_id <> current_vendor_id()) = 0, 'vendor sees no other vendor incentives');
select pg_temp.check((select count(*) from profiles) = 1, 'vendor sees only own profile');
select pg_temp.check((select count(*) from product_trade_prices) > 0, 'vendor can read trade prices');
select pg_temp.check((select count(*) from enquiries) = 0, 'vendor cannot read enquiries');
select pg_temp.check((select count(*) from audit_logs) = 0, 'vendor cannot read audit logs');
select pg_temp.check((select count(*) from notifications where recipient_id <> auth.uid()) = 0, 'vendor sees only own notifications');

-- updating another vendor's orders / data silently affects 0 rows
with u as (update orders set admin_notes = 'hack' where vendor_id <> current_vendor_id() returning 1)
select pg_temp.check((select count(*) from u) = 0, 'vendor cannot update any order');
with u as (update vendors set phone = '0' where id <> current_vendor_id() returning 1)
select pg_temp.check((select count(*) from u) = 0, 'vendor cannot update other vendors');

do $$ begin
  begin
    update profiles set role = 'admin' where id = auth.uid();
    raise exception 'RLS CHECK FAILED: vendor escalated own role';
  exception when insufficient_privilege then raise notice 'ok - vendor cannot change own role';
  end;
  begin
    update vendors set credit_limit = 999999 where id = current_vendor_id();
    raise exception 'RLS CHECK FAILED: vendor changed credit limit';
  exception when insufficient_privilege then raise notice 'ok - vendor cannot change admin-controlled vendor fields';
  end;
  begin
    insert into orders (vendor_id, status) values (current_vendor_id(), 'delivered');
    raise exception 'RLS CHECK FAILED: vendor inserted order directly';
  exception when insufficient_privilege then raise notice 'ok - vendor cannot insert orders directly';
  end;
  begin
    update notifications set title = 'x' where recipient_id = auth.uid();
    raise exception 'RLS CHECK FAILED: vendor edited notification title';
  exception when insufficient_privilege then raise notice 'ok - vendor can only flip notification read state';
  end;
  begin
    perform admin_overview(current_date - 30, current_date);
    raise exception 'RLS CHECK FAILED: vendor ran admin analytics';
  exception when insufficient_privilege then raise notice 'ok - vendor cannot run admin analytics';
  end;
  begin
    perform place_order(jsonb_build_array(jsonb_build_object('product_id', (select id from products where sku = 'NL-B09'), 'quantity', 3)));
    raise exception 'RLS CHECK FAILED: MOQ not enforced';
  exception when invalid_parameter_value then raise notice 'ok - minimum order quantity enforced';
  end;
  begin
    perform place_order(jsonb_build_array(jsonb_build_object('product_id', (select id from products where sku = 'NL-HW50'), 'quantity', 10)));
    raise exception 'RLS CHECK FAILED: out of stock not enforced';
  exception when invalid_parameter_value then raise notice 'ok - out-of-stock products cannot be ordered';
  end;
end $$;

update vendors set phone = '+91 90000 00000' where id = current_vendor_id();
select pg_temp.check((select phone from vendors where id = current_vendor_id()) = '+91 90000 00000', 'vendor can edit own contact details');

-- place an order and verify server-side pricing + idempotency
select pg_temp.check((
  select o.total_amount = 64 * 20 + 202 * 10
  from place_order(
    jsonb_build_array(
      jsonb_build_object('product_id', (select id from products where sku = 'NL-B09'), 'quantity', 20),
      jsonb_build_object('product_id', (select id from products where sku = 'NL-INV12'), 'quantity', 10)
    ), 'test order', '11111111-1111-4111-a111-111111111111') o
), 'place_order prices from trade price table');
select pg_temp.check((
  select count(*) = 1 from orders where client_request_id = '11111111-1111-4111-a111-111111111111'
), 'order exists once');
select place_order(jsonb_build_array(jsonb_build_object('product_id', (select id from products where sku = 'NL-B09'), 'quantity', 20)), null, '11111111-1111-4111-a111-111111111111');
select pg_temp.check((
  select count(*) = 1 from orders where client_request_id = '11111111-1111-4111-a111-111111111111'
), 'duplicate submission returns the same order');
select pg_temp.check((select status = 'cancelled' from cancel_my_order((select id from orders where client_request_id = '11111111-1111-4111-a111-111111111111'), 'changed my mind')), 'vendor can cancel own pending order');
reset role;

-- ---------- vendor B cannot touch vendor A ----------
select pg_temp.as_user('00000000-0000-4000-a000-000000000012');
select pg_temp.check((select count(*) from orders where vendor_id = '20000000-0000-4000-a000-000000000001') = 0, 'vendor B cannot see vendor A orders');
do $$ begin
  begin
    perform cancel_my_order((select id from orders where vendor_id = '20000000-0000-4000-a000-000000000001' limit 1));
    raise exception 'RLS CHECK FAILED: vendor B cancelled vendor A order';
  exception when no_data_found then raise notice 'ok - vendor B cannot cancel vendor A orders';
  end;
end $$;
reset role;

-- ---------- deactivated vendor loses access ----------
update vendors set status = 'inactive' where id = '20000000-0000-4000-a000-000000000004';
select pg_temp.as_user('00000000-0000-4000-a000-000000000014');
select pg_temp.check(current_vendor_id() is null, 'inactive vendor has no vendor id');
select pg_temp.check((select count(*) from orders) = 0, 'inactive vendor sees no orders');
select pg_temp.check((select count(*) from product_trade_prices) = 0, 'inactive vendor loses trade prices');
reset role;
update vendors set status = 'active' where id = '20000000-0000-4000-a000-000000000004';

-- ---------- admin ----------
select pg_temp.as_user('00000000-0000-4000-a000-000000000002', 'ops@novalite.test');
select pg_temp.check(is_admin(), 'ops user is admin');
select pg_temp.check((select count(distinct vendor_id) from orders) = 5, 'admin sees all vendor orders');
select pg_temp.check((select count(*) from enquiries) > 0, 'admin reads enquiries');
select pg_temp.check((admin_overview(current_date - 30, current_date) ->> 'gross_sales')::numeric > 0, 'admin analytics run');
do $$ begin
  begin
    update profiles set role = 'super_admin' where id = '00000000-0000-4000-a000-000000000011';
    raise exception 'RLS CHECK FAILED: admin granted super admin';
  exception when insufficient_privilege then raise notice 'ok - only super admins manage admin roles';
  end;
  begin
    update orders set total_amount = 1 where id = (select id from orders limit 1);
    raise exception 'RLS CHECK FAILED: admin edited order totals';
  exception when insufficient_privilege then raise notice 'ok - order totals are immutable';
  end;
  begin
    perform update_order_status((select id from orders where status = 'delivered' limit 1), 'pending');
    raise exception 'RLS CHECK FAILED: invalid transition allowed';
  exception when invalid_parameter_value then raise notice 'ok - invalid status transitions rejected';
  end;
  begin
    delete from categories where slug = 'led-bulbs';
    raise exception 'RLS CHECK FAILED: category with products deleted';
  exception when foreign_key_violation then raise notice 'ok - categories with products cannot be deleted';
  end;
end $$;
select pg_temp.check((select status = 'approved' from update_order_status((select id from orders where status = 'pending' limit 1), 'approved', 'Stock confirmed')), 'admin can approve a pending order');
select pg_temp.check((select count(*) from audit_logs where actor_id = '00000000-0000-4000-a000-000000000002') > 0, 'admin actions are audited');
reset role;

rollback;
select 'ALL RLS CHECKS PASSED' as result;
