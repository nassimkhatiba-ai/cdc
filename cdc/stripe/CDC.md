# Stripe API — CDC (Code-Call Descriptor)

Base URL: https://api.stripe.com/
## How to call this API (CDC pattern)

Write ONE Node.js (18+) script per question. Rules:
1. HTTP Basic auth: user/token from $CDC_STRIPE_TOKEN (`authorization: Basic base64(user:token)`).
2. Fetch only what you need; paginate with per_page/page params where offered.
3. Do ALL filtering/aggregation/arithmetic IN THE SCRIPT — never in your head.
4. Print ONLY the final answer to stdout. Raw API payloads must never be
   echoed, logged, or pasted into the conversation.
5. On HTTP errors, print status + first 200 chars of the body and stop.

Query params: `*` = required. Response shapes show top-level fields only.

## misc
GET /v1/account?expand -> {business_profile,business_type,capabilities,charges_enabled,company,controller,country,created,default_currency,details_submitted,email,external_accounts,+11more} — Retrieve account
POST /v1/account_links -> {created,expires_at,object,url} — Create an account link
POST /v1/account_sessions -> {account,client_secret,components,expires_at,livemode,object} — Create an Account Session
GET /v1/accounts?created&ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all connected accounts
POST /v1/accounts -> {business_profile,business_type,capabilities,charges_enabled,company,controller,country,created,default_currency,details_submitted,email,external_accounts,+11more}
GET /v1/accounts/{account}?expand -> {business_profile,business_type,capabilities,charges_enabled,company,controller,country,created,default_currency,details_submitted,email,external_accounts,+11more} — Retrieve account
POST /v1/accounts/{account} -> {business_profile,business_type,capabilities,charges_enabled,company,controller,country,created,default_currency,details_submitted,email,external_accounts,+11more} — Update an account
DELETE /v1/accounts/{account} -> {deleted,id,object} — Delete an account
POST /v1/accounts/{account}/bank_accounts -> any — Create an external account
GET /v1/accounts/{account}/bank_accounts/{id}?expand -> any — Retrieve an external account
POST /v1/accounts/{account}/bank_accounts/{id} -> any
DELETE /v1/accounts/{account}/bank_accounts/{id} -> any — Delete an external account
GET /v1/accounts/{account}/capabilities?expand -> {data,has_more,object,url} — List all account capabilities
GET /v1/accounts/{account}/capabilities/{capability}?expand -> {account,future_requirements,id,object,requested,requested_at,requirements,status} — Retrieve an Account Capability
POST /v1/accounts/{account}/capabilities/{capability} -> {account,future_requirements,id,object,requested,requested_at,requirements,status} — Update an Account Capability
GET /v1/accounts/{account}/external_accounts?ending_before&expand&limit&object&starting_after -> {data,has_more,object,url} — List all external accounts
POST /v1/accounts/{account}/external_accounts -> any — Create an external account
GET /v1/accounts/{account}/external_accounts/{id}?expand -> any — Retrieve an external account
POST /v1/accounts/{account}/external_accounts/{id} -> any
DELETE /v1/accounts/{account}/external_accounts/{id} -> any — Delete an external account
POST /v1/accounts/{account}/login_links -> {created,object,url} — Create a login link
GET /v1/accounts/{account}/people?ending_before&expand&limit&relationship&starting_after -> {data,has_more,object,url} — List all persons
POST /v1/accounts/{account}/people -> {account,additional_tos_acceptances,address,address_kana,address_kanji,created,dob,email,first_name,first_name_kana,first_name_kanji,full_name_aliases,+20more} — Create a person
GET /v1/accounts/{account}/people/{person}?expand -> {account,additional_tos_acceptances,address,address_kana,address_kanji,created,dob,email,first_name,first_name_kana,first_name_kanji,full_name_aliases,+20more} — Retrieve a person
POST /v1/accounts/{account}/people/{person} -> {account,additional_tos_acceptances,address,address_kana,address_kanji,created,dob,email,first_name,first_name_kana,first_name_kanji,full_name_aliases,+20more} — Update a person
DELETE /v1/accounts/{account}/people/{person} -> {deleted,id,object} — Delete a person
GET /v1/accounts/{account}/persons?ending_before&expand&limit&relationship&starting_after -> {data,has_more,object,url} — List all persons
POST /v1/accounts/{account}/persons -> {account,additional_tos_acceptances,address,address_kana,address_kanji,created,dob,email,first_name,first_name_kana,first_name_kanji,full_name_aliases,+20more} — Create a person
GET /v1/accounts/{account}/persons/{person}?expand -> {account,additional_tos_acceptances,address,address_kana,address_kanji,created,dob,email,first_name,first_name_kana,first_name_kanji,full_name_aliases,+20more} — Retrieve a person
POST /v1/accounts/{account}/persons/{person} -> {account,additional_tos_acceptances,address,address_kana,address_kanji,created,dob,email,first_name,first_name_kana,first_name_kanji,full_name_aliases,+20more} — Update a person
DELETE /v1/accounts/{account}/persons/{person} -> {deleted,id,object} — Delete a person
POST /v1/accounts/{account}/reject -> {business_profile,business_type,capabilities,charges_enabled,company,controller,country,created,default_currency,details_submitted,email,external_accounts,+11more} — Reject an account
GET /v1/apple_pay/domains?domain_name&ending_before&expand&limit&starting_after -> {data,has_more,object,url}
POST /v1/apple_pay/domains -> {created,domain_name,id,livemode,object}
GET /v1/apple_pay/domains/{domain}?expand -> {created,domain_name,id,livemode,object}
DELETE /v1/apple_pay/domains/{domain} -> {deleted,id,object}
GET /v1/application_fees?charge&created&ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all application fees
GET /v1/application_fees/{fee}/refunds/{id}?expand -> {amount,balance_transaction,created,currency,fee,id,metadata,object} — Retrieve an application fee refund
POST /v1/application_fees/{fee}/refunds/{id} -> {amount,balance_transaction,created,currency,fee,id,metadata,object} — Update an application fee refund
GET /v1/application_fees/{id}?expand -> {account,amount,amount_refunded,application,balance_transaction,charge,created,currency,fee_source,id,livemode,object,+3more} — Retrieve an application fee
POST /v1/application_fees/{id}/refund -> {account,amount,amount_refunded,application,balance_transaction,charge,created,currency,fee_source,id,livemode,object,+3more}
GET /v1/application_fees/{id}/refunds?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all application fee refunds
POST /v1/application_fees/{id}/refunds -> {amount,balance_transaction,created,currency,fee,id,metadata,object} — Create an application fee refund
GET /v1/apps/secrets?ending_before&expand&limit&scope*&starting_after -> {data,has_more,object,url} — List secrets
POST /v1/apps/secrets -> {created,deleted,expires_at,id,livemode,name,object,payload,scope} — Set a Secret
POST /v1/apps/secrets/delete -> {created,deleted,expires_at,id,livemode,name,object,payload,scope} — Delete a Secret
GET /v1/apps/secrets/find?expand&name*&scope* -> {created,deleted,expires_at,id,livemode,name,object,payload,scope} — Find a Secret
GET /v1/balance?expand -> {available,connect_reserved,instant_available,issuing,livemode,object,pending,refund_and_dispute_prefunding} — Retrieve balance
GET /v1/balance/history?created&currency&ending_before&expand&limit&payout&source&starting_after&type -> {data,has_more,object,url} — List all balance transactions
GET /v1/balance/history/{id}?expand -> {amount,available_on,balance_type,created,currency,description,exchange_rate,fee,fee_details,id,net,object,+4more} — Retrieve a balance transaction
GET /v1/balance_settings?expand -> {object,payments} — Retrieve balance settings
POST /v1/balance_settings -> {object,payments} — Update balance settings
GET /v1/balance_transactions?created&currency&ending_before&expand&limit&payout&source&starting_after&type -> {data,has_more,object,url} — List all balance transactions
GET /v1/balance_transactions/{id}?expand -> {amount,available_on,balance_type,created,currency,description,exchange_rate,fee,fee_details,id,net,object,+4more} — Retrieve a balance transaction
GET /v1/billing/alerts?alert_type&ending_before&expand&limit&meter&starting_after -> {data,has_more,object,url} — List billing alerts
POST /v1/billing/alerts -> {alert_type,id,livemode,object,status,title,usage_threshold} — Create a billing alert
GET /v1/billing/alerts/{id}?expand -> {alert_type,id,livemode,object,status,title,usage_threshold} — Retrieve a billing alert
POST /v1/billing/alerts/{id}/activate -> {alert_type,id,livemode,object,status,title,usage_threshold} — Activate a billing alert
POST /v1/billing/alerts/{id}/archive -> {alert_type,id,livemode,object,status,title,usage_threshold} — Archive a billing alert
POST /v1/billing/alerts/{id}/deactivate -> {alert_type,id,livemode,object,status,title,usage_threshold} — Deactivate a billing alert
GET /v1/billing/credit_balance_summary?customer&customer_account&expand&filter* -> {balances,customer,customer_account,livemode,object} — Retrieve the credit balance summary for a customer
GET /v1/billing/credit_balance_transactions?credit_grant&customer&customer_account&ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List credit balance transactions
GET /v1/billing/credit_balance_transactions/{id}?expand -> {created,credit,credit_grant,debit,effective_at,id,livemode,object,test_clock,type} — Retrieve a credit balance transaction
GET /v1/billing/credit_grants?customer&customer_account&ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List credit grants
POST /v1/billing/credit_grants -> {amount,applicability_config,category,created,customer,customer_account,effective_at,expires_at,id,livemode,metadata,name,+5more} — Create a credit grant
GET /v1/billing/credit_grants/{id}?expand -> {amount,applicability_config,category,created,customer,customer_account,effective_at,expires_at,id,livemode,metadata,name,+5more} — Retrieve a credit grant
POST /v1/billing/credit_grants/{id} -> {amount,applicability_config,category,created,customer,customer_account,effective_at,expires_at,id,livemode,metadata,name,+5more} — Update a credit grant
POST /v1/billing/credit_grants/{id}/expire -> {amount,applicability_config,category,created,customer,customer_account,effective_at,expires_at,id,livemode,metadata,name,+5more} — Expire a credit grant
POST /v1/billing/credit_grants/{id}/void -> {amount,applicability_config,category,created,customer,customer_account,effective_at,expires_at,id,livemode,metadata,name,+5more} — Void a credit grant
POST /v1/billing/meter_event_adjustments -> {cancel,event_name,livemode,object,status,type} — Create a billing meter event adjustment
POST /v1/billing/meter_events -> {created,event_name,identifier,livemode,object,payload,timestamp} — Create a billing meter event
GET /v1/billing/meters?ending_before&expand&limit&starting_after&status -> {data,has_more,object,url} — List billing meters
POST /v1/billing/meters -> {created,customer_mapping,default_aggregation,display_name,event_name,event_time_window,id,livemode,object,status,status_transitions,updated,+1more} — Create a billing meter
GET /v1/billing/meters/{id}?expand -> {created,customer_mapping,default_aggregation,display_name,event_name,event_time_window,id,livemode,object,status,status_transitions,updated,+1more} — Retrieve a billing meter
POST /v1/billing/meters/{id} -> {created,customer_mapping,default_aggregation,display_name,event_name,event_time_window,id,livemode,object,status,status_transitions,updated,+1more} — Update a billing meter
POST /v1/billing/meters/{id}/deactivate -> {created,customer_mapping,default_aggregation,display_name,event_name,event_time_window,id,livemode,object,status,status_transitions,updated,+1more} — Deactivate a billing meter
GET /v1/billing/meters/{id}/event_summaries?customer*&end_time*&ending_before&expand&limit&start_time*&starting_after&value_grouping_window -> {data,has_more,object,url} — List billing meter event summaries
POST /v1/billing/meters/{id}/reactivate -> {created,customer_mapping,default_aggregation,display_name,event_name,event_time_window,id,livemode,object,status,status_transitions,updated,+1more} — Reactivate a billing meter
GET /v1/billing_portal/configurations?active&ending_before&expand&is_default&limit&starting_after -> {data,has_more,object,url} — List portal configurations
POST /v1/billing_portal/configurations -> {active,application,business_profile,created,default_return_url,features,id,is_default,livemode,login_page,metadata,name,+2more} — Create a portal configuration
GET /v1/billing_portal/configurations/{configuration}?expand -> {active,application,business_profile,created,default_return_url,features,id,is_default,livemode,login_page,metadata,name,+2more} — Retrieve a portal configuration
POST /v1/billing_portal/configurations/{configuration} -> {active,application,business_profile,created,default_return_url,features,id,is_default,livemode,login_page,metadata,name,+2more} — Update a portal configuration
POST /v1/billing_portal/sessions -> {configuration,created,customer,customer_account,flow,id,livemode,locale,object,on_behalf_of,return_url,url} — Create a portal session
GET /v1/charges?created&customer&ending_before&expand&limit&payment_intent&starting_after&transfer_group -> {data,has_more,object,url} — List all charges
POST /v1/charges -> {amount,amount_captured,amount_refunded,application,application_fee,application_fee_amount,balance_transaction,billing_details,calculated_statement_descriptor,captured,created,currency,+33more}
GET /v1/charges/search?expand&limit&page&query* -> {data,has_more,next_page,object,total_count,url} — Search charges
GET /v1/charges/{charge}?expand -> {amount,amount_captured,amount_refunded,application,application_fee,application_fee_amount,balance_transaction,billing_details,calculated_statement_descriptor,captured,created,currency,+33more} — Retrieve a charge
POST /v1/charges/{charge} -> {amount,amount_captured,amount_refunded,application,application_fee,application_fee_amount,balance_transaction,billing_details,calculated_statement_descriptor,captured,created,currency,+33more} — Update a charge
POST /v1/charges/{charge}/capture -> {amount,amount_captured,amount_refunded,application,application_fee,application_fee_amount,balance_transaction,billing_details,calculated_statement_descriptor,captured,created,currency,+33more} — Capture a payment
GET /v1/charges/{charge}/dispute?expand -> {amount,balance_transactions,charge,created,currency,enhanced_eligibility_types,evidence,evidence_details,id,is_charge_refundable,livemode,metadata,+5more}
POST /v1/charges/{charge}/dispute -> {amount,balance_transactions,charge,created,currency,enhanced_eligibility_types,evidence,evidence_details,id,is_charge_refundable,livemode,metadata,+5more}
POST /v1/charges/{charge}/dispute/close -> {amount,balance_transactions,charge,created,currency,enhanced_eligibility_types,evidence,evidence_details,id,is_charge_refundable,livemode,metadata,+5more}
POST /v1/charges/{charge}/refund -> {amount,amount_captured,amount_refunded,application,application_fee,application_fee_amount,balance_transaction,billing_details,calculated_statement_descriptor,captured,created,currency,+33more} — Create a refund
GET /v1/charges/{charge}/refunds?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all refunds
POST /v1/charges/{charge}/refunds -> {amount,balance_transaction,charge,created,currency,description,destination_details,failure_balance_transaction,failure_reason,id,instructions_email,metadata,+10more} — Create customer balance refund
GET /v1/charges/{charge}/refunds/{refund}?expand -> {amount,balance_transaction,charge,created,currency,description,destination_details,failure_balance_transaction,failure_reason,id,instructions_email,metadata,+10more}
POST /v1/charges/{charge}/refunds/{refund} -> {amount,balance_transaction,charge,created,currency,description,destination_details,failure_balance_transaction,failure_reason,id,instructions_email,metadata,+10more}
GET /v1/checkout/sessions?created&customer&customer_account&customer_details&ending_before&expand&limit&payment_intent&payment_link&starting_after&status&subscription -> {data,has_more,object,url} — List all Checkout Sessions
POST /v1/checkout/sessions -> {adaptive_pricing,after_expiration,allow_promotion_codes,amount_subtotal,amount_total,automatic_tax,billing_address_collection,branding_settings,cancel_url,client_reference_id,client_secret,collected_information,+56more} — Create a Checkout Session
GET /v1/checkout/sessions/{session}?expand -> {adaptive_pricing,after_expiration,allow_promotion_codes,amount_subtotal,amount_total,automatic_tax,billing_address_collection,branding_settings,cancel_url,client_reference_id,client_secret,collected_information,+56more} — Retrieve a Checkout Session
POST /v1/checkout/sessions/{session} -> {adaptive_pricing,after_expiration,allow_promotion_codes,amount_subtotal,amount_total,automatic_tax,billing_address_collection,branding_settings,cancel_url,client_reference_id,client_secret,collected_information,+56more} — Update a Checkout Session
POST /v1/checkout/sessions/{session}/expire -> {adaptive_pricing,after_expiration,allow_promotion_codes,amount_subtotal,amount_total,automatic_tax,billing_address_collection,branding_settings,cancel_url,client_reference_id,client_secret,collected_information,+56more} — Expire a Checkout Session
GET /v1/checkout/sessions/{session}/line_items?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — Retrieve a Checkout Session's line items
GET /v1/climate/orders?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List orders
POST /v1/climate/orders -> {amount_fees,amount_subtotal,amount_total,beneficiary,canceled_at,cancellation_reason,certificate,confirmed_at,created,currency,delayed_at,delivered_at,+10more} — Create an order
GET /v1/climate/orders/{order}?expand -> {amount_fees,amount_subtotal,amount_total,beneficiary,canceled_at,cancellation_reason,certificate,confirmed_at,created,currency,delayed_at,delivered_at,+10more} — Retrieve an order
POST /v1/climate/orders/{order} -> {amount_fees,amount_subtotal,amount_total,beneficiary,canceled_at,cancellation_reason,certificate,confirmed_at,created,currency,delayed_at,delivered_at,+10more} — Update an order
POST /v1/climate/orders/{order}/cancel -> {amount_fees,amount_subtotal,amount_total,beneficiary,canceled_at,cancellation_reason,certificate,confirmed_at,created,currency,delayed_at,delivered_at,+10more} — Cancel an order
GET /v1/climate/products?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List products
GET /v1/climate/products/{product}?expand -> {created,current_prices_per_metric_ton,delivery_year,id,livemode,metric_tons_available,name,object,suppliers} — Retrieve a product
GET /v1/climate/suppliers?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List suppliers
GET /v1/climate/suppliers/{supplier}?expand -> {id,info_url,livemode,locations,name,object,removal_pathway} — Retrieve a supplier
GET /v1/confirmation_tokens/{confirmation_token}?expand -> {created,expires_at,id,livemode,mandate_data,object,payment_intent,payment_method_options,payment_method_preview,return_url,setup_future_usage,setup_intent,+2more} — Retrieve a ConfirmationToken
GET /v1/country_specs?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List Country Specs
GET /v1/country_specs/{country}?expand -> {default_currency,id,object,supported_bank_account_currencies,supported_payment_currencies,supported_payment_methods,supported_transfer_countries,verification_fields} — Retrieve a Country Spec
GET /v1/coupons?created&ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all coupons
POST /v1/coupons -> {amount_off,applies_to,created,currency,currency_options,duration,duration_in_months,id,livemode,max_redemptions,metadata,name,+5more} — Create a coupon
GET /v1/coupons/{coupon}?expand -> {amount_off,applies_to,created,currency,currency_options,duration,duration_in_months,id,livemode,max_redemptions,metadata,name,+5more} — Retrieve a coupon
POST /v1/coupons/{coupon} -> {amount_off,applies_to,created,currency,currency_options,duration,duration_in_months,id,livemode,max_redemptions,metadata,name,+5more} — Update a coupon
DELETE /v1/coupons/{coupon} -> {deleted,id,object} — Delete a coupon
GET /v1/credit_notes?created&customer&customer_account&ending_before&expand&invoice&limit&starting_after -> {data,has_more,object,url} — List all credit notes
POST /v1/credit_notes -> {amount,amount_shipping,created,currency,customer,customer_account,customer_balance_transaction,discount_amount,discount_amounts,effective_at,id,invoice,+22more} — Create a credit note
GET /v1/credit_notes/preview?amount&credit_amount&effective_at&email_type&expand&invoice*&lines&memo&metadata&out_of_band_amount&reason&refund_amount&refunds&shipping_cost -> {amount,amount_shipping,created,currency,customer,customer_account,customer_balance_transaction,discount_amount,discount_amounts,effective_at,id,invoice,+22more} — Preview a credit note
GET /v1/credit_notes/preview/lines?amount&credit_amount&effective_at&email_type&ending_before&expand&invoice*&limit&lines&memo&metadata&out_of_band_amount&reason&refund_amount&refunds&shipping_cost&starting_after -> {data,has_more,object,url} — Retrieve a credit note preview's line items
GET /v1/credit_notes/{credit_note}/lines?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — Retrieve a credit note's line items
GET /v1/credit_notes/{id}?expand -> {amount,amount_shipping,created,currency,customer,customer_account,customer_balance_transaction,discount_amount,discount_amounts,effective_at,id,invoice,+22more} — Retrieve a credit note
POST /v1/credit_notes/{id} -> {amount,amount_shipping,created,currency,customer,customer_account,customer_balance_transaction,discount_amount,discount_amounts,effective_at,id,invoice,+22more} — Update a credit note
POST /v1/credit_notes/{id}/void -> {amount,amount_shipping,created,currency,customer,customer_account,customer_balance_transaction,discount_amount,discount_amounts,effective_at,id,invoice,+22more} — Void a credit note
POST /v1/customer_sessions -> {client_secret,components,created,customer,customer_account,expires_at,livemode,object} — Create a Customer Session
GET /v1/customers?created&email&ending_before&expand&limit&starting_after&test_clock -> {data,has_more,object,url} — List all customers
POST /v1/customers -> {address,balance,business_name,cash_balance,created,currency,customer_account,default_source,delinquent,description,discount,email,+19more} — Create a customer
GET /v1/customers/search?expand&limit&page&query* -> {data,has_more,next_page,object,total_count,url} — Search customers
GET /v1/customers/{customer}?expand -> any — Retrieve a customer
POST /v1/customers/{customer} -> {address,balance,business_name,cash_balance,created,currency,customer_account,default_source,delinquent,description,discount,email,+19more} — Update a customer
DELETE /v1/customers/{customer} -> {deleted,id,object} — Delete a customer
GET /v1/customers/{customer}/balance_transactions?created&ending_before&expand&invoice&limit&starting_after -> {data,has_more,object,url} — List customer balance transactions
POST /v1/customers/{customer}/balance_transactions -> {amount,checkout_session,created,credit_note,currency,customer,customer_account,description,ending_balance,id,invoice,livemode,+3more} — Create a customer balance transaction
GET /v1/customers/{customer}/balance_transactions/{transaction}?expand -> {amount,checkout_session,created,credit_note,currency,customer,customer_account,description,ending_balance,id,invoice,livemode,+3more} — Retrieve a customer balance transaction
POST /v1/customers/{customer}/balance_transactions/{transaction} -> {amount,checkout_session,created,credit_note,currency,customer,customer_account,description,ending_balance,id,invoice,livemode,+3more} — Update a customer credit balance transaction
GET /v1/customers/{customer}/bank_accounts?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all bank accounts
POST /v1/customers/{customer}/bank_accounts -> any — Create a card
GET /v1/customers/{customer}/bank_accounts/{id}?expand -> {account,account_holder_name,account_holder_type,account_type,available_payout_methods,bank_name,country,currency,customer,default_for_currency,fingerprint,future_requirements,+7more} — Retrieve a bank account
POST /v1/customers/{customer}/bank_accounts/{id} -> any
DELETE /v1/customers/{customer}/bank_accounts/{id} -> any — Delete a customer source
POST /v1/customers/{customer}/bank_accounts/{id}/verify -> {account,account_holder_name,account_holder_type,account_type,available_payout_methods,bank_name,country,currency,customer,default_for_currency,fingerprint,future_requirements,+7more} — Verify a bank account
GET /v1/customers/{customer}/cards?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all cards
POST /v1/customers/{customer}/cards -> any — Create a card
GET /v1/customers/{customer}/cards/{id}?expand -> {account,address_city,address_country,address_line1,address_line1_check,address_line2,address_state,address_zip,address_zip_check,allow_redisplay,available_payout_methods,brand,+20more} — Retrieve a card
POST /v1/customers/{customer}/cards/{id} -> any
DELETE /v1/customers/{customer}/cards/{id} -> any — Delete a customer source
GET /v1/customers/{customer}/cash_balance?expand -> {available,customer,customer_account,livemode,object,settings} — Retrieve a cash balance
POST /v1/customers/{customer}/cash_balance -> {available,customer,customer_account,livemode,object,settings} — Update a cash balance's settings
GET /v1/customers/{customer}/cash_balance_transactions?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List cash balance transactions
GET /v1/customers/{customer}/cash_balance_transactions/{transaction}?expand -> {adjusted_for_overdraft,applied_to_payment,created,currency,customer,customer_account,ending_balance,funded,id,livemode,net_amount,object,+4more} — Retrieve a cash balance transaction
GET /v1/customers/{customer}/discount?expand -> {checkout_session,customer,customer_account,end,id,invoice,invoice_item,object,promotion_code,source,start,subscription,+1more}
DELETE /v1/customers/{customer}/discount -> {checkout_session,customer,customer_account,deleted,id,invoice,invoice_item,object,promotion_code,source,start,subscription,+1more} — Delete a customer discount
POST /v1/customers/{customer}/funding_instructions -> {bank_transfer,currency,funding_type,livemode,object} — Create or retrieve funding instructions for a customer cash balance
GET /v1/customers/{customer}/payment_methods?allow_redisplay&ending_before&expand&limit&starting_after&type -> {data,has_more,object,url} — List a Customer's PaymentMethods
GET /v1/customers/{customer}/payment_methods/{payment_method}?expand -> {acss_debit,affirm,afterpay_clearpay,alipay,allow_redisplay,alma,amazon_pay,au_becs_debit,bacs_debit,bancontact,billie,billing_details,+56more} — Retrieve a Customer's PaymentMethod
GET /v1/customers/{customer}/sources?ending_before&expand&limit&object&starting_after -> {data,has_more,object,url}
POST /v1/customers/{customer}/sources -> any — Create a card
GET /v1/customers/{customer}/sources/{id}?expand -> any
POST /v1/customers/{customer}/sources/{id} -> any
DELETE /v1/customers/{customer}/sources/{id} -> any — Delete a customer source
POST /v1/customers/{customer}/sources/{id}/verify -> {account,account_holder_name,account_holder_type,account_type,available_payout_methods,bank_name,country,currency,customer,default_for_currency,fingerprint,future_requirements,+7more} — Verify a bank account
GET /v1/customers/{customer}/subscriptions?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List active subscriptions
POST /v1/customers/{customer}/subscriptions -> {application,application_fee_percent,automatic_tax,billing_cycle_anchor,billing_cycle_anchor_config,billing_mode,billing_schedules,billing_thresholds,cancel_at,cancel_at_period_end,canceled_at,cancellation_details,+36more} — Create a subscription
GET /v1/customers/{customer}/subscriptions/{subscription_exposed_id}?expand -> {application,application_fee_percent,automatic_tax,billing_cycle_anchor,billing_cycle_anchor_config,billing_mode,billing_schedules,billing_thresholds,cancel_at,cancel_at_period_end,canceled_at,cancellation_details,+36more} — Retrieve a subscription
POST /v1/customers/{customer}/subscriptions/{subscription_exposed_id} -> {application,application_fee_percent,automatic_tax,billing_cycle_anchor,billing_cycle_anchor_config,billing_mode,billing_schedules,billing_thresholds,cancel_at,cancel_at_period_end,canceled_at,cancellation_details,+36more} — Update a subscription on a customer
DELETE /v1/customers/{customer}/subscriptions/{subscription_exposed_id} -> {application,application_fee_percent,automatic_tax,billing_cycle_anchor,billing_cycle_anchor_config,billing_mode,billing_schedules,billing_thresholds,cancel_at,cancel_at_period_end,canceled_at,cancellation_details,+36more} — Cancel a subscription
GET /v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount?expand -> {checkout_session,customer,customer_account,end,id,invoice,invoice_item,object,promotion_code,source,start,subscription,+1more}
DELETE /v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount -> {checkout_session,customer,customer_account,deleted,id,invoice,invoice_item,object,promotion_code,source,start,subscription,+1more} — Delete a customer discount
GET /v1/customers/{customer}/tax_ids?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all Customer tax IDs
POST /v1/customers/{customer}/tax_ids -> {country,created,customer,customer_account,id,livemode,object,owner,type,value,verification} — Create a Customer tax ID
GET /v1/customers/{customer}/tax_ids/{id}?expand -> {country,created,customer,customer_account,id,livemode,object,owner,type,value,verification} — Retrieve a Customer tax ID
DELETE /v1/customers/{customer}/tax_ids/{id} -> {deleted,id,object} — Delete a Customer tax ID
GET /v1/disputes?charge&created&ending_before&expand&limit&payment_intent&starting_after -> {data,has_more,object,url} — List all disputes
GET /v1/disputes/{dispute}?expand -> {amount,balance_transactions,charge,created,currency,enhanced_eligibility_types,evidence,evidence_details,id,is_charge_refundable,livemode,metadata,+5more} — Retrieve a dispute
POST /v1/disputes/{dispute} -> {amount,balance_transactions,charge,created,currency,enhanced_eligibility_types,evidence,evidence_details,id,is_charge_refundable,livemode,metadata,+5more} — Update a dispute
POST /v1/disputes/{dispute}/close -> {amount,balance_transactions,charge,created,currency,enhanced_eligibility_types,evidence,evidence_details,id,is_charge_refundable,livemode,metadata,+5more} — Close a dispute
GET /v1/entitlements/active_entitlements?customer*&ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all active entitlements
GET /v1/entitlements/active_entitlements/{id}?expand -> {feature,id,livemode,lookup_key,object} — Retrieve an active entitlement
GET /v1/entitlements/features?archived&ending_before&expand&limit&lookup_key&starting_after -> {data,has_more,object,url} — List all features
POST /v1/entitlements/features -> {active,id,livemode,lookup_key,metadata,name,object} — Create a feature
GET /v1/entitlements/features/{id}?expand -> {active,id,livemode,lookup_key,metadata,name,object} — Retrieve a feature
POST /v1/entitlements/features/{id} -> {active,id,livemode,lookup_key,metadata,name,object} — Updates a feature
POST /v1/ephemeral_keys -> {created,expires,id,livemode,object,secret} — Create an ephemeral key
DELETE /v1/ephemeral_keys/{key} -> {created,expires,id,livemode,object,secret} — Immediately invalidate an ephemeral key
GET /v1/events?created&delivery_success&ending_before&expand&limit&starting_after&type&types -> {data,has_more,object,url} — List all events
GET /v1/events/{id}?expand -> {account,api_version,context,created,data,id,livemode,object,pending_webhooks,request,type} — Retrieve an event
GET /v1/exchange_rates?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all exchange rates
GET /v1/exchange_rates/{rate_id}?expand -> {id,object,rates} — Retrieve an exchange rate
POST /v1/external_accounts/{id} -> any
GET /v1/file_links?created&ending_before&expand&expired&file&limit&starting_after -> {data,has_more,object,url} — List all file links
POST /v1/file_links -> {created,expired,expires_at,file,id,livemode,metadata,object,url} — Create a file link
GET /v1/file_links/{link}?expand -> {created,expired,expires_at,file,id,livemode,metadata,object,url} — Retrieve a file link
POST /v1/file_links/{link} -> {created,expired,expires_at,file,id,livemode,metadata,object,url} — Update a file link
GET /v1/files?created&ending_before&expand&limit&purpose&starting_after -> {data,has_more,object,url} — List all files
POST /v1/files -> {created,expires_at,filename,id,links,object,purpose,size,title,type,url} — Create a file
GET /v1/files/{file}?expand -> {created,expires_at,filename,id,links,object,purpose,size,title,type,url} — Retrieve a file
GET /v1/financial_connections/accounts?account_holder&ending_before&expand&limit&session&starting_after -> {data,has_more,object,url} — List Accounts
GET /v1/financial_connections/accounts/{account}?expand -> {account_holder,account_numbers,balance,balance_refresh,category,created,display_name,id,institution_name,last4,livemode,object,+9more} — Retrieve an Account
POST /v1/financial_connections/accounts/{account}/disconnect -> {account_holder,account_numbers,balance,balance_refresh,category,created,display_name,id,institution_name,last4,livemode,object,+9more} — Disconnect an Account
GET /v1/financial_connections/accounts/{account}/owners?ending_before&expand&limit&ownership*&starting_after -> {data,has_more,object,url} — List Account Owners
POST /v1/financial_connections/accounts/{account}/refresh -> {account_holder,account_numbers,balance,balance_refresh,category,created,display_name,id,institution_name,last4,livemode,object,+9more} — Refresh Account data
POST /v1/financial_connections/accounts/{account}/subscribe -> {account_holder,account_numbers,balance,balance_refresh,category,created,display_name,id,institution_name,last4,livemode,object,+9more} — Subscribe to data refreshes for an Account
POST /v1/financial_connections/accounts/{account}/unsubscribe -> {account_holder,account_numbers,balance,balance_refresh,category,created,display_name,id,institution_name,last4,livemode,object,+9more} — Unsubscribe from data refreshes for an Account
POST /v1/financial_connections/sessions -> {account_holder,accounts,client_secret,filters,id,livemode,object,permissions,prefetch,return_url} — Create a Session
GET /v1/financial_connections/sessions/{session}?expand -> {account_holder,accounts,client_secret,filters,id,livemode,object,permissions,prefetch,return_url} — Retrieve a Session
GET /v1/financial_connections/transactions?account*&ending_before&expand&limit&starting_after&transacted_at&transaction_refresh -> {data,has_more,object,url} — List Transactions
GET /v1/financial_connections/transactions/{transaction}?expand -> {account,amount,currency,description,id,livemode,object,status,status_transitions,transacted_at,transaction_refresh,updated} — Retrieve a Transaction
GET /v1/forwarding/requests?created&ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all ForwardingRequests
POST /v1/forwarding/requests -> {created,id,livemode,metadata,object,payment_method,replacements,request_context,request_details,response_details,url} — Create a ForwardingRequest
GET /v1/forwarding/requests/{id}?expand -> {created,id,livemode,metadata,object,payment_method,replacements,request_context,request_details,response_details,url} — Retrieve a ForwardingRequest
GET /v1/identity/verification_reports?client_reference_id&created&ending_before&expand&limit&starting_after&type&verification_session -> {data,has_more,object,url} — List VerificationReports
GET /v1/identity/verification_reports/{report}?expand -> {client_reference_id,created,document,email,id,id_number,livemode,object,options,phone,selfie,type,+2more} — Retrieve a VerificationReport
GET /v1/identity/verification_sessions?client_reference_id&created&ending_before&expand&limit&related_customer&related_customer_account&starting_after&status -> {data,has_more,object,url} — List VerificationSessions
POST /v1/identity/verification_sessions -> {client_reference_id,client_secret,created,id,last_error,last_verification_report,livemode,metadata,object,options,provided_details,redaction,+8more} — Create a VerificationSession
GET /v1/identity/verification_sessions/{session}?expand -> {client_reference_id,client_secret,created,id,last_error,last_verification_report,livemode,metadata,object,options,provided_details,redaction,+8more} — Retrieve a VerificationSession
POST /v1/identity/verification_sessions/{session} -> {client_reference_id,client_secret,created,id,last_error,last_verification_report,livemode,metadata,object,options,provided_details,redaction,+8more} — Update a VerificationSession
POST /v1/identity/verification_sessions/{session}/cancel -> {client_reference_id,client_secret,created,id,last_error,last_verification_report,livemode,metadata,object,options,provided_details,redaction,+8more} — Cancel a VerificationSession
POST /v1/identity/verification_sessions/{session}/redact -> {client_reference_id,client_secret,created,id,last_error,last_verification_report,livemode,metadata,object,options,provided_details,redaction,+8more} — Redact a VerificationSession
GET /v1/invoice_payments?created&ending_before&expand&invoice&limit&payment&starting_after&status -> {data,has_more,object,url} — List all payments for an invoice
GET /v1/invoice_payments/{invoice_payment}?expand -> {amount_paid,amount_requested,created,currency,id,invoice,is_default,livemode,object,payment,status,status_transitions} — Retrieve an InvoicePayment
GET /v1/invoice_rendering_templates?ending_before&expand&limit&starting_after&status -> {data,has_more,object,url} — List all invoice rendering templates
GET /v1/invoice_rendering_templates/{template}?expand&version -> {created,id,livemode,metadata,nickname,object,status,version} — Retrieve an invoice rendering template
POST /v1/invoice_rendering_templates/{template}/archive -> {created,id,livemode,metadata,nickname,object,status,version} — Archive an invoice rendering template
POST /v1/invoice_rendering_templates/{template}/unarchive -> {created,id,livemode,metadata,nickname,object,status,version} — Unarchive an invoice rendering template
GET /v1/invoiceitems?created&customer&customer_account&ending_before&expand&invoice&limit&pending&starting_after -> {data,has_more,object,url} — List all invoice items
POST /v1/invoiceitems -> {amount,currency,customer,customer_account,date,description,discountable,discounts,id,invoice,livemode,metadata,+11more} — Create an invoice item
GET /v1/invoiceitems/{invoiceitem}?expand -> {amount,currency,customer,customer_account,date,description,discountable,discounts,id,invoice,livemode,metadata,+11more} — Retrieve an invoice item
POST /v1/invoiceitems/{invoiceitem} -> {amount,currency,customer,customer_account,date,description,discountable,discounts,id,invoice,livemode,metadata,+11more} — Update an invoice item
DELETE /v1/invoiceitems/{invoiceitem} -> {deleted,id,object} — Delete an invoice item
GET /v1/invoices?collection_method&created&customer&customer_account&due_date&ending_before&expand&limit&starting_after&status&subscription -> {data,has_more,object,url} — List all invoices
POST /v1/invoices -> {account_country,account_name,account_tax_ids,amount_due,amount_overpaid,amount_paid,amount_paid_off_stripe,amount_remaining,amount_shipping,application,attempt_count,attempted,+66more} — Create an invoice
POST /v1/invoices/create_preview -> {account_country,account_name,account_tax_ids,amount_due,amount_overpaid,amount_paid,amount_paid_off_stripe,amount_remaining,amount_shipping,application,attempt_count,attempted,+66more} — Create a preview invoice
GET /v1/invoices/search?expand&limit&page&query* -> {data,has_more,next_page,object,total_count,url} — Search invoices
GET /v1/invoices/{invoice}?expand -> {account_country,account_name,account_tax_ids,amount_due,amount_overpaid,amount_paid,amount_paid_off_stripe,amount_remaining,amount_shipping,application,attempt_count,attempted,+66more} — Retrieve an invoice
POST /v1/invoices/{invoice} -> {account_country,account_name,account_tax_ids,amount_due,amount_overpaid,amount_paid,amount_paid_off_stripe,amount_remaining,amount_shipping,application,attempt_count,attempted,+66more} — Update an invoice
DELETE /v1/invoices/{invoice} -> {deleted,id,object} — Delete a draft invoice
POST /v1/invoices/{invoice}/add_lines -> {account_country,account_name,account_tax_ids,amount_due,amount_overpaid,amount_paid,amount_paid_off_stripe,amount_remaining,amount_shipping,application,attempt_count,attempted,+66more} — Bulk add invoice line items
POST /v1/invoices/{invoice}/attach_payment -> {account_country,account_name,account_tax_ids,amount_due,amount_overpaid,amount_paid,amount_paid_off_stripe,amount_remaining,amount_shipping,application,attempt_count,attempted,+66more} — Attach a payment to an Invoice
POST /v1/invoices/{invoice}/finalize -> {account_country,account_name,account_tax_ids,amount_due,amount_overpaid,amount_paid,amount_paid_off_stripe,amount_remaining,amount_shipping,application,attempt_count,attempted,+66more} — Finalize an invoice
GET /v1/invoices/{invoice}/lines?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — Retrieve an invoice's line items
POST /v1/invoices/{invoice}/lines/{line_item_id} -> {amount,currency,description,discount_amounts,discountable,discounts,id,invoice,livemode,metadata,object,parent,+8more} — Update an invoice's line item
POST /v1/invoices/{invoice}/mark_uncollectible -> {account_country,account_name,account_tax_ids,amount_due,amount_overpaid,amount_paid,amount_paid_off_stripe,amount_remaining,amount_shipping,application,attempt_count,attempted,+66more} — Mark an invoice as uncollectible
POST /v1/invoices/{invoice}/pay -> {account_country,account_name,account_tax_ids,amount_due,amount_overpaid,amount_paid,amount_paid_off_stripe,amount_remaining,amount_shipping,application,attempt_count,attempted,+66more} — Pay an invoice
POST /v1/invoices/{invoice}/remove_lines -> {account_country,account_name,account_tax_ids,amount_due,amount_overpaid,amount_paid,amount_paid_off_stripe,amount_remaining,amount_shipping,application,attempt_count,attempted,+66more} — Bulk remove invoice line items
POST /v1/invoices/{invoice}/send -> {account_country,account_name,account_tax_ids,amount_due,amount_overpaid,amount_paid,amount_paid_off_stripe,amount_remaining,amount_shipping,application,attempt_count,attempted,+66more} — Send an invoice for manual payment
POST /v1/invoices/{invoice}/update_lines -> {account_country,account_name,account_tax_ids,amount_due,amount_overpaid,amount_paid,amount_paid_off_stripe,amount_remaining,amount_shipping,application,attempt_count,attempted,+66more} — Bulk update invoice line items
POST /v1/invoices/{invoice}/void -> {account_country,account_name,account_tax_ids,amount_due,amount_overpaid,amount_paid,amount_paid_off_stripe,amount_remaining,amount_shipping,application,attempt_count,attempted,+66more} — Void an invoice
GET /v1/issuing/authorizations?card&cardholder&created&ending_before&expand&limit&starting_after&status -> {data,has_more,object,url} — List all authorizations
GET /v1/issuing/authorizations/{authorization}?expand -> {amount,amount_details,approved,authorization_method,balance_transactions,card,card_presence,cardholder,created,currency,fleet,fraud_challenges,+18more} — Retrieve an authorization
POST /v1/issuing/authorizations/{authorization} -> {amount,amount_details,approved,authorization_method,balance_transactions,card,card_presence,cardholder,created,currency,fleet,fraud_challenges,+18more} — Update an authorization
POST /v1/issuing/authorizations/{authorization}/approve -> {amount,amount_details,approved,authorization_method,balance_transactions,card,card_presence,cardholder,created,currency,fleet,fraud_challenges,+18more} — Approve an authorization
POST /v1/issuing/authorizations/{authorization}/decline -> {amount,amount_details,approved,authorization_method,balance_transactions,card,card_presence,cardholder,created,currency,fleet,fraud_challenges,+18more} — Decline an authorization
GET /v1/issuing/cardholders?created&email&ending_before&expand&limit&phone_number&starting_after&status&type -> {data,has_more,object,url} — List all cardholders
POST /v1/issuing/cardholders -> {billing,company,created,email,id,individual,livemode,metadata,name,object,phone_number,preferred_locales,+4more} — Create a cardholder
GET /v1/issuing/cardholders/{cardholder}?expand -> {billing,company,created,email,id,individual,livemode,metadata,name,object,phone_number,preferred_locales,+4more} — Retrieve a cardholder
POST /v1/issuing/cardholders/{cardholder} -> {billing,company,created,email,id,individual,livemode,metadata,name,object,phone_number,preferred_locales,+4more} — Update a cardholder
GET /v1/issuing/cards?cardholder&created&ending_before&exp_month&exp_year&expand&last4&limit&personalization_design&starting_after&status&type -> {data,has_more,object,url} — List all cards
POST /v1/issuing/cards -> {brand,cancellation_reason,cardholder,created,currency,cvc,exp_month,exp_year,financial_account,id,last4,latest_fraud_warning,+15more} — Create a card
GET /v1/issuing/cards/{card}?expand -> {brand,cancellation_reason,cardholder,created,currency,cvc,exp_month,exp_year,financial_account,id,last4,latest_fraud_warning,+15more} — Retrieve a card
POST /v1/issuing/cards/{card} -> {brand,cancellation_reason,cardholder,created,currency,cvc,exp_month,exp_year,financial_account,id,last4,latest_fraud_warning,+15more} — Update a card
GET /v1/issuing/disputes?created&ending_before&expand&limit&starting_after&status&transaction -> {data,has_more,object,url} — List all disputes
POST /v1/issuing/disputes -> {amount,balance_transactions,created,currency,evidence,id,livemode,loss_reason,metadata,object,status,transaction,+1more} — Create a dispute
GET /v1/issuing/disputes/{dispute}?expand -> {amount,balance_transactions,created,currency,evidence,id,livemode,loss_reason,metadata,object,status,transaction,+1more} — Retrieve a dispute
POST /v1/issuing/disputes/{dispute} -> {amount,balance_transactions,created,currency,evidence,id,livemode,loss_reason,metadata,object,status,transaction,+1more} — Update a dispute
POST /v1/issuing/disputes/{dispute}/submit -> {amount,balance_transactions,created,currency,evidence,id,livemode,loss_reason,metadata,object,status,transaction,+1more} — Submit a dispute
GET /v1/issuing/personalization_designs?ending_before&expand&limit&lookup_keys&preferences&starting_after&status -> {data,has_more,object,url} — List all personalization designs
POST /v1/issuing/personalization_designs -> {card_logo,carrier_text,created,id,livemode,lookup_key,metadata,name,object,physical_bundle,preferences,rejection_reasons,+1more} — Create a personalization design
GET /v1/issuing/personalization_designs/{personalization_design}?expand -> {card_logo,carrier_text,created,id,livemode,lookup_key,metadata,name,object,physical_bundle,preferences,rejection_reasons,+1more} — Retrieve a personalization design
POST /v1/issuing/personalization_designs/{personalization_design} -> {card_logo,carrier_text,created,id,livemode,lookup_key,metadata,name,object,physical_bundle,preferences,rejection_reasons,+1more} — Update a personalization design
GET /v1/issuing/physical_bundles?ending_before&expand&limit&starting_after&status&type -> {data,has_more,object,url} — List all physical bundles
GET /v1/issuing/physical_bundles/{physical_bundle}?expand -> {features,id,livemode,name,object,status,type} — Retrieve a physical bundle
GET /v1/issuing/settlements/{settlement}?expand -> {bin,clearing_date,created,currency,id,interchange_fees_amount,livemode,metadata,net_total_amount,network,network_fees_amount,network_settlement_identifier,+5more} — Retrieve a settlement
POST /v1/issuing/settlements/{settlement} -> {bin,clearing_date,created,currency,id,interchange_fees_amount,livemode,metadata,net_total_amount,network,network_fees_amount,network_settlement_identifier,+5more} — Update a settlement
GET /v1/issuing/tokens?card*&created&ending_before&expand&limit&starting_after&status -> {data,has_more,object,url} — List all issuing tokens for card
GET /v1/issuing/tokens/{token}?expand -> {card,created,device_fingerprint,id,last4,livemode,network,network_data,network_updated_at,object,status,wallet_provider} — Retrieve an issuing token
POST /v1/issuing/tokens/{token} -> {card,created,device_fingerprint,id,last4,livemode,network,network_data,network_updated_at,object,status,wallet_provider} — Update a token status
GET /v1/issuing/transactions?card&cardholder&created&ending_before&expand&limit&starting_after&type -> {data,has_more,object,url} — List all transactions
GET /v1/issuing/transactions/{transaction}?expand -> {amount,amount_details,authorization,balance_transaction,card,cardholder,created,currency,dispute,id,livemode,merchant_amount,+10more} — Retrieve a transaction
POST /v1/issuing/transactions/{transaction} -> {amount,amount_details,authorization,balance_transaction,card,cardholder,created,currency,dispute,id,livemode,merchant_amount,+10more} — Update a transaction
POST /v1/link_account_sessions -> {account_holder,accounts,client_secret,filters,id,livemode,object,permissions,prefetch,return_url} — Create a Session
GET /v1/link_account_sessions/{session}?expand -> {account_holder,accounts,client_secret,filters,id,livemode,object,permissions,prefetch,return_url} — Retrieve a Session
GET /v1/linked_accounts?account_holder&ending_before&expand&limit&session&starting_after -> {data,has_more,object,url} — List Accounts
GET /v1/linked_accounts/{account}?expand -> {account_holder,account_numbers,balance,balance_refresh,category,created,display_name,id,institution_name,last4,livemode,object,+9more} — Retrieve an Account
POST /v1/linked_accounts/{account}/disconnect -> {account_holder,account_numbers,balance,balance_refresh,category,created,display_name,id,institution_name,last4,livemode,object,+9more} — Disconnect an Account
GET /v1/linked_accounts/{account}/owners?ending_before&expand&limit&ownership*&starting_after -> {data,has_more,object,url} — List Account Owners
POST /v1/linked_accounts/{account}/refresh -> {account_holder,account_numbers,balance,balance_refresh,category,created,display_name,id,institution_name,last4,livemode,object,+9more} — Refresh Account data
GET /v1/mandates/{mandate}?expand -> {customer_acceptance,id,livemode,multi_use,object,on_behalf_of,payment_method,payment_method_details,single_use,status,type} — Retrieve a Mandate
GET /v1/payment_attempt_records?expand&limit&payment_record*&starting_after -> {data,has_more,object,url} — List Payment Attempt Records
GET /v1/payment_attempt_records/{id}?expand -> {amount,amount_authorized,amount_canceled,amount_failed,amount_guaranteed,amount_refunded,amount_requested,application,created,customer_details,customer_presence,description,+9more} — Retrieve a Payment Attempt Record
GET /v1/payment_intents?created&customer&customer_account&ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all PaymentIntents
POST /v1/payment_intents -> {amount,amount_capturable,amount_details,amount_received,application,application_fee_amount,automatic_payment_methods,canceled_at,cancellation_reason,capture_method,client_secret,confirmation_method,+32more} — Create a PaymentIntent
GET /v1/payment_intents/search?expand&limit&page&query* -> {data,has_more,next_page,object,total_count,url} — Search PaymentIntents
GET /v1/payment_intents/{intent}?client_secret&expand -> {amount,amount_capturable,amount_details,amount_received,application,application_fee_amount,automatic_payment_methods,canceled_at,cancellation_reason,capture_method,client_secret,confirmation_method,+32more} — Retrieve a PaymentIntent
POST /v1/payment_intents/{intent} -> {amount,amount_capturable,amount_details,amount_received,application,application_fee_amount,automatic_payment_methods,canceled_at,cancellation_reason,capture_method,client_secret,confirmation_method,+32more} — Update a PaymentIntent
GET /v1/payment_intents/{intent}/amount_details_line_items?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all PaymentIntent LineItems
POST /v1/payment_intents/{intent}/apply_customer_balance -> {amount,amount_capturable,amount_details,amount_received,application,application_fee_amount,automatic_payment_methods,canceled_at,cancellation_reason,capture_method,client_secret,confirmation_method,+32more} — Reconcile a customer_balance PaymentIntent
POST /v1/payment_intents/{intent}/cancel -> {amount,amount_capturable,amount_details,amount_received,application,application_fee_amount,automatic_payment_methods,canceled_at,cancellation_reason,capture_method,client_secret,confirmation_method,+32more} — Cancel a PaymentIntent
POST /v1/payment_intents/{intent}/capture -> {amount,amount_capturable,amount_details,amount_received,application,application_fee_amount,automatic_payment_methods,canceled_at,cancellation_reason,capture_method,client_secret,confirmation_method,+32more} — Capture a PaymentIntent
POST /v1/payment_intents/{intent}/confirm -> {amount,amount_capturable,amount_details,amount_received,application,application_fee_amount,automatic_payment_methods,canceled_at,cancellation_reason,capture_method,client_secret,confirmation_method,+32more} — Confirm a PaymentIntent
POST /v1/payment_intents/{intent}/increment_authorization -> {amount,amount_capturable,amount_details,amount_received,application,application_fee_amount,automatic_payment_methods,canceled_at,cancellation_reason,capture_method,client_secret,confirmation_method,+32more} — Increment an authorization
POST /v1/payment_intents/{intent}/verify_microdeposits -> {amount,amount_capturable,amount_details,amount_received,application,application_fee_amount,automatic_payment_methods,canceled_at,cancellation_reason,capture_method,client_secret,confirmation_method,+32more} — Verify microdeposits on a PaymentIntent
GET /v1/payment_links?active&ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all payment links
POST /v1/payment_links -> {active,after_completion,allow_promotion_codes,application,application_fee_amount,application_fee_percent,automatic_tax,billing_address_collection,consent_collection,currency,custom_fields,custom_text,+25more} — Create a payment link
GET /v1/payment_links/{payment_link}?expand -> {active,after_completion,allow_promotion_codes,application,application_fee_amount,application_fee_percent,automatic_tax,billing_address_collection,consent_collection,currency,custom_fields,custom_text,+25more} — Retrieve payment link
POST /v1/payment_links/{payment_link} -> {active,after_completion,allow_promotion_codes,application,application_fee_amount,application_fee_percent,automatic_tax,billing_address_collection,consent_collection,currency,custom_fields,custom_text,+25more} — Update a payment link
GET /v1/payment_links/{payment_link}/line_items?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — Retrieve a payment link's line items
GET /v1/payment_method_configurations?active&application&ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List payment method configurations
POST /v1/payment_method_configurations -> {acss_debit,active,affirm,afterpay_clearpay,alipay,alma,amazon_pay,apple_pay,application,au_becs_debit,bacs_debit,bancontact,+54more} — Create a payment method configuration
GET /v1/payment_method_configurations/{configuration}?expand -> {acss_debit,active,affirm,afterpay_clearpay,alipay,alma,amazon_pay,apple_pay,application,au_becs_debit,bacs_debit,bancontact,+54more} — Retrieve payment method configuration
POST /v1/payment_method_configurations/{configuration} -> {acss_debit,active,affirm,afterpay_clearpay,alipay,alma,amazon_pay,apple_pay,application,au_becs_debit,bacs_debit,bancontact,+54more} — Update payment method configuration
GET /v1/payment_method_domains?domain_name&enabled&ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List payment method domains
POST /v1/payment_method_domains -> {amazon_pay,apple_pay,created,domain_name,enabled,google_pay,id,klarna,link,livemode,object,paypal} — Create a payment method domain
GET /v1/payment_method_domains/{payment_method_domain}?expand -> {amazon_pay,apple_pay,created,domain_name,enabled,google_pay,id,klarna,link,livemode,object,paypal} — Retrieve a payment method domain
POST /v1/payment_method_domains/{payment_method_domain} -> {amazon_pay,apple_pay,created,domain_name,enabled,google_pay,id,klarna,link,livemode,object,paypal} — Update a payment method domain
POST /v1/payment_method_domains/{payment_method_domain}/validate -> {amazon_pay,apple_pay,created,domain_name,enabled,google_pay,id,klarna,link,livemode,object,paypal} — Validate an existing payment method domain
GET /v1/payment_methods?allow_redisplay&customer&customer_account&ending_before&expand&limit&starting_after&type -> {data,has_more,object,url} — List PaymentMethods
POST /v1/payment_methods -> {acss_debit,affirm,afterpay_clearpay,alipay,allow_redisplay,alma,amazon_pay,au_becs_debit,bacs_debit,bancontact,billie,billing_details,+56more} — Shares a PaymentMethod
GET /v1/payment_methods/{payment_method}?expand -> {acss_debit,affirm,afterpay_clearpay,alipay,allow_redisplay,alma,amazon_pay,au_becs_debit,bacs_debit,bancontact,billie,billing_details,+56more} — Retrieve a PaymentMethod
POST /v1/payment_methods/{payment_method} -> {acss_debit,affirm,afterpay_clearpay,alipay,allow_redisplay,alma,amazon_pay,au_becs_debit,bacs_debit,bancontact,billie,billing_details,+56more} — Update a PaymentMethod
POST /v1/payment_methods/{payment_method}/attach -> {acss_debit,affirm,afterpay_clearpay,alipay,allow_redisplay,alma,amazon_pay,au_becs_debit,bacs_debit,bancontact,billie,billing_details,+56more} — Attach a PaymentMethod to a Customer
POST /v1/payment_methods/{payment_method}/detach -> {acss_debit,affirm,afterpay_clearpay,alipay,allow_redisplay,alma,amazon_pay,au_becs_debit,bacs_debit,bancontact,billie,billing_details,+56more} — Detach a PaymentMethod from a Customer
POST /v1/payment_records/report_payment -> {amount,amount_authorized,amount_canceled,amount_failed,amount_guaranteed,amount_refunded,amount_requested,application,created,customer_details,customer_presence,description,+9more} — Report a payment
GET /v1/payment_records/{id}?expand -> {amount,amount_authorized,amount_canceled,amount_failed,amount_guaranteed,amount_refunded,amount_requested,application,created,customer_details,customer_presence,description,+9more} — Retrieve a Payment Record
POST /v1/payment_records/{id}/report_payment_attempt -> {amount,amount_authorized,amount_canceled,amount_failed,amount_guaranteed,amount_refunded,amount_requested,application,created,customer_details,customer_presence,description,+9more} — Report a payment attempt
POST /v1/payment_records/{id}/report_payment_attempt_canceled -> {amount,amount_authorized,amount_canceled,amount_failed,amount_guaranteed,amount_refunded,amount_requested,application,created,customer_details,customer_presence,description,+9more} — Report payment attempt canceled
POST /v1/payment_records/{id}/report_payment_attempt_failed -> {amount,amount_authorized,amount_canceled,amount_failed,amount_guaranteed,amount_refunded,amount_requested,application,created,customer_details,customer_presence,description,+9more} — Report payment attempt failed
POST /v1/payment_records/{id}/report_payment_attempt_guaranteed -> {amount,amount_authorized,amount_canceled,amount_failed,amount_guaranteed,amount_refunded,amount_requested,application,created,customer_details,customer_presence,description,+9more} — Report payment attempt guaranteed
POST /v1/payment_records/{id}/report_payment_attempt_informational -> {amount,amount_authorized,amount_canceled,amount_failed,amount_guaranteed,amount_refunded,amount_requested,application,created,customer_details,customer_presence,description,+9more} — Report payment attempt informational
POST /v1/payment_records/{id}/report_refund -> {amount,amount_authorized,amount_canceled,amount_failed,amount_guaranteed,amount_refunded,amount_requested,application,created,customer_details,customer_presence,description,+9more} — Report a refund
GET /v1/payouts?arrival_date&created&destination&ending_before&expand&limit&starting_after&status -> {data,has_more,object,url} — List all payouts
POST /v1/payouts -> {amount,application_fee,application_fee_amount,arrival_date,automatic,balance_transaction,created,currency,description,destination,failure_balance_transaction,failure_code,+15more} — Create a payout
GET /v1/payouts/{payout}?expand -> {amount,application_fee,application_fee_amount,arrival_date,automatic,balance_transaction,created,currency,description,destination,failure_balance_transaction,failure_code,+15more} — Retrieve a payout
POST /v1/payouts/{payout} -> {amount,application_fee,application_fee_amount,arrival_date,automatic,balance_transaction,created,currency,description,destination,failure_balance_transaction,failure_code,+15more} — Update a payout
POST /v1/payouts/{payout}/cancel -> {amount,application_fee,application_fee_amount,arrival_date,automatic,balance_transaction,created,currency,description,destination,failure_balance_transaction,failure_code,+15more} — Cancel a payout
POST /v1/payouts/{payout}/reverse -> {amount,application_fee,application_fee_amount,arrival_date,automatic,balance_transaction,created,currency,description,destination,failure_balance_transaction,failure_code,+15more} — Reverse a payout
GET /v1/plans?active&created&ending_before&expand&limit&product&starting_after -> {data,has_more,object,url} — List all plans
POST /v1/plans -> {active,amount,amount_decimal,billing_scheme,created,currency,id,interval,interval_count,livemode,metadata,meter,+8more} — Create a plan
GET /v1/plans/{plan}?expand -> {active,amount,amount_decimal,billing_scheme,created,currency,id,interval,interval_count,livemode,metadata,meter,+8more} — Retrieve a plan
POST /v1/plans/{plan} -> {active,amount,amount_decimal,billing_scheme,created,currency,id,interval,interval_count,livemode,metadata,meter,+8more} — Update a plan
DELETE /v1/plans/{plan} -> {deleted,id,object} — Delete a plan
GET /v1/prices?active&created&currency&ending_before&expand&limit&lookup_keys&product&recurring&starting_after&type -> {data,has_more,object,url} — List all prices
POST /v1/prices -> {active,billing_scheme,created,currency,currency_options,custom_unit_amount,id,livemode,lookup_key,metadata,nickname,object,+9more} — Create a price
GET /v1/prices/search?expand&limit&page&query* -> {data,has_more,next_page,object,total_count,url} — Search prices
GET /v1/prices/{price}?expand -> {active,billing_scheme,created,currency,currency_options,custom_unit_amount,id,livemode,lookup_key,metadata,nickname,object,+9more} — Retrieve a price
POST /v1/prices/{price} -> {active,billing_scheme,created,currency,currency_options,custom_unit_amount,id,livemode,lookup_key,metadata,nickname,object,+9more} — Update a price
GET /v1/products?active&created&ending_before&expand&ids&limit&shippable&starting_after&url -> {data,has_more,object,url} — List all products
POST /v1/products -> {active,created,default_price,description,id,images,livemode,marketing_features,metadata,name,object,package_dimensions,+6more} — Create a product
GET /v1/products/search?expand&limit&page&query* -> {data,has_more,next_page,object,total_count,url} — Search products
GET /v1/products/{id}?expand -> {active,created,default_price,description,id,images,livemode,marketing_features,metadata,name,object,package_dimensions,+6more} — Retrieve a product
POST /v1/products/{id} -> {active,created,default_price,description,id,images,livemode,marketing_features,metadata,name,object,package_dimensions,+6more} — Update a product
DELETE /v1/products/{id} -> {deleted,id,object} — Delete a product
GET /v1/products/{product}/features?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all features attached to a product
POST /v1/products/{product}/features -> {entitlement_feature,id,livemode,object} — Attach a feature to a product
GET /v1/products/{product}/features/{id}?expand -> {entitlement_feature,id,livemode,object} — Retrieve a product_feature
DELETE /v1/products/{product}/features/{id} -> {deleted,id,object} — Remove a feature from a product
GET /v1/promotion_codes?active&code&coupon&created&customer&customer_account&ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all promotion codes
POST /v1/promotion_codes -> {active,code,created,customer,customer_account,expires_at,id,livemode,max_redemptions,metadata,object,promotion,+2more} — Create a promotion code
GET /v1/promotion_codes/{promotion_code}?expand -> {active,code,created,customer,customer_account,expires_at,id,livemode,max_redemptions,metadata,object,promotion,+2more} — Retrieve a promotion code
POST /v1/promotion_codes/{promotion_code} -> {active,code,created,customer,customer_account,expires_at,id,livemode,max_redemptions,metadata,object,promotion,+2more} — Update a promotion code
GET /v1/quotes?customer&customer_account&ending_before&expand&limit&starting_after&status&test_clock -> {data,has_more,object,url} — List all quotes
POST /v1/quotes -> {amount_subtotal,amount_total,application,application_fee_amount,application_fee_percent,automatic_tax,collection_method,computed,created,currency,customer,customer_account,+24more} — Create a quote
GET /v1/quotes/{quote}?expand -> {amount_subtotal,amount_total,application,application_fee_amount,application_fee_percent,automatic_tax,collection_method,computed,created,currency,customer,customer_account,+24more} — Retrieve a quote
POST /v1/quotes/{quote} -> {amount_subtotal,amount_total,application,application_fee_amount,application_fee_percent,automatic_tax,collection_method,computed,created,currency,customer,customer_account,+24more} — Update a quote
POST /v1/quotes/{quote}/accept -> {amount_subtotal,amount_total,application,application_fee_amount,application_fee_percent,automatic_tax,collection_method,computed,created,currency,customer,customer_account,+24more} — Accept a quote
POST /v1/quotes/{quote}/cancel -> {amount_subtotal,amount_total,application,application_fee_amount,application_fee_percent,automatic_tax,collection_method,computed,created,currency,customer,customer_account,+24more} — Cancel a quote
GET /v1/quotes/{quote}/computed_upfront_line_items?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — Retrieve a quote's upfront line items
POST /v1/quotes/{quote}/finalize -> {amount_subtotal,amount_total,application,application_fee_amount,application_fee_percent,automatic_tax,collection_method,computed,created,currency,customer,customer_account,+24more} — Finalize a quote
GET /v1/quotes/{quote}/line_items?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — Retrieve a quote's line items
GET /v1/quotes/{quote}/pdf?expand -> ok — Download quote PDF
GET /v1/radar/early_fraud_warnings?charge&created&ending_before&expand&limit&payment_intent&starting_after -> {data,has_more,object,url} — List all early fraud warnings
GET /v1/radar/early_fraud_warnings/{early_fraud_warning}?expand -> {actionable,charge,created,fraud_type,id,livemode,object,payment_intent} — Retrieve an early fraud warning
POST /v1/radar/payment_evaluations -> {client_device_metadata_details,created_at,customer_details,events,id,livemode,metadata,object,outcome,payment_details,recommended_action,signals} — Create a Payment Evaluation
GET /v1/radar/value_list_items?created&ending_before&expand&limit&starting_after&value&value_list* -> {data,has_more,object,url} — List all value list items
POST /v1/radar/value_list_items -> {created,created_by,id,livemode,object,value,value_list} — Create a value list item
GET /v1/radar/value_list_items/{item}?expand -> {created,created_by,id,livemode,object,value,value_list} — Retrieve a value list item
DELETE /v1/radar/value_list_items/{item} -> {deleted,id,object} — Delete a value list item
GET /v1/radar/value_lists?alias&contains&created&ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all value lists
POST /v1/radar/value_lists -> {alias,created,created_by,id,item_type,list_items,livemode,metadata,name,object} — Create a value list
GET /v1/radar/value_lists/{value_list}?expand -> {alias,created,created_by,id,item_type,list_items,livemode,metadata,name,object} — Retrieve a value list
POST /v1/radar/value_lists/{value_list} -> {alias,created,created_by,id,item_type,list_items,livemode,metadata,name,object} — Update a value list
DELETE /v1/radar/value_lists/{value_list} -> {deleted,id,object} — Delete a value list
GET /v1/refunds?charge&created&ending_before&expand&limit&payment_intent&starting_after -> {data,has_more,object,url} — List all refunds
POST /v1/refunds -> {amount,balance_transaction,charge,created,currency,description,destination_details,failure_balance_transaction,failure_reason,id,instructions_email,metadata,+10more} — Create customer balance refund
GET /v1/refunds/{refund}?expand -> {amount,balance_transaction,charge,created,currency,description,destination_details,failure_balance_transaction,failure_reason,id,instructions_email,metadata,+10more} — Retrieve a refund
POST /v1/refunds/{refund} -> {amount,balance_transaction,charge,created,currency,description,destination_details,failure_balance_transaction,failure_reason,id,instructions_email,metadata,+10more} — Update a refund
POST /v1/refunds/{refund}/cancel -> {amount,balance_transaction,charge,created,currency,description,destination_details,failure_balance_transaction,failure_reason,id,instructions_email,metadata,+10more} — Cancel a refund
GET /v1/reporting/report_runs?created&ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all Report Runs
POST /v1/reporting/report_runs -> {created,error,id,livemode,object,parameters,report_type,result,status,succeeded_at} — Create a Report Run
GET /v1/reporting/report_runs/{report_run}?expand -> {created,error,id,livemode,object,parameters,report_type,result,status,succeeded_at} — Retrieve a Report Run
GET /v1/reporting/report_types?expand -> {data,has_more,object,url} — List all Report Types
GET /v1/reporting/report_types/{report_type}?expand -> {data_available_end,data_available_start,default_columns,id,livemode,name,object,updated,version} — Retrieve a Report Type
GET /v1/reviews?created&ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all open reviews
GET /v1/reviews/{review}?expand -> {billing_zip,charge,closed_reason,created,id,ip_address,ip_address_location,livemode,object,open,opened_reason,payment_intent,+2more} — Retrieve a review
POST /v1/reviews/{review}/approve -> {billing_zip,charge,closed_reason,created,id,ip_address,ip_address_location,livemode,object,open,opened_reason,payment_intent,+2more} — Approve a review
GET /v1/setup_attempts?created&ending_before&expand&limit&setup_intent*&starting_after -> {data,has_more,object,url} — List all SetupAttempts
GET /v1/setup_intents?attach_to_self&created&customer&customer_account&ending_before&expand&limit&payment_method&starting_after -> {data,has_more,object,url} — List all SetupIntents
POST /v1/setup_intents -> {application,attach_to_self,automatic_payment_methods,cancellation_reason,client_secret,created,customer,customer_account,description,excluded_payment_method_types,flow_directions,id,+16more} — Create a SetupIntent
GET /v1/setup_intents/{intent}?client_secret&expand -> {application,attach_to_self,automatic_payment_methods,cancellation_reason,client_secret,created,customer,customer_account,description,excluded_payment_method_types,flow_directions,id,+16more} — Retrieve a SetupIntent
POST /v1/setup_intents/{intent} -> {application,attach_to_self,automatic_payment_methods,cancellation_reason,client_secret,created,customer,customer_account,description,excluded_payment_method_types,flow_directions,id,+16more} — Update a SetupIntent
POST /v1/setup_intents/{intent}/cancel -> {application,attach_to_self,automatic_payment_methods,cancellation_reason,client_secret,created,customer,customer_account,description,excluded_payment_method_types,flow_directions,id,+16more} — Cancel a SetupIntent
POST /v1/setup_intents/{intent}/confirm -> {application,attach_to_self,automatic_payment_methods,cancellation_reason,client_secret,created,customer,customer_account,description,excluded_payment_method_types,flow_directions,id,+16more} — Confirm a SetupIntent
POST /v1/setup_intents/{intent}/verify_microdeposits -> {application,attach_to_self,automatic_payment_methods,cancellation_reason,client_secret,created,customer,customer_account,description,excluded_payment_method_types,flow_directions,id,+16more} — Verify microdeposits on a SetupIntent
GET /v1/shipping_rates?active&created&currency&ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all shipping rates
POST /v1/shipping_rates -> {active,created,delivery_estimate,display_name,fixed_amount,id,livemode,metadata,object,tax_behavior,tax_code,type} — Create a shipping rate
GET /v1/shipping_rates/{shipping_rate_token}?expand -> {active,created,delivery_estimate,display_name,fixed_amount,id,livemode,metadata,object,tax_behavior,tax_code,type} — Retrieve a shipping rate
POST /v1/shipping_rates/{shipping_rate_token} -> {active,created,delivery_estimate,display_name,fixed_amount,id,livemode,metadata,object,tax_behavior,tax_code,type} — Update a shipping rate
POST /v1/sigma/saved_queries/{id} -> {created,id,livemode,name,object,sql} — Update an existing Sigma Query
GET /v1/sigma/scheduled_query_runs?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all scheduled query runs
GET /v1/sigma/scheduled_query_runs/{scheduled_query_run}?expand -> {created,data_load_time,error,file,id,livemode,object,result_available_until,sql,status,title} — Retrieve a scheduled query run
POST /v1/sources -> {ach_credit_transfer,ach_debit,acss_debit,alipay,allow_redisplay,amount,au_becs_debit,bancontact,card,card_present,client_secret,code_verification,+26more} — Shares a source
GET /v1/sources/{source}?client_secret&expand -> {ach_credit_transfer,ach_debit,acss_debit,alipay,allow_redisplay,amount,au_becs_debit,bancontact,card,card_present,client_secret,code_verification,+26more} — Retrieve a source
POST /v1/sources/{source} -> {ach_credit_transfer,ach_debit,acss_debit,alipay,allow_redisplay,amount,au_becs_debit,bancontact,card,card_present,client_secret,code_verification,+26more} — Update a source
GET /v1/sources/{source}/mandate_notifications/{mandate_notification}?expand -> {acss_debit,amount,bacs_debit,created,id,livemode,object,reason,sepa_debit,source,status,type} — Retrieve a Source MandateNotification
GET /v1/sources/{source}/source_transactions?ending_before&expand&limit&starting_after -> {data,has_more,object,url}
GET /v1/sources/{source}/source_transactions/{source_transaction}?expand -> {ach_credit_transfer,amount,chf_credit_transfer,created,currency,gbp_credit_transfer,id,livemode,object,paper_check,sepa_credit_transfer,source,+2more} — Retrieve a source transaction
POST /v1/sources/{source}/verify -> {ach_credit_transfer,ach_debit,acss_debit,alipay,allow_redisplay,amount,au_becs_debit,bancontact,card,card_present,client_secret,code_verification,+26more}
GET /v1/subscription_items?ending_before&expand&limit&starting_after&subscription* -> {data,has_more,object,url} — List all subscription items
POST /v1/subscription_items -> {billed_until,billing_thresholds,created,current_period_end,current_period_start,discounts,id,metadata,object,price,quantity,subscription,+1more} — Create a subscription item
GET /v1/subscription_items/{item}?expand -> {billed_until,billing_thresholds,created,current_period_end,current_period_start,discounts,id,metadata,object,price,quantity,subscription,+1more} — Retrieve a subscription item
POST /v1/subscription_items/{item} -> {billed_until,billing_thresholds,created,current_period_end,current_period_start,discounts,id,metadata,object,price,quantity,subscription,+1more} — Update a subscription item
DELETE /v1/subscription_items/{item} -> {deleted,id,object} — Delete a subscription item
GET /v1/subscription_schedules?canceled_at&completed_at&created&customer&customer_account&ending_before&expand&limit&released_at&scheduled&starting_after -> {data,has_more,object,url} — List all schedules
POST /v1/subscription_schedules -> {application,billing_mode,canceled_at,completed_at,created,current_phase,customer,customer_account,default_settings,end_behavior,id,livemode,+8more} — Create a schedule
GET /v1/subscription_schedules/{schedule}?expand -> {application,billing_mode,canceled_at,completed_at,created,current_phase,customer,customer_account,default_settings,end_behavior,id,livemode,+8more} — Retrieve a schedule
POST /v1/subscription_schedules/{schedule} -> {application,billing_mode,canceled_at,completed_at,created,current_phase,customer,customer_account,default_settings,end_behavior,id,livemode,+8more} — Update a schedule
POST /v1/subscription_schedules/{schedule}/cancel -> {application,billing_mode,canceled_at,completed_at,created,current_phase,customer,customer_account,default_settings,end_behavior,id,livemode,+8more} — Cancel a schedule
POST /v1/subscription_schedules/{schedule}/release -> {application,billing_mode,canceled_at,completed_at,created,current_phase,customer,customer_account,default_settings,end_behavior,id,livemode,+8more} — Release a schedule
GET /v1/subscriptions?automatic_tax&collection_method&created&current_period_end&current_period_start&customer&customer_account&ending_before&expand&limit&price&starting_after&status&test_clock -> {data,has_more,object,url} — List subscriptions
POST /v1/subscriptions -> {application,application_fee_percent,automatic_tax,billing_cycle_anchor,billing_cycle_anchor_config,billing_mode,billing_schedules,billing_thresholds,cancel_at,cancel_at_period_end,canceled_at,cancellation_details,+36more} — Create a subscription
GET /v1/subscriptions/search?expand&limit&page&query* -> {data,has_more,next_page,object,total_count,url} — Search subscriptions
GET /v1/subscriptions/{subscription_exposed_id}?expand -> {application,application_fee_percent,automatic_tax,billing_cycle_anchor,billing_cycle_anchor_config,billing_mode,billing_schedules,billing_thresholds,cancel_at,cancel_at_period_end,canceled_at,cancellation_details,+36more} — Retrieve a subscription
POST /v1/subscriptions/{subscription_exposed_id} -> {application,application_fee_percent,automatic_tax,billing_cycle_anchor,billing_cycle_anchor_config,billing_mode,billing_schedules,billing_thresholds,cancel_at,cancel_at_period_end,canceled_at,cancellation_details,+36more} — Update a subscription
DELETE /v1/subscriptions/{subscription_exposed_id} -> {application,application_fee_percent,automatic_tax,billing_cycle_anchor,billing_cycle_anchor_config,billing_mode,billing_schedules,billing_thresholds,cancel_at,cancel_at_period_end,canceled_at,cancellation_details,+36more} — Cancel a subscription
DELETE /v1/subscriptions/{subscription_exposed_id}/discount -> {checkout_session,customer,customer_account,deleted,id,invoice,invoice_item,object,promotion_code,source,start,subscription,+1more} — Delete a subscription discount
POST /v1/subscriptions/{subscription}/migrate -> {application,application_fee_percent,automatic_tax,billing_cycle_anchor,billing_cycle_anchor_config,billing_mode,billing_schedules,billing_thresholds,cancel_at,cancel_at_period_end,canceled_at,cancellation_details,+36more} — Migrate a subscription
POST /v1/subscriptions/{subscription}/resume -> {application,application_fee_percent,automatic_tax,billing_cycle_anchor,billing_cycle_anchor_config,billing_mode,billing_schedules,billing_thresholds,cancel_at,cancel_at_period_end,canceled_at,cancellation_details,+36more} — Resume a subscription
GET /v1/tax/associations/find?expand&payment_intent* -> {calculation,id,object,payment_intent,tax_transaction_attempts} — Find a Tax Association
POST /v1/tax/calculations -> {amount_total,currency,customer,customer_details,expires_at,id,line_items,livemode,object,ship_from_details,shipping_cost,tax_amount_exclusive,+3more} — Create a Calculation
GET /v1/tax/calculations/{calculation}?expand -> {amount_total,currency,customer,customer_details,expires_at,id,line_items,livemode,object,ship_from_details,shipping_cost,tax_amount_exclusive,+3more} — Retrieve a Calculation
GET /v1/tax/calculations/{calculation}/line_items?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — Retrieve a Calculation's line items
GET /v1/tax/registrations?ending_before&expand&limit&starting_after&status -> {data,has_more,object,url} — List registrations
POST /v1/tax/registrations -> {active_from,country,country_options,created,expires_at,id,livemode,object,status} — Create a registration
GET /v1/tax/registrations/{id}?expand -> {active_from,country,country_options,created,expires_at,id,livemode,object,status} — Retrieve a registration
POST /v1/tax/registrations/{id} -> {active_from,country,country_options,created,expires_at,id,livemode,object,status} — Update a registration
GET /v1/tax/settings?expand -> {defaults,head_office,livemode,object,status,status_details} — Retrieve settings
POST /v1/tax/settings -> {defaults,head_office,livemode,object,status,status_details} — Update settings
POST /v1/tax/transactions/create_from_calculation -> {created,currency,customer,customer_details,id,line_items,livemode,metadata,object,posted_at,reference,reversal,+4more} — Create a Transaction from a Calculation
POST /v1/tax/transactions/create_reversal -> {created,currency,customer,customer_details,id,line_items,livemode,metadata,object,posted_at,reference,reversal,+4more} — Create a reversal Transaction
GET /v1/tax/transactions/{transaction}?expand -> {created,currency,customer,customer_details,id,line_items,livemode,metadata,object,posted_at,reference,reversal,+4more} — Retrieve a Transaction
GET /v1/tax/transactions/{transaction}/line_items?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — Retrieve a Transaction's line items
GET /v1/tax_codes?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all tax codes
GET /v1/tax_codes/{id}?expand -> {description,id,name,object} — Retrieve a tax code
GET /v1/tax_ids?ending_before&expand&limit&owner&starting_after -> {data,has_more,object,url} — List all tax IDs
POST /v1/tax_ids -> {country,created,customer,customer_account,id,livemode,object,owner,type,value,verification} — Create a tax ID
GET /v1/tax_ids/{id}?expand -> {country,created,customer,customer_account,id,livemode,object,owner,type,value,verification} — Retrieve a tax ID
DELETE /v1/tax_ids/{id} -> {deleted,id,object} — Delete a tax ID
GET /v1/tax_rates?active&created&ending_before&expand&inclusive&limit&starting_after -> {data,has_more,object,url} — List all tax rates
POST /v1/tax_rates -> {active,country,created,description,display_name,effective_percentage,flat_amount,id,inclusive,jurisdiction,jurisdiction_level,livemode,+6more} — Create a tax rate
GET /v1/tax_rates/{tax_rate}?expand -> {active,country,created,description,display_name,effective_percentage,flat_amount,id,inclusive,jurisdiction,jurisdiction_level,livemode,+6more} — Retrieve a tax rate
POST /v1/tax_rates/{tax_rate} -> {active,country,created,description,display_name,effective_percentage,flat_amount,id,inclusive,jurisdiction,jurisdiction_level,livemode,+6more} — Update a tax rate
GET /v1/terminal/configurations?ending_before&expand&is_account_default&limit&starting_after -> {data,has_more,object,url} — List all Configurations
POST /v1/terminal/configurations -> {bbpos_wisepad3,bbpos_wisepos_e,cellular,id,is_account_default,livemode,name,object,offline,reboot_window,stripe_s700,stripe_s710,+7more} — Create a Configuration
GET /v1/terminal/configurations/{configuration}?expand -> any — Retrieve a Configuration
POST /v1/terminal/configurations/{configuration} -> any — Update a Configuration
DELETE /v1/terminal/configurations/{configuration} -> {deleted,id,object} — Delete a Configuration
POST /v1/terminal/connection_tokens -> {location,object,secret} — Create a Connection Token
GET /v1/terminal/locations?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all Locations
POST /v1/terminal/locations -> {address,address_kana,address_kanji,configuration_overrides,display_name,display_name_kana,display_name_kanji,id,livemode,metadata,object,phone} — Create a Location
GET /v1/terminal/locations/{location}?expand -> any — Retrieve a Location
POST /v1/terminal/locations/{location} -> any — Update a Location
DELETE /v1/terminal/locations/{location} -> {deleted,id,object} — Delete a Location
POST /v1/terminal/onboarding_links -> {link_options,link_type,object,on_behalf_of,redirect_url} — Create an Onboarding Link
GET /v1/terminal/readers?device_type&ending_before&expand&limit&location&serial_number&starting_after&status -> {data,has_more,object,url} — List all Readers
POST /v1/terminal/readers -> {action,device_sw_version,device_type,id,ip_address,label,last_seen_at,livemode,location,metadata,object,serial_number,+1more} — Create a Reader
GET /v1/terminal/readers/{reader}?expand -> any — Retrieve a Reader
POST /v1/terminal/readers/{reader} -> any — Update a Reader
DELETE /v1/terminal/readers/{reader} -> {deleted,device_type,id,object,serial_number} — Delete a Reader
POST /v1/terminal/readers/{reader}/cancel_action -> {action,device_sw_version,device_type,id,ip_address,label,last_seen_at,livemode,location,metadata,object,serial_number,+1more} — Cancel the current reader action
POST /v1/terminal/readers/{reader}/collect_inputs -> {action,device_sw_version,device_type,id,ip_address,label,last_seen_at,livemode,location,metadata,object,serial_number,+1more} — Collect inputs using a Reader
POST /v1/terminal/readers/{reader}/collect_payment_method -> {action,device_sw_version,device_type,id,ip_address,label,last_seen_at,livemode,location,metadata,object,serial_number,+1more} — Hand off a PaymentIntent to a Reader and collect card details
POST /v1/terminal/readers/{reader}/confirm_payment_intent -> {action,device_sw_version,device_type,id,ip_address,label,last_seen_at,livemode,location,metadata,object,serial_number,+1more} — Confirm a PaymentIntent on the Reader
POST /v1/terminal/readers/{reader}/process_payment_intent -> {action,device_sw_version,device_type,id,ip_address,label,last_seen_at,livemode,location,metadata,object,serial_number,+1more} — Hand-off a PaymentIntent to a Reader
POST /v1/terminal/readers/{reader}/process_setup_intent -> {action,device_sw_version,device_type,id,ip_address,label,last_seen_at,livemode,location,metadata,object,serial_number,+1more} — Hand-off a SetupIntent to a Reader
POST /v1/terminal/readers/{reader}/refund_payment -> {action,device_sw_version,device_type,id,ip_address,label,last_seen_at,livemode,location,metadata,object,serial_number,+1more} — Refund a Charge or a PaymentIntent in-person
POST /v1/terminal/readers/{reader}/set_reader_display -> {action,device_sw_version,device_type,id,ip_address,label,last_seen_at,livemode,location,metadata,object,serial_number,+1more} — Set reader display
POST /v1/terminal/refunds -> {} — Create a refund using a Terminal-supported device.
POST /v1/test_helpers/confirmation_tokens -> {created,expires_at,id,livemode,mandate_data,object,payment_intent,payment_method_options,payment_method_preview,return_url,setup_future_usage,setup_intent,+2more} — Create a test Confirmation Token
POST /v1/test_helpers/customers/{customer}/fund_cash_balance -> {adjusted_for_overdraft,applied_to_payment,created,currency,customer,customer_account,ending_balance,funded,id,livemode,net_amount,object,+4more} — Fund a test mode cash balance
POST /v1/test_helpers/issuing/authorizations -> {amount,amount_details,approved,authorization_method,balance_transactions,card,card_presence,cardholder,created,currency,fleet,fraud_challenges,+18more} — Create a test-mode authorization
POST /v1/test_helpers/issuing/authorizations/{authorization}/capture -> {amount,amount_details,approved,authorization_method,balance_transactions,card,card_presence,cardholder,created,currency,fleet,fraud_challenges,+18more} — Capture a test-mode authorization
POST /v1/test_helpers/issuing/authorizations/{authorization}/expire -> {amount,amount_details,approved,authorization_method,balance_transactions,card,card_presence,cardholder,created,currency,fleet,fraud_challenges,+18more} — Expire a test-mode authorization
POST /v1/test_helpers/issuing/authorizations/{authorization}/finalize_amount -> {amount,amount_details,approved,authorization_method,balance_transactions,card,card_presence,cardholder,created,currency,fleet,fraud_challenges,+18more} — Finalize a test-mode authorization's amount
POST /v1/test_helpers/issuing/authorizations/{authorization}/fraud_challenges/respond -> {amount,amount_details,approved,authorization_method,balance_transactions,card,card_presence,cardholder,created,currency,fleet,fraud_challenges,+18more} — Respond to fraud challenge
POST /v1/test_helpers/issuing/authorizations/{authorization}/increment -> {amount,amount_details,approved,authorization_method,balance_transactions,card,card_presence,cardholder,created,currency,fleet,fraud_challenges,+18more} — Increment a test-mode authorization
POST /v1/test_helpers/issuing/authorizations/{authorization}/reverse -> {amount,amount_details,approved,authorization_method,balance_transactions,card,card_presence,cardholder,created,currency,fleet,fraud_challenges,+18more} — Reverse a test-mode authorization
POST /v1/test_helpers/issuing/cards/{card}/shipping/deliver -> {brand,cancellation_reason,cardholder,created,currency,cvc,exp_month,exp_year,financial_account,id,last4,latest_fraud_warning,+15more} — Deliver a testmode card
POST /v1/test_helpers/issuing/cards/{card}/shipping/fail -> {brand,cancellation_reason,cardholder,created,currency,cvc,exp_month,exp_year,financial_account,id,last4,latest_fraud_warning,+15more} — Fail a testmode card
POST /v1/test_helpers/issuing/cards/{card}/shipping/return -> {brand,cancellation_reason,cardholder,created,currency,cvc,exp_month,exp_year,financial_account,id,last4,latest_fraud_warning,+15more} — Return a testmode card
POST /v1/test_helpers/issuing/cards/{card}/shipping/ship -> {brand,cancellation_reason,cardholder,created,currency,cvc,exp_month,exp_year,financial_account,id,last4,latest_fraud_warning,+15more} — Ship a testmode card
POST /v1/test_helpers/issuing/cards/{card}/shipping/submit -> {brand,cancellation_reason,cardholder,created,currency,cvc,exp_month,exp_year,financial_account,id,last4,latest_fraud_warning,+15more} — Submit a testmode card
POST /v1/test_helpers/issuing/personalization_designs/{personalization_design}/activate -> {card_logo,carrier_text,created,id,livemode,lookup_key,metadata,name,object,physical_bundle,preferences,rejection_reasons,+1more} — Activate a testmode personalization design
POST /v1/test_helpers/issuing/personalization_designs/{personalization_design}/deactivate -> {card_logo,carrier_text,created,id,livemode,lookup_key,metadata,name,object,physical_bundle,preferences,rejection_reasons,+1more} — Deactivate a testmode personalization design
POST /v1/test_helpers/issuing/personalization_designs/{personalization_design}/reject -> {card_logo,carrier_text,created,id,livemode,lookup_key,metadata,name,object,physical_bundle,preferences,rejection_reasons,+1more} — Reject a testmode personalization design
POST /v1/test_helpers/issuing/settlements -> {bin,clearing_date,created,currency,id,interchange_fees_amount,livemode,metadata,net_total_amount,network,network_fees_amount,network_settlement_identifier,+5more} — Create a test-mode settlement
POST /v1/test_helpers/issuing/settlements/{settlement}/complete -> {bin,clearing_date,created,currency,id,interchange_fees_amount,livemode,metadata,net_total_amount,network,network_fees_amount,network_settlement_identifier,+5more} — Complete a test-mode settlement
POST /v1/test_helpers/issuing/transactions/create_force_capture -> {amount,amount_details,authorization,balance_transaction,card,cardholder,created,currency,dispute,id,livemode,merchant_amount,+10more} — Create a test-mode force capture
POST /v1/test_helpers/issuing/transactions/create_unlinked_refund -> {amount,amount_details,authorization,balance_transaction,card,cardholder,created,currency,dispute,id,livemode,merchant_amount,+10more} — Create a test-mode unlinked refund
POST /v1/test_helpers/issuing/transactions/{transaction}/refund -> {amount,amount_details,authorization,balance_transaction,card,cardholder,created,currency,dispute,id,livemode,merchant_amount,+10more} — Refund a test-mode transaction
POST /v1/test_helpers/refunds/{refund}/expire -> {amount,balance_transaction,charge,created,currency,description,destination_details,failure_balance_transaction,failure_reason,id,instructions_email,metadata,+10more} — Expire a pending refund.
POST /v1/test_helpers/terminal/readers/{reader}/present_payment_method -> {action,device_sw_version,device_type,id,ip_address,label,last_seen_at,livemode,location,metadata,object,serial_number,+1more} — Simulate presenting a payment method
POST /v1/test_helpers/terminal/readers/{reader}/succeed_input_collection -> {action,device_sw_version,device_type,id,ip_address,label,last_seen_at,livemode,location,metadata,object,serial_number,+1more} — Simulate a successful input collection
POST /v1/test_helpers/terminal/readers/{reader}/timeout_input_collection -> {action,device_sw_version,device_type,id,ip_address,label,last_seen_at,livemode,location,metadata,object,serial_number,+1more} — Simulate an input collection timeout
GET /v1/test_helpers/test_clocks?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all test clocks
POST /v1/test_helpers/test_clocks -> {created,deletes_after,frozen_time,id,livemode,name,object,status,status_details} — Create a test clock
GET /v1/test_helpers/test_clocks/{test_clock}?expand -> {created,deletes_after,frozen_time,id,livemode,name,object,status,status_details} — Retrieve a test clock
DELETE /v1/test_helpers/test_clocks/{test_clock} -> {deleted,id,object} — Delete a test clock
POST /v1/test_helpers/test_clocks/{test_clock}/advance -> {created,deletes_after,frozen_time,id,livemode,name,object,status,status_details} — Advance a test clock
POST /v1/test_helpers/treasury/inbound_transfers/{id}/fail -> {amount,cancelable,created,currency,description,failure_details,financial_account,hosted_regulatory_receipt_url,id,linked_flows,livemode,metadata,+8more} — Test mode: Fail an InboundTransfer
POST /v1/test_helpers/treasury/inbound_transfers/{id}/return -> {amount,cancelable,created,currency,description,failure_details,financial_account,hosted_regulatory_receipt_url,id,linked_flows,livemode,metadata,+8more} — Test mode: Return an InboundTransfer
POST /v1/test_helpers/treasury/inbound_transfers/{id}/succeed -> {amount,cancelable,created,currency,description,failure_details,financial_account,hosted_regulatory_receipt_url,id,linked_flows,livemode,metadata,+8more} — Test mode: Succeed an InboundTransfer
POST /v1/test_helpers/treasury/outbound_payments/{id} -> {amount,cancelable,created,currency,customer,description,destination_payment_method,destination_payment_method_details,end_user_details,expected_arrival_date,financial_account,hosted_regulatory_receipt_url,+10more} — Test mode: Update an OutboundPayment
POST /v1/test_helpers/treasury/outbound_payments/{id}/fail -> {amount,cancelable,created,currency,customer,description,destination_payment_method,destination_payment_method_details,end_user_details,expected_arrival_date,financial_account,hosted_regulatory_receipt_url,+10more} — Test mode: Fail an OutboundPayment
POST /v1/test_helpers/treasury/outbound_payments/{id}/post -> {amount,cancelable,created,currency,customer,description,destination_payment_method,destination_payment_method_details,end_user_details,expected_arrival_date,financial_account,hosted_regulatory_receipt_url,+10more} — Test mode: Post an OutboundPayment
POST /v1/test_helpers/treasury/outbound_payments/{id}/return -> {amount,cancelable,created,currency,customer,description,destination_payment_method,destination_payment_method_details,end_user_details,expected_arrival_date,financial_account,hosted_regulatory_receipt_url,+10more} — Test mode: Return an OutboundPayment
POST /v1/test_helpers/treasury/outbound_transfers/{outbound_transfer} -> {amount,cancelable,created,currency,description,destination_payment_method,destination_payment_method_details,expected_arrival_date,financial_account,hosted_regulatory_receipt_url,id,livemode,+8more} — Test mode: Update an OutboundTransfer
POST /v1/test_helpers/treasury/outbound_transfers/{outbound_transfer}/fail -> {amount,cancelable,created,currency,description,destination_payment_method,destination_payment_method_details,expected_arrival_date,financial_account,hosted_regulatory_receipt_url,id,livemode,+8more} — Test mode: Fail an OutboundTransfer
POST /v1/test_helpers/treasury/outbound_transfers/{outbound_transfer}/post -> {amount,cancelable,created,currency,description,destination_payment_method,destination_payment_method_details,expected_arrival_date,financial_account,hosted_regulatory_receipt_url,id,livemode,+8more} — Test mode: Post an OutboundTransfer
POST /v1/test_helpers/treasury/outbound_transfers/{outbound_transfer}/return -> {amount,cancelable,created,currency,description,destination_payment_method,destination_payment_method_details,expected_arrival_date,financial_account,hosted_regulatory_receipt_url,id,livemode,+8more} — Test mode: Return an OutboundTransfer
POST /v1/test_helpers/treasury/received_credits -> {amount,created,currency,description,failure_code,financial_account,hosted_regulatory_receipt_url,id,initiating_payment_method_details,linked_flows,livemode,network,+4more} — Test mode: Create a ReceivedCredit
POST /v1/test_helpers/treasury/received_debits -> {amount,created,currency,description,failure_code,financial_account,hosted_regulatory_receipt_url,id,initiating_payment_method_details,linked_flows,livemode,network,+4more} — Test mode: Create a ReceivedDebit
POST /v1/tokens -> {bank_account,card,client_ip,created,id,livemode,object,type,used} — Create a CVC update token
GET /v1/tokens/{token}?expand -> {bank_account,card,client_ip,created,id,livemode,object,type,used} — Retrieve a token
GET /v1/topups?amount&created&ending_before&expand&limit&starting_after&status -> {data,has_more,object,url} — List all top-ups
POST /v1/topups -> {amount,balance_transaction,created,currency,description,expected_availability_date,failure_code,failure_message,id,livemode,metadata,object,+4more} — Create a top-up
GET /v1/topups/{topup}?expand -> {amount,balance_transaction,created,currency,description,expected_availability_date,failure_code,failure_message,id,livemode,metadata,object,+4more} — Retrieve a top-up
POST /v1/topups/{topup} -> {amount,balance_transaction,created,currency,description,expected_availability_date,failure_code,failure_message,id,livemode,metadata,object,+4more} — Update a top-up
POST /v1/topups/{topup}/cancel -> {amount,balance_transaction,created,currency,description,expected_availability_date,failure_code,failure_message,id,livemode,metadata,object,+4more} — Cancel a top-up
GET /v1/transfers?created&destination&ending_before&expand&limit&starting_after&transfer_group -> {data,has_more,object,url} — List all transfers
POST /v1/transfers -> {amount,amount_reversed,balance_transaction,created,currency,description,destination,destination_payment,id,livemode,metadata,object,+5more} — Create a transfer
GET /v1/transfers/{id}/reversals?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all reversals
POST /v1/transfers/{id}/reversals -> {amount,balance_transaction,created,currency,destination_payment_refund,id,metadata,object,source_refund,transfer} — Create a transfer reversal
GET /v1/transfers/{transfer}?expand -> {amount,amount_reversed,balance_transaction,created,currency,description,destination,destination_payment,id,livemode,metadata,object,+5more} — Retrieve a transfer
POST /v1/transfers/{transfer} -> {amount,amount_reversed,balance_transaction,created,currency,description,destination,destination_payment,id,livemode,metadata,object,+5more} — Update a transfer
GET /v1/transfers/{transfer}/reversals/{id}?expand -> {amount,balance_transaction,created,currency,destination_payment_refund,id,metadata,object,source_refund,transfer} — Retrieve a reversal
POST /v1/transfers/{transfer}/reversals/{id} -> {amount,balance_transaction,created,currency,destination_payment_refund,id,metadata,object,source_refund,transfer} — Update a reversal
GET /v1/treasury/credit_reversals?ending_before&expand&financial_account*&limit&received_credit&starting_after&status -> {data,has_more,object,url} — List all CreditReversals
POST /v1/treasury/credit_reversals -> {amount,created,currency,financial_account,hosted_regulatory_receipt_url,id,livemode,metadata,network,object,received_credit,status,+2more} — Create a CreditReversal
GET /v1/treasury/credit_reversals/{credit_reversal}?expand -> {amount,created,currency,financial_account,hosted_regulatory_receipt_url,id,livemode,metadata,network,object,received_credit,status,+2more} — Retrieve a CreditReversal
GET /v1/treasury/debit_reversals?ending_before&expand&financial_account*&limit&received_debit&resolution&starting_after&status -> {data,has_more,object,url} — List all DebitReversals
POST /v1/treasury/debit_reversals -> {amount,created,currency,financial_account,hosted_regulatory_receipt_url,id,linked_flows,livemode,metadata,network,object,received_debit,+3more} — Create a DebitReversal
GET /v1/treasury/debit_reversals/{debit_reversal}?expand -> {amount,created,currency,financial_account,hosted_regulatory_receipt_url,id,linked_flows,livemode,metadata,network,object,received_debit,+3more} — Retrieve a DebitReversal
GET /v1/treasury/financial_accounts?created&ending_before&expand&limit&starting_after&status -> {data,has_more,object,url} — List all FinancialAccounts
POST /v1/treasury/financial_accounts -> {active_features,balance,country,created,features,financial_addresses,id,is_default,livemode,metadata,nickname,object,+6more} — Create a FinancialAccount
GET /v1/treasury/financial_accounts/{financial_account}?expand -> {active_features,balance,country,created,features,financial_addresses,id,is_default,livemode,metadata,nickname,object,+6more} — Retrieve a FinancialAccount
POST /v1/treasury/financial_accounts/{financial_account} -> {active_features,balance,country,created,features,financial_addresses,id,is_default,livemode,metadata,nickname,object,+6more} — Update a FinancialAccount
POST /v1/treasury/financial_accounts/{financial_account}/close -> {active_features,balance,country,created,features,financial_addresses,id,is_default,livemode,metadata,nickname,object,+6more} — Close a FinancialAccount
GET /v1/treasury/financial_accounts/{financial_account}/features?expand -> {card_issuing,deposit_insurance,financial_addresses,inbound_transfers,intra_stripe_flows,object,outbound_payments,outbound_transfers} — Retrieve FinancialAccount Features
POST /v1/treasury/financial_accounts/{financial_account}/features -> {card_issuing,deposit_insurance,financial_addresses,inbound_transfers,intra_stripe_flows,object,outbound_payments,outbound_transfers} — Update FinancialAccount Features
GET /v1/treasury/inbound_transfers?ending_before&expand&financial_account*&limit&starting_after&status -> {data,has_more,object,url} — List all InboundTransfers
POST /v1/treasury/inbound_transfers -> {amount,cancelable,created,currency,description,failure_details,financial_account,hosted_regulatory_receipt_url,id,linked_flows,livemode,metadata,+8more} — Create an InboundTransfer
GET /v1/treasury/inbound_transfers/{id}?expand -> {amount,cancelable,created,currency,description,failure_details,financial_account,hosted_regulatory_receipt_url,id,linked_flows,livemode,metadata,+8more} — Retrieve an InboundTransfer
POST /v1/treasury/inbound_transfers/{inbound_transfer}/cancel -> {amount,cancelable,created,currency,description,failure_details,financial_account,hosted_regulatory_receipt_url,id,linked_flows,livemode,metadata,+8more} — Cancel an InboundTransfer
GET /v1/treasury/outbound_payments?created&customer&ending_before&expand&financial_account*&limit&starting_after&status -> {data,has_more,object,url} — List all OutboundPayments
POST /v1/treasury/outbound_payments -> {amount,cancelable,created,currency,customer,description,destination_payment_method,destination_payment_method_details,end_user_details,expected_arrival_date,financial_account,hosted_regulatory_receipt_url,+10more} — Create an OutboundPayment
GET /v1/treasury/outbound_payments/{id}?expand -> {amount,cancelable,created,currency,customer,description,destination_payment_method,destination_payment_method_details,end_user_details,expected_arrival_date,financial_account,hosted_regulatory_receipt_url,+10more} — Retrieve an OutboundPayment
POST /v1/treasury/outbound_payments/{id}/cancel -> {amount,cancelable,created,currency,customer,description,destination_payment_method,destination_payment_method_details,end_user_details,expected_arrival_date,financial_account,hosted_regulatory_receipt_url,+10more} — Cancel an OutboundPayment
GET /v1/treasury/outbound_transfers?ending_before&expand&financial_account*&limit&starting_after&status -> {data,has_more,object,url} — List all OutboundTransfers
POST /v1/treasury/outbound_transfers -> {amount,cancelable,created,currency,description,destination_payment_method,destination_payment_method_details,expected_arrival_date,financial_account,hosted_regulatory_receipt_url,id,livemode,+8more} — Create an OutboundTransfer
GET /v1/treasury/outbound_transfers/{outbound_transfer}?expand -> {amount,cancelable,created,currency,description,destination_payment_method,destination_payment_method_details,expected_arrival_date,financial_account,hosted_regulatory_receipt_url,id,livemode,+8more} — Retrieve an OutboundTransfer
POST /v1/treasury/outbound_transfers/{outbound_transfer}/cancel -> {amount,cancelable,created,currency,description,destination_payment_method,destination_payment_method_details,expected_arrival_date,financial_account,hosted_regulatory_receipt_url,id,livemode,+8more} — Cancel an OutboundTransfer
GET /v1/treasury/received_credits?ending_before&expand&financial_account*&limit&linked_flows&starting_after&status -> {data,has_more,object,url} — List all ReceivedCredits
GET /v1/treasury/received_credits/{id}?expand -> {amount,created,currency,description,failure_code,financial_account,hosted_regulatory_receipt_url,id,initiating_payment_method_details,linked_flows,livemode,network,+4more} — Retrieve a ReceivedCredit
GET /v1/treasury/received_debits?ending_before&expand&financial_account*&limit&starting_after&status -> {data,has_more,object,url} — List all ReceivedDebits
GET /v1/treasury/received_debits/{id}?expand -> {amount,created,currency,description,failure_code,financial_account,hosted_regulatory_receipt_url,id,initiating_payment_method_details,linked_flows,livemode,network,+4more} — Retrieve a ReceivedDebit
GET /v1/treasury/transaction_entries?created&effective_at&ending_before&expand&financial_account*&limit&order_by&starting_after&transaction -> {data,has_more,object,url} — List all TransactionEntries
GET /v1/treasury/transaction_entries/{id}?expand -> {balance_impact,created,currency,effective_at,financial_account,flow,flow_details,flow_type,id,livemode,object,transaction,+1more} — Retrieve a TransactionEntry
GET /v1/treasury/transactions?created&ending_before&expand&financial_account*&limit&order_by&starting_after&status&status_transitions -> {data,has_more,object,url} — List all Transactions
GET /v1/treasury/transactions/{id}?expand -> {amount,balance_impact,created,currency,description,entries,financial_account,flow,flow_details,flow_type,id,livemode,+3more} — Retrieve a Transaction
GET /v1/webhook_endpoints?ending_before&expand&limit&starting_after -> {data,has_more,object,url} — List all webhook endpoints
POST /v1/webhook_endpoints -> {api_version,application,created,description,enabled_events,id,livemode,metadata,object,secret,status,url} — Create a webhook endpoint
GET /v1/webhook_endpoints/{webhook_endpoint}?expand -> {api_version,application,created,description,enabled_events,id,livemode,metadata,object,secret,status,url} — Retrieve a webhook endpoint
POST /v1/webhook_endpoints/{webhook_endpoint} -> {api_version,application,created,description,enabled_events,id,livemode,metadata,object,secret,status,url} — Update a webhook endpoint
DELETE /v1/webhook_endpoints/{webhook_endpoint} -> {deleted,id,object} — Delete a webhook endpoint
