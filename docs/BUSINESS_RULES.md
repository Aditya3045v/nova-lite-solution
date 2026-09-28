# Business rules

These are the defaults implemented in the database. Most are enforced in SQL (triggers, RPCs, RLS) so every app behaves the same.

## Customers and enquiries
- Customers do not create accounts. They buy through WhatsApp.
- **Buy on WhatsApp** opens WhatsApp (app on phones, WhatsApp Web on desktop) with a pre-filled message: product, SKU, quantity, an enquiry reference (`ENQ-XXXXXXXX`) and the page link.
- Each enquiry is logged (`log_enquiry`) with product, quantity, source, page, referrer and device type. Logging never blocks the customer: WhatsApp opens even if logging fails.
- Contact, bulk-quote and dealer-application forms create **leads** (`submit_lead`), with server-side validation and a limit of 5 submissions per phone number per hour. New leads notify admins.

## Prices
- **MRP** is public (unless a product has `price_visible = false`, then it shows "Price on request").
- **Dealer (trade) prices** live in a separate table that only vendors and admins can read.
- Order line prices are captured at the moment the order is placed; later price changes do not affect existing orders.

## Vendor orders
- Only **active** vendors can order, and only **published** products that are not out of stock.
- Each product may define a minimum order quantity, a maximum quantity and a pack size (quantities must be multiples of it).
- Placing an order is idempotent: a retry with the same request id returns the same order, so a flaky connection never creates duplicates.
- Status flow:

  ```
  pending ──► approved ──► processing ──► dispatched ──► delivered
     │  └──► rejected        │                │
     └──────► cancelled ◄────┴────────────────┘ (before dispatch)
  ```
  Vendors can cancel their own order while it is **pending**. Admins move orders along the flow; invalid jumps are rejected by the database. Order totals cannot be edited after placement. Every change is recorded in the order history and notifies the vendor.

## What counts as a sale
An order counts toward sales, targets and incentives when its status is **approved, processing, dispatched or delivered**. It is dated by the **order date in India time (IST)**. Rejected and cancelled orders never count.

## Targets
- Set per vendor for a period (monthly, quarterly, yearly or custom dates).
- Metric: **revenue** (₹), **units** or **number of orders**.
- Progress = sales in the period ÷ target, shown with how much of the period has passed so vendors can see if they are on pace.

## Incentive schemes
Admins create a scheme for a period and choose who is eligible (all active vendors, a tier, or specific vendors). Calculation types:

| Type | How it pays |
| --- | --- |
| Percentage | A flat % of the vendor's sales in the period. |
| Slab | Sales fall into a slab (min/max) that pays either a % or a fixed ₹ amount. |
| Target bonus | A fixed ₹ bonus when the vendor reaches a minimum % of their target for the period (default 100%). |

Each calculation stores a plain-language explanation (for example "₹1,24,500 falls in the ₹1,00,000 – ₹2,00,000 slab, which pays 3%") that the vendor sees in the portal. Payouts move through calculated → approved → paid (or rejected), and the vendor is notified at each step. Re-calculating a scheme updates amounts that are not yet approved or paid.

## Notifications
In-app notifications (with realtime updates) for order status changes, new targets, incentive updates, new leads and admin broadcasts.
