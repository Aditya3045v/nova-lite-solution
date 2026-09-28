-- =============================================================================
-- Novalite Solutions: seed data
--
-- Catalogue items marked "(verified)" in comments come from the existing
-- novalite website; everything else (extra SKUs, vendors, orders, portfolio
-- projects, testimonials) is DEMO content for admins to edit or remove.
--
-- Demo logins created here are for LOCAL development only
-- (password: Novalite@2026). Production users are created through the
-- admin portal / admin-users edge function.
-- =============================================================================

select setseed(0.2026);

-- -----------------------------------------------------------------------------
-- Demo auth users (local only)
-- -----------------------------------------------------------------------------
do $$
declare
  u record;
begin
  for u in
    select * from (values
      ('00000000-0000-4000-a000-000000000001'::uuid, 'admin@novalite.test',   'super_admin', 'Aditya Kumar',   '+919142651626'),
      ('00000000-0000-4000-a000-000000000002'::uuid, 'ops@novalite.test',     'admin',       'Operations Desk', '+919142651626'),
      ('00000000-0000-4000-a000-000000000011'::uuid, 'vendor@novalite.test',  'vendor',      'Rakesh Sharma',  '+919801100011'),
      ('00000000-0000-4000-a000-000000000012'::uuid, 'purnia@novalite.test',  'vendor',      'Sunil Agarwal',  '+919801100012'),
      ('00000000-0000-4000-a000-000000000013'::uuid, 'siliguri@novalite.test','vendor',      'Partha Ghosh',   '+919801100013'),
      ('00000000-0000-4000-a000-000000000014'::uuid, 'katihar@novalite.test', 'vendor',      'Imran Ansari',   '+919801100014'),
      ('00000000-0000-4000-a000-000000000015'::uuid, 'araria@novalite.test',  'vendor',      'Manoj Yadav',    '+919801100015')
    ) as t(id, email, role, full_name, phone)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
      extensions.crypt('Novalite@2026', extensions.gen_salt('bf')), now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', u.role),
      jsonb_build_object('full_name', u.full_name, 'phone', u.phone),
      now() - interval '200 days', now(), '', '', '', ''
    ) on conflict (id) do nothing;

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), u.id, u.id::text,
      jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
      'email', now(), now(), now()
    ) on conflict do nothing;
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Site settings
-- -----------------------------------------------------------------------------
insert into public.site_settings (key, value) values
('business', jsonb_build_object(
  'name', 'Nova Lite Solution',
  'short_name', 'Novalite',
  'tagline', 'Unique light for your home',
  'description', 'Energy-efficient LED bulbs, rechargeable inverter bulbs and tube lights engineered for Indian power conditions. Manufactured and supplied from Kishanganj, Bihar.',
  'phone', '+91 91426 51626',
  'whatsapp', '919142651626',
  'email', '',
  'address', 'Kishanganj, Bihar 855107, India',
  'city', 'Kishanganj',
  'state', 'Bihar',
  'pincode', '855107',
  'hours', 'Monday to Saturday, 9:00 AM to 7:00 PM',
  'map_url', 'https://maps.google.com/?q=Kishanganj,+Bihar',
  'map_embed', 'https://www.google.com/maps?q=Kishanganj,+Bihar&output=embed',
  'service_area', 'Bihar, West Bengal and Jharkhand',
  'socials', jsonb_build_object('facebook', '', 'instagram', '', 'youtube', '')
)),
('storefront', jsonb_build_object(
  'announcement', 'Dealer pricing and bulk supply available across Bihar, Bengal and Jharkhand.',
  'quick_categories', jsonb_build_array('led-bulbs', 'inverter-bulbs', 'tube-lights', 'high-wattage'),
  'stats', jsonb_build_array(
    jsonb_build_object('value', '9K+', 'label', 'Products delivered'),
    jsonb_build_object('value', '2K+', 'label', 'Happy customers'),
    jsonb_build_object('value', '28+', 'label', 'Dealers and distributors'),
    jsonb_build_object('value', '1 yr', 'label', 'Replacement warranty')
  ),
  'value_props', jsonb_build_array(
    jsonb_build_object('icon', 'shield', 'title', '4 kV surge protection', 'text', 'Built to survive voltage spikes common on Indian grids.'),
    jsonb_build_object('icon', 'battery', 'title', 'Auto inverter backup', 'text', 'Rechargeable bulbs stay lit for 4 to 8 hours during power cuts.'),
    jsonb_build_object('icon', 'leaf', 'title', 'Up to 85% energy saving', 'text', 'Lower electricity bills without losing brightness.'),
    jsonb_build_object('icon', 'badge', 'title', '1-year replacement', 'text', 'Prompt replacement support for customers and dealers.')
  ),
  'show_prices', true
)),
('seo', jsonb_build_object(
  'title', 'Nova Lite Solution | LED Bulbs, Inverter Bulbs and Tube Lights | Kishanganj, Bihar',
  'description', 'Buy energy-efficient LED bulbs, rechargeable inverter bulbs and tube lights from Nova Lite Solution, Kishanganj. Dealer and bulk supply across Bihar, Bengal and Jharkhand.',
  'keywords', jsonb_build_array('LED bulb', 'inverter bulb', 'rechargeable bulb', 'tube light', 'Kishanganj', 'Bihar', 'LED dealer')
)),
('ordering', jsonb_build_object(
  'order_note', 'Orders are reviewed by the Novalite team within one working day. Prices exclude GST and freight.',
  'support_whatsapp', '919142651626',
  'support_phone', '+91 91426 51626'
))
on conflict (key) do update set value = excluded.value;

