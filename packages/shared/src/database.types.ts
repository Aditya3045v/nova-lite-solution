
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "audit_logs": {
                  Row: {
                    "action": string,"actor_email": string | null,"actor_id": string | null,"after_data": Json | null,"before_data": Json | null,"created_at": string,"entity": string,"entity_id": string | null,"id": number
                  }
                  Insert: {
                    "action": string,"actor_email"?: string | null,"actor_id"?: string | null,"after_data"?: Json | null,"before_data"?: Json | null,"created_at"?: string,"entity": string,"entity_id"?: string | null,"id"?: never
                  }
                  Update: {
                    "action"?: string,"actor_email"?: string | null,"actor_id"?: string | null,"after_data"?: Json | null,"before_data"?: Json | null,"created_at"?: string,"entity"?: string,"entity_id"?: string | null,"id"?: never
                  }
                  Relationships: [
                    
                  ]
                },"banners": {
                  Row: {
                    "created_at": string,"cta_href": string | null,"cta_label": string | null,"ends_at": string | null,"eyebrow": string | null,"highlight": string | null,"id": string,"image_url": string | null,"is_active": boolean,"placement": string,"sort_order": number,"starts_at": string | null,"subtitle": string | null,"theme": string,"title": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"cta_href"?: string | null,"cta_label"?: string | null,"ends_at"?: string | null,"eyebrow"?: string | null,"highlight"?: string | null,"id"?: string,"image_url"?: string | null,"is_active"?: boolean,"placement"?: string,"sort_order"?: number,"starts_at"?: string | null,"subtitle"?: string | null,"theme"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"cta_href"?: string | null,"cta_label"?: string | null,"ends_at"?: string | null,"eyebrow"?: string | null,"highlight"?: string | null,"id"?: string,"image_url"?: string | null,"is_active"?: boolean,"placement"?: string,"sort_order"?: number,"starts_at"?: string | null,"subtitle"?: string | null,"theme"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"categories": {
                  Row: {
                    "created_at": string,"description": string | null,"icon": string | null,"id": string,"image_url": string | null,"is_visible": boolean,"name": string,"slug": string,"sort_order": number,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"icon"?: string | null,"id"?: string,"image_url"?: string | null,"is_visible"?: boolean,"name": string,"slug": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"icon"?: string | null,"id"?: string,"image_url"?: string | null,"is_visible"?: boolean,"name"?: string,"slug"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"enquiries": {
                  Row: {
                    "created_at": string,"device": string | null,"id": string,"page_path": string | null,"product_id": string | null,"product_name": string | null,"product_sku": string | null,"quantity": number | null,"reference": string,"referrer": string | null,"source": string,"status": Database["public"]['Enums']["lead_status"]
                  }
                  Insert: {
                    "created_at"?: string,"device"?: string | null,"id"?: string,"page_path"?: string | null,"product_id"?: string | null,"product_name"?: string | null,"product_sku"?: string | null,"quantity"?: number | null,"reference"?: string,"referrer"?: string | null,"source"?: string,"status"?: Database["public"]['Enums']["lead_status"]
                  }
                  Update: {
                    "created_at"?: string,"device"?: string | null,"id"?: string,"page_path"?: string | null,"product_id"?: string | null,"product_name"?: string | null,"product_sku"?: string | null,"quantity"?: number | null,"reference"?: string,"referrer"?: string | null,"source"?: string,"status"?: Database["public"]['Enums']["lead_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "enquiries_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"faqs": {
                  Row: {
                    "answer": string,"category": string,"created_at": string,"id": string,"is_published": boolean,"question": string,"sort_order": number,"updated_at": string
                  }
                  Insert: {
                    "answer": string,"category"?: string,"created_at"?: string,"id"?: string,"is_published"?: boolean,"question": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "answer"?: string,"category"?: string,"created_at"?: string,"id"?: string,"is_published"?: boolean,"question"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"incentive_schemes": {
                  Row: {
                    "basis": Database["public"]['Enums']["target_metric"],"calc_type": Database["public"]['Enums']["incentive_calc"],"created_at": string,"created_by": string | null,"description": string | null,"eligible_tiers": (string)[] | null,"eligible_vendor_ids": (string)[] | null,"id": string,"name": string,"period_end": string,"period_start": string,"rules": NonNullable<Json>,"status": Database["public"]['Enums']["scheme_status"],"updated_at": string
                  }
                  Insert: {
                    "basis"?: Database["public"]['Enums']["target_metric"],"calc_type": Database["public"]['Enums']["incentive_calc"],"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"eligible_tiers"?: (string)[] | null,"eligible_vendor_ids"?: (string)[] | null,"id"?: string,"name": string,"period_end": string,"period_start": string,"rules"?: NonNullable<Json>,"status"?: Database["public"]['Enums']["scheme_status"],"updated_at"?: string
                  }
                  Update: {
                    "basis"?: Database["public"]['Enums']["target_metric"],"calc_type"?: Database["public"]['Enums']["incentive_calc"],"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"eligible_tiers"?: (string)[] | null,"eligible_vendor_ids"?: (string)[] | null,"id"?: string,"name"?: string,"period_end"?: string,"period_start"?: string,"rules"?: NonNullable<Json>,"status"?: Database["public"]['Enums']["scheme_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "incentive_schemes_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"leads": {
                  Row: {
                    "admin_notes": string | null,"business_name": string | null,"city": string | null,"created_at": string,"email": string | null,"id": string,"message": string | null,"metadata": NonNullable<Json>,"name": string,"phone": string,"status": Database["public"]['Enums']["lead_status"],"subject": string | null,"type": Database["public"]['Enums']["lead_type"],"updated_at": string
                  }
                  Insert: {
                    "admin_notes"?: string | null,"business_name"?: string | null,"city"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: string,"message"?: string | null,"metadata"?: NonNullable<Json>,"name": string,"phone": string,"status"?: Database["public"]['Enums']["lead_status"],"subject"?: string | null,"type"?: Database["public"]['Enums']["lead_type"],"updated_at"?: string
                  }
                  Update: {
                    "admin_notes"?: string | null,"business_name"?: string | null,"city"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: string,"message"?: string | null,"metadata"?: NonNullable<Json>,"name"?: string,"phone"?: string,"status"?: Database["public"]['Enums']["lead_status"],"subject"?: string | null,"type"?: Database["public"]['Enums']["lead_type"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"notifications": {
                  Row: {
                    "created_at": string,"id": string,"link": string | null,"message": string,"read_at": string | null,"recipient_id": string,"title": string,"type": Database["public"]['Enums']["notification_type"]
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"link"?: string | null,"message"?: string,"read_at"?: string | null,"recipient_id": string,"title": string,"type"?: Database["public"]['Enums']["notification_type"]
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"link"?: string | null,"message"?: string,"read_at"?: string | null,"recipient_id"?: string,"title"?: string,"type"?: Database["public"]['Enums']["notification_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"order_items": {
                  Row: {
                    "created_at": string,"id": string,"line_total": number,"order_id": string,"product_id": string | null,"product_name": string,"quantity": number,"sku": string,"unit": string,"unit_price": number
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"line_total": number,"order_id": string,"product_id"?: string | null,"product_name": string,"quantity": number,"sku": string,"unit"?: string,"unit_price": number
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"line_total"?: number,"order_id"?: string,"product_id"?: string | null,"product_name"?: string,"quantity"?: number,"sku"?: string,"unit"?: string,"unit_price"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"order_status_history": {
                  Row: {
                    "changed_by": string | null,"created_at": string,"from_status": Database["public"]['Enums']["order_status"] | null,"id": number,"note": string | null,"order_id": string,"to_status": Database["public"]['Enums']["order_status"]
                  }
                  Insert: {
                    "changed_by"?: string | null,"created_at"?: string,"from_status"?: Database["public"]['Enums']["order_status"] | null,"id"?: never,"note"?: string | null,"order_id": string,"to_status": Database["public"]['Enums']["order_status"]
                  }
                  Update: {
                    "changed_by"?: string | null,"created_at"?: string,"from_status"?: Database["public"]['Enums']["order_status"] | null,"id"?: never,"note"?: string | null,"order_id"?: string,"to_status"?: Database["public"]['Enums']["order_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_status_history_changed_by_fkey"
      columns: ["changed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_status_history_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "admin_notes": string | null,"approved_at": string | null,"cancelled_at": string | null,"client_request_id": string | null,"created_at": string,"customer_reference": string | null,"delivered_at": string | null,"discount": number,"dispatched_at": string | null,"id": string,"item_count": number,"order_number": string,"placed_by": string | null,"status": Database["public"]['Enums']["order_status"],"subtotal": number,"total_amount": number,"total_units": number,"updated_at": string,"vendor_id": string | null,"vendor_notes": string | null
                  }
                  Insert: {
                    "admin_notes"?: string | null,"approved_at"?: string | null,"cancelled_at"?: string | null,"client_request_id"?: string | null,"created_at"?: string,"customer_reference"?: string | null,"delivered_at"?: string | null,"discount"?: number,"dispatched_at"?: string | null,"id"?: string,"item_count"?: number,"order_number"?: string,"placed_by"?: string | null,"status"?: Database["public"]['Enums']["order_status"],"subtotal"?: number,"total_amount"?: number,"total_units"?: number,"updated_at"?: string,"vendor_id"?: string | null,"vendor_notes"?: string | null
                  }
                  Update: {
                    "admin_notes"?: string | null,"approved_at"?: string | null,"cancelled_at"?: string | null,"client_request_id"?: string | null,"created_at"?: string,"customer_reference"?: string | null,"delivered_at"?: string | null,"discount"?: number,"dispatched_at"?: string | null,"id"?: string,"item_count"?: number,"order_number"?: string,"placed_by"?: string | null,"status"?: Database["public"]['Enums']["order_status"],"subtotal"?: number,"total_amount"?: number,"total_units"?: number,"updated_at"?: string,"vendor_id"?: string | null,"vendor_notes"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_placed_by_fkey"
      columns: ["placed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["id"]
    }
                  ]
                },"product_images": {
                  Row: {
                    "alt_text": string,"created_at": string,"id": string,"product_id": string,"sort_order": number,"storage_path": string | null,"url": string
                  }
                  Insert: {
                    "alt_text"?: string,"created_at"?: string,"id"?: string,"product_id": string,"sort_order"?: number,"storage_path"?: string | null,"url": string
                  }
                  Update: {
                    "alt_text"?: string,"created_at"?: string,"id"?: string,"product_id"?: string,"sort_order"?: number,"storage_path"?: string | null,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_images_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"product_trade_prices": {
                  Row: {
                    "dealer_price": number,"max_order_qty": number,"min_order_qty": number,"pack_size": number,"product_id": string,"updated_at": string
                  }
                  Insert: {
                    "dealer_price": number,"max_order_qty"?: number,"min_order_qty"?: number,"pack_size"?: number,"product_id": string,"updated_at"?: string
                  }
                  Update: {
                    "dealer_price"?: number,"max_order_qty"?: number,"min_order_qty"?: number,"pack_size"?: number,"product_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_trade_prices_product_id_fkey"
      columns: ["product_id"]
isOneToOne: true
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "badge": string | null,"category_id": string,"created_at": string,"created_by": string | null,"description": string | null,"highlights": (string)[],"id": string,"is_featured": boolean,"mrp": number | null,"name": string,"price_visible": boolean,"published_at": string | null,"search": unknown,"seo_description": string | null,"seo_title": string | null,"short_description": string | null,"sku": string,"slug": string,"sort_order": number,"specifications": NonNullable<Json>,"status": Database["public"]['Enums']["publish_status"],"stock_status": Database["public"]['Enums']["stock_status"],"tags": (string)[],"unit": string,"updated_at": string,"warranty": string | null
                  }
                  Insert: {
                    "badge"?: string | null,"category_id": string,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"highlights"?: (string)[],"id"?: string,"is_featured"?: boolean,"mrp"?: number | null,"name": string,"price_visible"?: boolean,"published_at"?: string | null,"search"?: never,"seo_description"?: string | null,"seo_title"?: string | null,"short_description"?: string | null,"sku": string,"slug": string,"sort_order"?: number,"specifications"?: NonNullable<Json>,"status"?: Database["public"]['Enums']["publish_status"],"stock_status"?: Database["public"]['Enums']["stock_status"],"tags"?: (string)[],"unit"?: string,"updated_at"?: string,"warranty"?: string | null
                  }
                  Update: {
                    "badge"?: string | null,"category_id"?: string,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"highlights"?: (string)[],"id"?: string,"is_featured"?: boolean,"mrp"?: number | null,"name"?: string,"price_visible"?: boolean,"published_at"?: string | null,"search"?: never,"seo_description"?: string | null,"seo_title"?: string | null,"short_description"?: string | null,"sku"?: string,"slug"?: string,"sort_order"?: number,"specifications"?: NonNullable<Json>,"status"?: Database["public"]['Enums']["publish_status"],"stock_status"?: Database["public"]['Enums']["stock_status"],"tags"?: (string)[],"unit"?: string,"updated_at"?: string,"warranty"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"email": string | null,"full_name": string,"id": string,"last_seen_at": string | null,"phone": string | null,"role": Database["public"]['Enums']["app_role"],"status": Database["public"]['Enums']["account_status"],"updated_at": string
                  }
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"email"?: string | null,"full_name"?: string,"id": string,"last_seen_at"?: string | null,"phone"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"status"?: Database["public"]['Enums']["account_status"],"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"email"?: string | null,"full_name"?: string,"id"?: string,"last_seen_at"?: string | null,"phone"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"status"?: Database["public"]['Enums']["account_status"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"projects": {
                  Row: {
                    "body": string | null,"client": string | null,"completed_on": string | null,"created_at": string,"id": string,"image_url": string | null,"is_published": boolean,"location": string | null,"results": NonNullable<Json>,"segment": string | null,"slug": string,"sort_order": number,"summary": string,"title": string,"updated_at": string
                  }
                  Insert: {
                    "body"?: string | null,"client"?: string | null,"completed_on"?: string | null,"created_at"?: string,"id"?: string,"image_url"?: string | null,"is_published"?: boolean,"location"?: string | null,"results"?: NonNullable<Json>,"segment"?: string | null,"slug": string,"sort_order"?: number,"summary"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string | null,"client"?: string | null,"completed_on"?: string | null,"created_at"?: string,"id"?: string,"image_url"?: string | null,"is_published"?: boolean,"location"?: string | null,"results"?: NonNullable<Json>,"segment"?: string | null,"slug"?: string,"sort_order"?: number,"summary"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"services": {
                  Row: {
                    "created_at": string,"icon": string,"id": string,"is_published": boolean,"sort_order": number,"summary": string,"title": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"icon"?: string,"id"?: string,"is_published"?: boolean,"sort_order"?: number,"summary"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"icon"?: string,"id"?: string,"is_published"?: boolean,"sort_order"?: number,"summary"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"site_settings": {
                  Row: {
                    "key": string,"updated_at": string,"updated_by": string | null,"value": NonNullable<Json>
                  }
                  Insert: {
                    "key": string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Update: {
                    "key"?: string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "site_settings_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"targets": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"metric": Database["public"]['Enums']["target_metric"],"notes": string | null,"period_end": string,"period_start": string,"period_type": Database["public"]['Enums']["target_period"],"status": Database["public"]['Enums']["record_status"],"target_value": number,"title": string,"updated_at": string,"vendor_id": string
                  }
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"metric"?: Database["public"]['Enums']["target_metric"],"notes"?: string | null,"period_end": string,"period_start": string,"period_type"?: Database["public"]['Enums']["target_period"],"status"?: Database["public"]['Enums']["record_status"],"target_value": number,"title"?: string,"updated_at"?: string,"vendor_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"metric"?: Database["public"]['Enums']["target_metric"],"notes"?: string | null,"period_end"?: string,"period_start"?: string,"period_type"?: Database["public"]['Enums']["target_period"],"status"?: Database["public"]['Enums']["record_status"],"target_value"?: number,"title"?: string,"updated_at"?: string,"vendor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "targets_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "targets_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["id"]
    }
                  ]
                },"testimonials": {
                  Row: {
                    "author_name": string,"author_role": string | null,"avatar_url": string | null,"company": string | null,"created_at": string,"id": string,"is_published": boolean,"location": string | null,"quote": string,"rating": number,"sort_order": number,"updated_at": string
                  }
                  Insert: {
                    "author_name": string,"author_role"?: string | null,"avatar_url"?: string | null,"company"?: string | null,"created_at"?: string,"id"?: string,"is_published"?: boolean,"location"?: string | null,"quote": string,"rating"?: number,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "author_name"?: string,"author_role"?: string | null,"avatar_url"?: string | null,"company"?: string | null,"created_at"?: string,"id"?: string,"is_published"?: boolean,"location"?: string | null,"quote"?: string,"rating"?: number,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"vendor_incentives": {
                  Row: {
                    "approved_at": string | null,"basis_value": number,"breakdown": NonNullable<Json>,"calculated_at": string,"created_at": string,"earned_amount": number,"explanation": string,"id": string,"paid_at": string | null,"payment_reference": string | null,"scheme_id": string,"status": Database["public"]['Enums']["incentive_status"],"updated_at": string,"vendor_id": string
                  }
                  Insert: {
                    "approved_at"?: string | null,"basis_value"?: number,"breakdown"?: NonNullable<Json>,"calculated_at"?: string,"created_at"?: string,"earned_amount"?: number,"explanation"?: string,"id"?: string,"paid_at"?: string | null,"payment_reference"?: string | null,"scheme_id": string,"status"?: Database["public"]['Enums']["incentive_status"],"updated_at"?: string,"vendor_id": string
                  }
                  Update: {
                    "approved_at"?: string | null,"basis_value"?: number,"breakdown"?: NonNullable<Json>,"calculated_at"?: string,"created_at"?: string,"earned_amount"?: number,"explanation"?: string,"id"?: string,"paid_at"?: string | null,"payment_reference"?: string | null,"scheme_id"?: string,"status"?: Database["public"]['Enums']["incentive_status"],"updated_at"?: string,"vendor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "vendor_incentives_scheme_id_fkey"
      columns: ["scheme_id"]
isOneToOne: false
      referencedRelation: "incentive_schemes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "vendor_incentives_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["id"]
    }
                  ]
                },"vendors": {
                  Row: {
                    "address_line": string | null,"area": string | null,"assigned_manager": string | null,"business_name": string,"city": string | null,"code": string,"contact_name": string,"created_at": string,"credit_limit": number,"district": string | null,"email": string | null,"gstin": string | null,"id": string,"metadata": NonNullable<Json>,"notes": string | null,"phone": string,"pincode": string | null,"profile_id": string | null,"state": string | null,"status": Database["public"]['Enums']["account_status"],"tier": string,"updated_at": string,"whatsapp": string | null
                  }
                  Insert: {
                    "address_line"?: string | null,"area"?: string | null,"assigned_manager"?: string | null,"business_name": string,"city"?: string | null,"code"?: string,"contact_name"?: string,"created_at"?: string,"credit_limit"?: number,"district"?: string | null,"email"?: string | null,"gstin"?: string | null,"id"?: string,"metadata"?: NonNullable<Json>,"notes"?: string | null,"phone"?: string,"pincode"?: string | null,"profile_id"?: string | null,"state"?: string | null,"status"?: Database["public"]['Enums']["account_status"],"tier"?: string,"updated_at"?: string,"whatsapp"?: string | null
                  }
                  Update: {
                    "address_line"?: string | null,"area"?: string | null,"assigned_manager"?: string | null,"business_name"?: string,"city"?: string | null,"code"?: string,"contact_name"?: string,"created_at"?: string,"credit_limit"?: number,"district"?: string | null,"email"?: string | null,"gstin"?: string | null,"id"?: string,"metadata"?: NonNullable<Json>,"notes"?: string | null,"phone"?: string,"pincode"?: string | null,"profile_id"?: string | null,"state"?: string | null,"status"?: Database["public"]['Enums']["account_status"],"tier"?: string,"updated_at"?: string,"whatsapp"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "vendors_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "target_progress": {
                  Row: {
                    "achieved": number | null,"achievement_pct": number | null,"business_name": string | null,"created_at": string | null,"id": string | null,"metric": Database["public"]['Enums']["target_metric"] | null,"notes": string | null,"period_elapsed_pct": number | null,"period_end": string | null,"period_start": string | null,"period_type": Database["public"]['Enums']["target_period"] | null,"remaining": number | null,"status": Database["public"]['Enums']["record_status"] | null,"target_value": number | null,"title": string | null,"vendor_code": string | null,"vendor_id": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "targets_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "admin_overview":
{ Args: { "p_from": string,"p_to": string }; Returns: Json
                           },
"assert_admin":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"auth_role":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["app_role"]
                           },
"broadcast_notification":
{ Args: { "p_message": string,"p_title": string,"p_type"?: Database["public"]['Enums']["notification_type"],"p_vendor_ids"?: (string)[] }; Returns: number
                           },
"calculate_scheme_incentives":
{ Args: { "p_scheme_id": string }; Returns: number
                           },
"cancel_my_order":
{ Args: { "p_order_id": string,"p_reason"?: string }; Returns: {
              "admin_notes": string | null,
"approved_at": string | null,
"cancelled_at": string | null,
"client_request_id": string | null,
"created_at": string,
"customer_reference": string | null,
"delivered_at": string | null,
"discount": number,
"dispatched_at": string | null,
"id": string,
"item_count": number,
"order_number": string,
"placed_by": string | null,
"status": Database["public"]['Enums']["order_status"],
"subtotal": number,
"total_amount": number,
"total_units": number,
"updated_at": string,
"vendor_id": string | null,
"vendor_notes": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "orders"
        isOneToOne: true
        isSetofReturn: false
      } },
"category_breakdown":
{ Args: { "p_from": string,"p_to": string }; Returns: {
              "category_id": string,"name": string,"sales": number,"share": number,"units": number
            }[]
                           },
"current_vendor_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"enquiry_stats":
{ Args: { "p_from": string,"p_to": string }; Returns: Json
                           },
"format_metric":
{ Args: { "p_metric": Database["public"]['Enums']["target_metric"],"p_value": number }; Returns: string
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_sale_status":
{ Args: { "s": Database["public"]['Enums']["order_status"] }; Returns: boolean
                           },
"is_service_context":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_super_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"local_date":
{ Args: { "ts": string }; Returns: string
                           },
"log_enquiry":
{ Args: { "p_device"?: string,"p_page_path"?: string,"p_product_id"?: string,"p_quantity"?: number,"p_referrer"?: string,"p_source"?: string }; Returns: string
                           },
"mark_all_notifications_read":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"move_category_products":
{ Args: { "p_from": string,"p_to": string }; Returns: number
                           },
"notify":
{ Args: { "p_link"?: string,"p_message": string,"p_recipient": string,"p_title": string,"p_type": Database["public"]['Enums']["notification_type"] }; Returns: undefined
                           },
"notify_admins":
{ Args: { "p_link"?: string,"p_message": string,"p_title": string,"p_type": Database["public"]['Enums']["notification_type"] }; Returns: undefined
                           },
"order_funnel":
{ Args: { "p_from": string,"p_to": string }; Returns: Json
                           },
"order_status_label":
{ Args: { "s": Database["public"]['Enums']["order_status"] }; Returns: string
                           },
"order_transition_allowed":
{ Args: { "p_from": Database["public"]['Enums']["order_status"],"p_to": Database["public"]['Enums']["order_status"] }; Returns: boolean
                           },
"place_order":
{ Args: { "p_client_request_id"?: string,"p_items": Json,"p_notes"?: string }; Returns: {
              "admin_notes": string | null,
"approved_at": string | null,
"cancelled_at": string | null,
"client_request_id": string | null,
"created_at": string,
"customer_reference": string | null,
"delivered_at": string | null,
"discount": number,
"dispatched_at": string | null,
"id": string,
"item_count": number,
"order_number": string,
"placed_by": string | null,
"status": Database["public"]['Enums']["order_status"],
"subtotal": number,
"total_amount": number,
"total_units": number,
"updated_at": string,
"vendor_id": string | null,
"vendor_notes": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "orders"
        isOneToOne: true
        isSetofReturn: false
      } },
"sales_trend":
{ Args: { "p_bucket"?: string,"p_category_id"?: string,"p_from": string,"p_to": string,"p_vendor_id"?: string }; Returns: {
              "bucket": string,"orders": number,"sales": number,"units": number
            }[]
                           },
"search_products":
{ Args: { "p_category"?: string,"p_limit"?: number,"p_offset"?: number,"p_query"?: string,"p_sort"?: string,"p_stock"?: string }; Returns: {
              "badge": string,"category_id": string,"category_name": string,"category_slug": string,"created_at": string,"highlights": (string)[],"id": string,"image_url": string,"is_featured": boolean,"mrp": number,"name": string,"price_visible": boolean,"rank": number,"short_description": string,"sku": string,"slug": string,"stock_status": Database["public"]['Enums']["stock_status"],"total_count": number,"unit": string
            }[]
                           },
"submit_lead":
{ Args: { "p_business_name"?: string,"p_city"?: string,"p_email"?: string,"p_message"?: string,"p_metadata"?: Json,"p_name": string,"p_phone": string,"p_subject"?: string,"p_type": Database["public"]['Enums']["lead_type"] }; Returns: string
                           },
"tags_to_text":
{ Args: { "tags": (string)[] }; Returns: string
                           },
"top_products":
{ Args: { "p_category_id"?: string,"p_from": string,"p_limit"?: number,"p_to": string,"p_vendor_id"?: string }; Returns: {
              "category_name": string,"enquiries": number,"name": string,"orders": number,"product_id": string,"sales": number,"sku": string,"units": number
            }[]
                           },
"update_order_status":
{ Args: { "p_note"?: string,"p_order_id": string,"p_status": Database["public"]['Enums']["order_status"] }; Returns: {
              "admin_notes": string | null,
"approved_at": string | null,
"cancelled_at": string | null,
"client_request_id": string | null,
"created_at": string,
"customer_reference": string | null,
"delivered_at": string | null,
"discount": number,
"dispatched_at": string | null,
"id": string,
"item_count": number,
"order_number": string,
"placed_by": string | null,
"status": Database["public"]['Enums']["order_status"],
"subtotal": number,
"total_amount": number,
"total_units": number,
"updated_at": string,
"vendor_id": string | null,
"vendor_notes": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "orders"
        isOneToOne: true
        isSetofReturn: false
      } },
"vendor_overview":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"vendor_performance":
{ Args: { "p_from": string,"p_to": string }; Returns: {
              "business_name": string,"city": string,"code": string,"incentive_earned": number,"last_order_at": string,"orders": number,"sales": number,"status": Database["public"]['Enums']["account_status"],"target_achieved": number,"target_pct": number,"target_value": number,"tier": string,"units": number,"vendor_id": string
            }[]
                           },
"vendor_sales_basis":
{ Args: { "p_from": string,"p_metric": Database["public"]['Enums']["target_metric"],"p_to": string,"p_vendor_id": string }; Returns: number
                           }
          }
          Enums: {
            "account_status": "active"|"inactive"|"suspended","app_role": "super_admin"|"admin"|"vendor","incentive_calc": "percentage"|"slab"|"target_bonus","incentive_status": "pending"|"earned"|"approved"|"paid"|"void","lead_status": "new"|"contacted"|"qualified"|"converted"|"closed","lead_type": "contact"|"dealer_application"|"bulk_quote","notification_type": "order"|"target"|"incentive"|"announcement"|"system","order_status": "pending"|"approved"|"processing"|"dispatched"|"delivered"|"cancelled"|"rejected","publish_status": "draft"|"published"|"archived","record_status": "active"|"closed"|"cancelled","scheme_status": "draft"|"active"|"closed","stock_status": "in_stock"|"low_stock"|"out_of_stock"|"made_to_order","target_metric": "revenue"|"units"|"orders","target_period": "monthly"|"quarterly"|"yearly"|"custom"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "account_status": ["active", "inactive", "suspended"],"app_role": ["super_admin", "admin", "vendor"],"incentive_calc": ["percentage", "slab", "target_bonus"],"incentive_status": ["pending", "earned", "approved", "paid", "void"],"lead_status": ["new", "contacted", "qualified", "converted", "closed"],"lead_type": ["contact", "dealer_application", "bulk_quote"],"notification_type": ["order", "target", "incentive", "announcement", "system"],"order_status": ["pending", "approved", "processing", "dispatched", "delivered", "cancelled", "rejected"],"publish_status": ["draft", "published", "archived"],"record_status": ["active", "closed", "cancelled"],"scheme_status": ["draft", "active", "closed"],"stock_status": ["in_stock", "low_stock", "out_of_stock", "made_to_order"],"target_metric": ["revenue", "units", "orders"],"target_period": ["monthly", "quarterly", "yearly", "custom"]
          }
        }
} as const

