# Northwind Logistics: Order Management architecture

## Order sync
Orders flow from the Northwind ERP into our order service every 5 minutes. The ERP endpoint is slow, so the sync job uses a 30 second timeout per batch.

## Carrier rates
Carrier rate lookups call three external carrier APIs. Rates change daily, so caching them for 24 hours is safe (NWL-204).

## Known constraint
The ERP runs a nightly batch from 2 AM to 4 AM IST. During that window it responds in 40 to 60 seconds, well above our timeout.