-- -----------------------------------------------------------------------------
-- Catalogue
-- -----------------------------------------------------------------------------
insert into public.categories (id, name, slug, description, image_url, icon, sort_order) values
('10000000-0000-4000-a000-000000000001', 'LED Bulbs', 'led-bulbs', 'Everyday energy-saving LED bulbs from 5W to 15W for homes and shops.', '/media/categories/led-bulbs.svg', 'lightbulb', 1),
('10000000-0000-4000-a000-000000000002', 'Inverter Bulbs', 'inverter-bulbs', 'Rechargeable bulbs that switch to battery backup automatically during power cuts.', '/media/categories/inverter-bulbs.svg', 'battery-charging', 2),
('10000000-0000-4000-a000-000000000003', 'Tube Lights & Battens', 'tube-lights', 'Flicker-free T8 tubes and slim T5 battens for homes, offices and shops.', '/media/categories/tube-lights.svg', 'minus', 3),
('10000000-0000-4000-a000-000000000004', 'High-Watt & Commercial', 'high-wattage', 'Ultrawide and high-lumen bulbs for shops, godowns and commercial spaces.', '/media/categories/high-wattage.svg', 'sun', 4);

create temporary table seed_products (
  sku text, cat int, name text, slug text, short text, descr text, highlights text[],
  watt text, lumens text, cct text, base text, mrp numeric, dealer numeric, moq int, pack int,
  featured boolean, badge text, img text, stock public.stock_status, extra jsonb
);

insert into seed_products values
-- LED bulbs
('NL-B05', 1, 'Nova LED Bulb 5W', 'nova-led-bulb-5w', 'Compact 5W bulb for bedrooms and night use.',
 'A compact, low-power LED bulb for bedrooms, puja rooms and passages. Wide-angle PC diffuser, aluminium heatsink and surge-protected driver built for fluctuating Indian voltage.',
 array['5W replaces a 40W incandescent', 'Wide 220° beam angle', 'Works from 140V to 270V'],
 '5W', '500 lm', '6500K Cool White', 'B22', 65, 46, 20, 10, false, null, 'bulb-5w', 'in_stock', '{}'),
('NL-B07', 1, 'Nova LED Bulb 7W', 'nova-led-bulb-7w', 'Bright everyday bulb for kitchens and small rooms.',
 'Balanced brightness for kitchens, bathrooms and small rooms. Flicker-free driver and a milky diffuser for glare-free light.',
 array['7W replaces a 60W incandescent', 'Flicker-free, eye-safe light', '4 kV surge protection'],
 '7W', '700 lm', '6500K Cool White', 'B22', 75, 53, 20, 10, false, null, 'bulb-7w', 'in_stock', '{}'),
-- (verified) ₹89 9W 6500K 900 lm B22
('NL-B09', 1, 'Nova LED Bulb 9W', 'nova-led-bulb-9w', 'Our best-selling 9W bulb: 900 lumens of cool white light.',
 'The bulb most homes and shops start with. 900 lumens of 6500K cool white light from just 9 watts, a thermal aluminium heatsink for long life and a surge-protected driver that handles voltage spikes up to 4 kV.',
 array['900 lumens from 9 watts', 'Up to 85% energy saving', '1-year replacement warranty'],
 '9W', '900 lm', '6500K Cool White', 'B22', 89, 64, 20, 10, true, 'Best Seller', 'bulb-9w', 'in_stock', '{}'),
-- (verified) ₹120 12W 1200 lm B22/E27
('NL-B12', 1, 'Nova LED Bulb 12W', 'nova-led-bulb-12w', '1200 lumens for living rooms and shop counters.',
 'A brighter bulb for living rooms, halls and shop counters. Available in B22 and E27 bases with the same 4 kV surge protection and 25,000-hour rated life.',
 array['1200 lumens of bright light', 'B22 and E27 bases', 'Rated 25,000 burning hours'],
 '12W', '1200 lm', '6500K Cool White', 'B22 / E27', 120, 86, 20, 10, true, null, 'bulb-12w', 'in_stock', '{}'),
('NL-B15', 1, 'Nova LED Bulb 15W', 'nova-led-bulb-15w', 'Extra-bright 15W bulb for large rooms.',
 'For large rooms and verandas that need more light. High-efficiency LEDs with an oversized heatsink keep the bulb cool and bright for years.',
 array['1500 lumens output', 'Oversized aluminium heatsink', 'Works from 140V to 270V'],
 '15W', '1500 lm', '6500K Cool White', 'B22', 145, 104, 20, 10, false, null, 'bulb-15w', 'low_stock', '{}'),
-- Inverter bulbs
('NL-INV09', 2, 'Nova Inverter Bulb 9W', 'nova-inverter-bulb-9w', 'Rechargeable 9W bulb with automatic backup.',
 'Charges while the power is on and switches to its built-in lithium battery the moment electricity cuts. Fits any standard B22 holder, so no wiring changes are needed.',
 array['Automatic switch-over on power cut', 'Up to 4 hours backup', 'Fits standard B22 holders'],
 '9W', '900 lm', '6500K Cool White', 'B22', 249, 180, 10, 5, false, null, 'inverter-9w', 'in_stock', '{"Battery": "2200 mAh lithium-ion", "Backup": "Up to 4 hours", "Charging time": "8 to 10 hours"}'),
-- (verified) ₹280 12W 4–8 hrs backup
('NL-INV12', 2, 'Nova Inverter Bulb 12W', 'nova-inverter-bulb-12w', 'Rechargeable inverter bulb with 4 to 8 hours of automatic backup.',
 'Our flagship emergency bulb. It lights your home normally, charges its lithium battery while power is on and keeps shining for 4 to 8 hours during a power cut. Ideal for homes and shops across Bihar and Bengal.',
 array['4 to 8 hours of battery backup', 'Instant automatic switch-over', 'Works as a normal bulb on mains power'],
 '12W', '1200 lm', '6500K Cool White', 'B22', 280, 202, 10, 5, true, 'Top Pick', 'inverter-12w', 'in_stock', '{"Battery": "2600 mAh lithium-ion", "Backup": "4 to 8 hours", "Charging time": "8 to 10 hours"}'),
('NL-INV15', 2, 'Nova Inverter Bulb 15W', 'nova-inverter-bulb-15w', 'High-output rechargeable bulb for shops and halls.',
 'A brighter rechargeable bulb for shops, halls and clinics that cannot afford to go dark. Dual-battery design for longer backup.',
 array['Dual-battery pack', 'Up to 6 hours backup', 'Overcharge and deep-discharge protection'],
 '15W', '1500 lm', '6500K Cool White', 'B22', 349, 252, 10, 5, true, 'New', 'inverter-15w', 'in_stock', '{"Battery": "2 x 2200 mAh lithium-ion", "Backup": "Up to 6 hours", "Charging time": "10 to 12 hours"}'),
-- Tube lights
-- (verified) ₹190 T8 20W 4 ft 2000 lm
('NL-T8-20', 3, 'Nova T8 Tube Light 20W', 'nova-t8-tube-light-20w', 'Flicker-free 4 ft T8 LED tube, 2000 lumens.',
 'A direct replacement for old fluorescent tubes. 2000 lumens of flicker-free light from 20 watts, with a frosted cover that spreads light evenly across the room.',
 array['2000 lumens, flicker-free', '4 ft standard T8 fitting', 'Instant start, no choke needed'],
 '20W', '2000 lm', '6500K Cool White', 'T8 G13 (4 ft)', 190, 137, 10, 10, true, null, 'tube-t8-20w', 'in_stock', '{"Length": "4 ft (1200 mm)"}'),
('NL-T5-10', 3, 'Nova T5 Batten 10W (2 ft)', 'nova-t5-batten-10w', 'Slim 2 ft batten for kitchens and cabinets.',
 'An integrated slim batten with a built-in driver. Mounts directly to walls and ceilings, ideal for kitchens, cabinets and small shops.',
 array['Integrated driver, easy mounting', 'Slim 2 ft profile', 'Uniform glare-free light'],
 '10W', '1000 lm', '6500K Cool White', 'Integrated batten', 180, 130, 10, 10, false, null, 'batten-10w', 'in_stock', '{"Length": "2 ft (600 mm)"}'),
('NL-T5-20', 3, 'Nova T5 Batten 20W (4 ft)', 'nova-t5-batten-20w', 'Slim 4 ft batten with integrated driver.',
 'Replace old tube-light fittings with one slim integrated batten. Aluminium body and polycarbonate diffuser for long, cool operation.',
 array['2000 lumens', 'Integrated driver', 'Aluminium + PC body'],
 '20W', '2000 lm', '6500K Cool White', 'Integrated batten', 240, 173, 10, 10, false, null, 'batten-20w', 'in_stock', '{"Length": "4 ft (1200 mm)"}'),
('NL-BT36', 3, 'Nova Slim Batten 36W (4 ft)', 'nova-slim-batten-36w', 'High-lumen 36W batten for offices and showrooms.',
 'Our brightest batten for offices, showrooms and classrooms that need strong, even light across large areas.',
 array['3600 lumens output', 'Wide-angle diffuser', 'Ideal for offices and showrooms'],
 '36W', '3600 lm', '6500K Cool White', 'Integrated batten', 399, 288, 10, 10, false, null, 'batten-36w', 'made_to_order', '{"Length": "4 ft (1200 mm)"}'),
-- High watt
-- (verified) ₹160 Ultrawide 18W B22
('NL-UW18', 4, 'Nova Ultrawide LED 18W', 'nova-ultrawide-led-18w', 'Commercial high-lumen bulb with a wide spread.',
 'A wide-body bulb for shops, counters and godowns that need a big, bright spread of light from a regular B22 holder.',
 array['High-lumen commercial output', 'Wide-body design for broad spread', 'Standard B22 base'],
 '18W', '1800 lm', '6500K Cool White', 'B22', 160, 115, 10, 10, true, null, 'ultrawide-18w', 'in_stock', '{}'),
('NL-HW30', 4, 'Nova High-Watt LED 30W', 'nova-high-watt-led-30w', '30W high-lumen bulb for shops and warehouses.',
 'Finned aluminium body and a high-efficiency driver for demanding commercial spaces like shops, workshops and godowns.',
 array['3000 lumens output', 'Finned aluminium cooling', 'B22 base, no fixture needed'],
 '30W', '3000 lm', '6500K Cool White', 'B22', 299, 216, 10, 5, false, null, 'highwatt-30w', 'in_stock', '{}'),
('NL-HW40', 4, 'Nova High-Watt LED 40W', 'nova-high-watt-led-40w', '40W bulb for large commercial spaces.',
 'When you need serious light from a regular holder. Designed for long operating hours in shops, factories and warehouses.',
 array['4000 lumens output', 'Designed for long operating hours', 'Surge-protected driver'],
 '40W', '4000 lm', '6500K Cool White', 'B22', 399, 288, 10, 5, false, null, 'highwatt-40w', 'low_stock', '{}'),
('NL-HW50', 4, 'Nova High-Watt LED 50W', 'nova-high-watt-led-50w', 'Our most powerful bulb for godowns and halls.',
 'The brightest bulb in the Nova range for godowns, marriage halls and large commercial floors.',
 array['5000 lumens output', 'Heavy-duty finned heatsink', 'E27 base'],
 '50W', '5000 lm', '6500K Cool White', 'E27', 499, 360, 5, 5, false, null, 'highwatt-50w', 'out_of_stock', '{}');

insert into public.products (
  category_id, sku, name, slug, short_description, description, highlights, specifications,
  tags, mrp, stock_status, status, is_featured, badge, warranty, sort_order
)
select
  ('10000000-0000-4000-a000-00000000000' || sp.cat)::uuid,
  sp.sku, sp.name, sp.slug, sp.short, sp.descr, sp.highlights,
  (
    jsonb_build_array(
      jsonb_build_object('label', 'Wattage', 'value', sp.watt),
      jsonb_build_object('label', 'Luminous flux', 'value', sp.lumens),
      jsonb_build_object('label', 'Colour temperature', 'value', sp.cct),
      jsonb_build_object('label', 'Base / fitting', 'value', sp.base),
      jsonb_build_object('label', 'Input voltage', 'value', '140V to 270V AC'),
      jsonb_build_object('label', 'Surge protection', 'value', '4 kV'),
      jsonb_build_object('label', 'Rated life', 'value', '25,000 hours'),
      jsonb_build_object('label', 'Warranty', 'value', '1 year replacement')
    ) || coalesce((select jsonb_agg(jsonb_build_object('label', k, 'value', v)) from jsonb_each_text(sp.extra) as e(k, v)), '[]'::jsonb)
  ),
  array[lower(sp.watt), 'led', split_part(sp.cct, ' ', 1)],
  sp.mrp, sp.stock, 'published', sp.featured, sp.badge, '1 year replacement',
  row_number() over ()
from seed_products sp;

insert into public.product_trade_prices (product_id, dealer_price, min_order_qty, max_order_qty, pack_size)
select p.id, sp.dealer, sp.moq, 5000, sp.pack
from seed_products sp join public.products p on p.sku = sp.sku;

insert into public.product_images (product_id, url, alt_text, sort_order)
select p.id, '/media/products/' || sp.img || '.svg', p.name, 0
from seed_products sp join public.products p on p.sku = sp.sku;

insert into public.product_images (product_id, url, alt_text, sort_order)
select p.id, '/media/products/' || sp.img || '-box.svg', p.name || ' retail box', 1
from seed_products sp join public.products p on p.sku = sp.sku;

-- -----------------------------------------------------------------------------
-- Site content
-- -----------------------------------------------------------------------------
insert into public.banners (placement, eyebrow, title, subtitle, highlight, cta_label, cta_href, image_url, theme, sort_order) values
('hero', 'Best Seller', 'Inverter Bulb 12W', 'Stays lit for 4 to 8 hours when the power goes out. Charges itself while it lights your home.', 'From ₹280', 'Shop now', '/products/nova-inverter-bulb-12w', '/media/products/inverter-12w.svg', 'dark', 1),
('hero', 'Energy Saver', 'LED Bulb 9W', '900 lumens of cool white light with 4 kV surge protection and a 1-year replacement warranty.', 'Only ₹89', 'Explore bulbs', '/categories/led-bulbs', '/media/products/bulb-9w.svg', 'dark', 2),
('hero', 'For Dealers', 'Partner with Novalite', 'Trade pricing, fast dispatch and a dedicated vendor portal for dealers across Bihar, Bengal and Jharkhand.', 'Trade pricing', 'Become a dealer', '/dealers', '/media/banners/range.svg', 'dark', 3),
('promo', 'Sale', 'Tube Lights & Battens', 'Flicker-free T8 tubes and slim battens.', 'Up to 30% off', 'Shop tubes', '/categories/tube-lights', '/media/products/tube-t8-20w.svg', 'brand', 1),
('promo', 'New', 'High-Watt LED 30W', 'Built for shops and godowns.', '3000 lumens', 'See range', '/categories/high-wattage', '/media/products/highwatt-30w.svg', 'brand', 2);

insert into public.services (title, summary, icon, sort_order) values
('Retail lighting supply', 'Energy-saving LED bulbs, inverter bulbs and tube lights for homes, delivered through our dealer network and on WhatsApp.', 'lightbulb', 1),
('Dealer & distributor network', 'Trade pricing, fast regional dispatch and a self-service vendor portal for electrical stores across Eastern India.', 'store', 2),
('Bulk & project supply', 'Volume pricing and scheduled deliveries for schools, clinics, offices, housing projects and institutions.', 'building', 3),
('Emergency lighting', 'Rechargeable inverter bulbs that keep homes and shops lit through power cuts without extra wiring.', 'battery-charging', 4),
('Warranty & after-sales', 'Simple 1-year replacement support for customers and dealers, handled directly from Kishanganj.', 'shield-check', 5),
('Lighting consultation', 'Help choosing the right wattage, colour and fitting for your home, shop or project before you buy.', 'messages-square', 6);

insert into public.projects (title, slug, client, location, segment, summary, body, results, image_url, completed_on, sort_order) values
('Retail counter upgrade for an electrical showroom', 'retail-counter-upgrade', 'Electrical showroom (sample)', 'Kishanganj, Bihar', 'Retail',
 'Replaced ageing CFLs and fluorescent tubes with Nova 12W bulbs and T5 battens across a busy showroom.',
 'This sample case study shows how a showroom can cut its lighting load while making products look better on the shelf. Replace it with a real project from the admin portal.',
 '[{"label": "Lighting load", "value": "-62%"}, {"label": "Fixtures replaced", "value": "140"}, {"label": "Payback", "value": "7 months"}]',
 '/media/projects/showroom.svg', '2026-03-15', 1),
('Power-cut ready lighting for a rural clinic', 'rural-clinic-backup-lighting', 'Primary health clinic (sample)', 'Purnia district, Bihar', 'Healthcare',
 'Inverter bulbs installed in treatment rooms so care continues through evening power cuts.',
 'Sample project: rechargeable inverter bulbs keep treatment rooms and corridors lit during outages without the cost of a full inverter system. Replace with a real project from the admin portal.',
 '[{"label": "Backup per room", "value": "6 hrs"}, {"label": "Rooms covered", "value": "18"}, {"label": "Wiring changes", "value": "None"}]',
 '/media/projects/clinic.svg', '2026-05-02', 2),
('Warehouse re-lamp with high-watt LEDs', 'warehouse-high-watt-relamp', 'Distribution godown (sample)', 'Siliguri, West Bengal', 'Industrial',
 'High-watt 30W and 40W bulbs brightened a 12,000 sq ft godown using existing B22 holders.',
 'Sample project: swapping old lamps for high-watt LED bulbs doubled usable light at the loading bays with no new fixtures. Replace with a real project from the admin portal.',
 '[{"label": "Brightness", "value": "2x"}, {"label": "Energy saved", "value": "58%"}, {"label": "New fixtures", "value": "0"}]',
 '/media/projects/warehouse.svg', '2026-07-20', 3);

insert into public.testimonials (author_name, author_role, company, location, quote, rating, sort_order) values
('Rakesh Sharma', 'Owner', 'Sharma Electricals', 'Kishanganj', 'Nova inverter bulbs are the first thing customers ask for during the monsoon. Replacement is quick and the vendor portal makes re-ordering easy.', 5, 1),
('Sunil Agarwal', 'Distributor', 'Maa Tara Traders', 'Purnia', 'Consistent stock, fair trade pricing and fast dispatch. We have grown our lighting business every quarter since partnering with Novalite.', 5, 2),
('Priya Singh', 'Home customer', null, 'Araria', 'Our 9W bulbs have survived two summers of voltage fluctuations. Bright, cool light and genuinely lower electricity bills.', 5, 3),
('Partha Ghosh', 'Dealer', 'New Bengal Electric Store', 'Siliguri', 'The 12W inverter bulb sells itself. Ordering on WhatsApp or the portal takes a minute.', 4, 4);

insert into public.faqs (question, answer, category, sort_order) values
('How do I buy Nova products?', 'Open any product and tap "Buy on WhatsApp". Your enquiry is sent to our sales desk with the product and quantity filled in, and we confirm price, delivery and payment with you directly.', 'buying', 1),
('Do you deliver outside Kishanganj?', 'Yes. We supply homes, shops and dealers across Bihar, West Bengal and Jharkhand through our dealer network and direct dispatch.', 'buying', 2),
('How long does an inverter bulb stay lit during a power cut?', 'Depending on the model, between 4 and 8 hours on a full charge. The bulb charges automatically whenever mains power is on.', 'products', 3),
('What does the warranty cover?', 'All Nova LED products carry a 1-year replacement warranty against manufacturing defects. Contact us on WhatsApp with your purchase details to claim.', 'support', 4),
('How do I become a Nova dealer?', 'Fill in the dealer application on the Dealers page. Our team will call you to discuss trade pricing and set up your vendor portal login.', 'dealers', 5),
('Are prices inclusive of GST?', 'Prices shown on the website are MRP. Trade prices in the vendor portal exclude GST and freight, which are confirmed on the invoice.', 'buying', 6);

-- -----------------------------------------------------------------------------
-- Demo vendors
-- -----------------------------------------------------------------------------
insert into public.vendors (id, profile_id, business_name, contact_name, email, phone, whatsapp, gstin, address_line, city, district, state, pincode, area, assigned_manager, tier, credit_limit, created_at) values
('20000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000011', 'Sharma Electricals', 'Rakesh Sharma', 'vendor@novalite.test', '+91 98011 00011', '919801100011', '10ABCDE1234F1Z5', 'Main Road, Gandhi Chowk', 'Kishanganj', 'Kishanganj', 'Bihar', '855107', 'Kishanganj Town', 'Operations Desk', 'dealer', 150000, now() - interval '200 days'),
('20000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000012', 'Maa Tara Traders', 'Sunil Agarwal', 'purnia@novalite.test', '+91 98011 00012', '919801100012', '10FGHIJ5678K1Z2', 'Line Bazar', 'Purnia', 'Purnia', 'Bihar', '854301', 'Purnia Division', 'Operations Desk', 'distributor', 400000, now() - interval '190 days'),
('20000000-0000-4000-a000-000000000003', '00000000-0000-4000-a000-000000000013', 'New Bengal Electric Store', 'Partha Ghosh', 'siliguri@novalite.test', '+91 98011 00013', '919801100013', '19KLMNO9012P1Z8', 'Hill Cart Road', 'Siliguri', 'Darjeeling', 'West Bengal', '734001', 'North Bengal', 'Operations Desk', 'dealer', 200000, now() - interval '170 days'),
('20000000-0000-4000-a000-000000000004', '00000000-0000-4000-a000-000000000014', 'Raj Lighting House', 'Imran Ansari', 'katihar@novalite.test', '+91 98011 00014', '919801100014', null, 'Station Road', 'Katihar', 'Katihar', 'Bihar', '854105', 'Katihar', 'Operations Desk', 'retailer', 50000, now() - interval '150 days'),
('20000000-0000-4000-a000-000000000005', '00000000-0000-4000-a000-000000000015', 'Bihar Power Solutions', 'Manoj Yadav', 'araria@novalite.test', '+91 98011 00015', '919801100015', '10QRSTU3456V1Z1', 'Chandni Chowk', 'Araria', 'Araria', 'Bihar', '854311', 'Araria', 'Operations Desk', 'dealer', 150000, now() - interval '120 days');

-- -----------------------------------------------------------------------------
-- Demo order history (last ~6 months). Triggers are bypassed here so the
-- history can be back-dated; timestamps and status history are written explicitly.
-- -----------------------------------------------------------------------------
set session_replication_role = replica;

do $$
declare
  v record;
  n int;
  i int;
  k int;
  v_order uuid;
  v_created timestamptz;
  v_status public.order_status;
  v_age int;
  v_r float;
  p record;
  v_qty int;
  v_sub numeric;
  v_units int;
  v_items int;
begin
  for v in
    select id, profile_id, (extract(day from now() - created_at))::int as age,
           case business_name when 'Maa Tara Traders' then 3.0 when 'Sharma Electricals' then 2.0 when 'New Bengal Electric Store' then 1.6 when 'Bihar Power Solutions' then 1.2 else 0.8 end as weight
    from public.vendors
  loop
    n := (18 * v.weight)::int;
    for i in 1..n loop
      v_age := (random() * least(v.age - 1, 178))::int;
      if i <= 2 then
        v_age := (random() * 3)::int;
      end if;
      v_created := date_trunc('hour', now() - make_interval(days => v_age)) + make_interval(mins => (random() * 600)::int)
                   - interval '1 hour';
      v_r := random();
      v_status := case
        when v_age < 2 then (case when v_r < 0.7 then 'pending' else 'approved' end)::public.order_status
        when v_age < 5 then (case when v_r < 0.2 then 'pending' when v_r < 0.5 then 'approved' when v_r < 0.8 then 'processing' else 'dispatched' end)::public.order_status
        when v_age < 10 then (case when v_r < 0.3 then 'dispatched' when v_r < 0.92 then 'delivered' else 'cancelled' end)::public.order_status
        else (case when v_r < 0.9 then 'delivered' when v_r < 0.95 then 'cancelled' else 'rejected' end)::public.order_status
      end;

      insert into public.orders (vendor_id, status, created_at, updated_at, placed_by, vendor_notes)
      values (v.id, v_status, v_created, v_created, v.profile_id,
              case when random() < 0.25 then 'Please deliver before the weekend.' end)
      returning id into v_order;

      v_sub := 0; v_units := 0; v_items := 0;
      for p in
        select pr.id, pr.name, pr.sku, pr.unit, tp.dealer_price, tp.min_order_qty, tp.pack_size
        from public.products pr join public.product_trade_prices tp on tp.product_id = pr.id
        where pr.stock_status <> 'out_of_stock'
        order by random() * case when pr.is_featured then 0.4 else 1 end
        limit 1 + (random() * 4)::int
      loop
        v_qty := greatest(p.min_order_qty, ((random() * 12)::int + 1) * 10);
        v_qty := v_qty - (v_qty % p.pack_size);
        if v_qty < p.min_order_qty then v_qty := p.min_order_qty; end if;
        insert into public.order_items (order_id, product_id, product_name, sku, unit, unit_price, quantity, line_total, created_at)
        values (v_order, p.id, p.name, p.sku, p.unit, p.dealer_price, v_qty, p.dealer_price * v_qty, v_created);
        v_sub := v_sub + p.dealer_price * v_qty;
        v_units := v_units + v_qty;
        v_items := v_items + 1;
      end loop;

      update public.orders set
        subtotal = v_sub, total_amount = v_sub, total_units = v_units, item_count = v_items,
        approved_at = case when v_status in ('approved', 'processing', 'dispatched', 'delivered') then v_created + interval '5 hours' end,
        dispatched_at = case when v_status in ('dispatched', 'delivered') then v_created + interval '28 hours' end,
        delivered_at = case when v_status = 'delivered' then v_created + interval '76 hours' end,
        cancelled_at = case when v_status in ('cancelled', 'rejected') then v_created + interval '3 hours' end,
        updated_at = v_created + interval '76 hours'
      where id = v_order;

      insert into public.order_status_history (order_id, from_status, to_status, note, changed_by, created_at)
      values (v_order, null, 'pending', 'Order placed', v.profile_id, v_created);
      if v_status in ('approved', 'processing', 'dispatched', 'delivered') then
        insert into public.order_status_history (order_id, from_status, to_status, note, changed_by, created_at)
        values (v_order, 'pending', 'approved', null, '00000000-0000-4000-a000-000000000002', v_created + interval '5 hours');
      end if;
      if v_status in ('processing') then
        insert into public.order_status_history (order_id, from_status, to_status, note, changed_by, created_at)
        values (v_order, 'approved', 'processing', 'Packing in progress', '00000000-0000-4000-a000-000000000002', v_created + interval '12 hours');
      end if;
      if v_status in ('dispatched', 'delivered') then
        insert into public.order_status_history (order_id, from_status, to_status, note, changed_by, created_at)
        values (v_order, 'approved', 'dispatched', 'Sent via regional transport', '00000000-0000-4000-a000-000000000002', v_created + interval '28 hours');
      end if;
      if v_status = 'delivered' then
        insert into public.order_status_history (order_id, from_status, to_status, note, changed_by, created_at)
        values (v_order, 'dispatched', 'delivered', null, '00000000-0000-4000-a000-000000000002', v_created + interval '76 hours');
      end if;
      if v_status = 'cancelled' then
        insert into public.order_status_history (order_id, from_status, to_status, note, changed_by, created_at)
        values (v_order, 'pending', 'cancelled', 'Cancelled by vendor', v.profile_id, v_created + interval '3 hours');
      end if;
      if v_status = 'rejected' then
        insert into public.order_status_history (order_id, from_status, to_status, note, changed_by, created_at)
        values (v_order, 'pending', 'rejected', 'Credit limit exceeded', '00000000-0000-4000-a000-000000000002', v_created + interval '3 hours');
      end if;
    end loop;
  end loop;
end;
$$;

-- Enquiries from the public site (last 60 days)
insert into public.enquiries (product_id, product_sku, product_name, quantity, source, page_path, device, status, created_at)
select p.id, p.sku, p.name,
       (array[1, 2, 5, 10, 20, 50])[1 + floor(random() * 6)::int],
       (array['product_page', 'product_page', 'product_page', 'catalogue_card', 'floating_button'])[1 + floor(random() * 5)::int],
       '/products/' || p.slug,
       (array['mobile', 'mobile', 'mobile', 'desktop'])[1 + floor(random() * 4)::int],
       (array['new', 'contacted', 'contacted', 'converted', 'closed'])[1 + floor(random() * 5)::int]::public.lead_status,
       now() - make_interval(days => floor(random() * 60)::int, hours => floor(random() * 23)::int)
from generate_series(1, 260) g
cross join lateral (
  select * from public.products where status = 'published' and g > 0
  order by random() * case when is_featured then 0.35 else 1 end limit 1
) p;

set session_replication_role = origin;

insert into public.leads (type, name, phone, email, business_name, city, subject, message, status, created_at) values
('dealer_application', 'Deepak Jha', '9801234567', null, 'Jha Electric Mart', 'Forbesganj', 'Retail Stockist', 'Interested in LED bulbs and inverter bulbs for my shop.', 'new', now() - interval '1 day'),
('dealer_application', 'Anjali Das', '9832123456', 'anjali.das@example.com', 'Das Traders', 'Malda', 'District Distributor', 'We distribute electrical goods across Malda district and want to add Nova.', 'contacted', now() - interval '6 days'),
('bulk_quote', 'Hotel Green Park', '9431122334', null, 'Hotel Green Park', 'Kishanganj', 'Bulk order', 'Need 250 x 12W bulbs and 60 battens for renovation.', 'qualified', now() - interval '3 days'),
('contact', 'Ravi Kumar', '9123456780', null, null, 'Kishanganj', 'Warranty', 'My inverter bulb stopped charging after 8 months.', 'new', now() - interval '5 hours'),
('contact', 'Neha Paswan', '9709988776', 'neha@example.com', null, 'Purnia', 'Product question', 'Do you have warm white 9W bulbs?', 'closed', now() - interval '12 days');

-- -----------------------------------------------------------------------------
-- Targets & incentives (run as the demo super admin so audit/notifications work)
-- -----------------------------------------------------------------------------
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-4000-a000-000000000001', 'role', 'authenticated', 'email', 'admin@novalite.test')::text, false);

insert into public.targets (vendor_id, title, period_type, period_start, period_end, metric, target_value, notes, created_by)
select v.id,
       to_char(m.start, 'Mon YYYY') || ' sales target',
       'monthly', m.start, (m.start + interval '1 month - 1 day')::date, 'revenue',
       case v.tier when 'distributor' then 320000 when 'dealer' then 150000 else 45000 end,
       null, '00000000-0000-4000-a000-000000000001'
from public.vendors v
cross join (
  select date_trunc('month', public.local_date(now()) - make_interval(months => g))::date as start
  from generate_series(0, 2) g
) m;

update public.targets set status = 'closed' where period_end < public.local_date(now());

insert into public.targets (vendor_id, title, period_type, period_start, period_end, metric, target_value, notes, created_by)
select v.id, 'Inverter season units', 'quarterly',
       date_trunc('quarter', public.local_date(now()))::date,
       (date_trunc('quarter', public.local_date(now())) + interval '3 months - 1 day')::date,
       'units', case v.tier when 'distributor' then 9000 when 'dealer' then 5000 else 1500 end,
       'Units across all product lines this quarter.', '00000000-0000-4000-a000-000000000001'
from public.vendors v;

insert into public.incentive_schemes (id, name, description, calc_type, basis, rules, period_start, period_end, status, created_by) values
('30000000-0000-4000-a000-000000000001', 'Quarterly Growth Slabs',
 'Earn a higher percentage as your quarterly purchases cross each slab.',
 'slab', 'revenue',
 '{"mode": "percentage", "slabs": [{"min": 0, "max": 100000, "value": 0.5}, {"min": 100000, "max": 250000, "value": 1.5}, {"min": 250000, "max": null, "value": 2.5}]}',
 date_trunc('quarter', public.local_date(now()))::date,
 (date_trunc('quarter', public.local_date(now())) + interval '3 months - 1 day')::date,
 'active', '00000000-0000-4000-a000-000000000001'),
('30000000-0000-4000-a000-000000000002', 'Target Achiever Bonus',
 'A fixed bonus for every dealer who hits 100% of last month''s sales target.',
 'target_bonus', 'revenue',
 '{"amount": 2500, "min_achievement_pct": 100}',
 date_trunc('month', public.local_date(now()) - interval '1 month')::date,
 (date_trunc('month', public.local_date(now())) - interval '1 day')::date,
 'closed', '00000000-0000-4000-a000-000000000001'),
('30000000-0000-4000-a000-000000000003', 'Monsoon Loyalty 1%',
 'A flat 1% on all purchases during the monsoon season.',
 'percentage', 'revenue',
 '{"rate": 1}',
 date_trunc('month', public.local_date(now()) - interval '3 months')::date,
 (date_trunc('month', public.local_date(now())) - interval '1 day')::date,
 'closed', '00000000-0000-4000-a000-000000000001');

select public.calculate_scheme_incentives(id) from public.incentive_schemes;

update public.vendor_incentives set status = 'paid', payment_reference = 'NEFT-' || upper(substr(md5(id::text), 1, 10))
where scheme_id = '30000000-0000-4000-a000-000000000003' and status = 'earned';
update public.vendor_incentives set status = 'approved'
where scheme_id = '30000000-0000-4000-a000-000000000002' and status = 'earned';

select public.broadcast_notification(
  'Welcome to the Novalite vendor portal',
  'Browse the catalogue, place orders at trade price and track your targets and incentives in one place.',
  'announcement', null);

select set_config('request.jwt.claims', '', false);
