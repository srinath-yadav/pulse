# Northwind weekly sync, 11 November 2026

## Order sync timeout (NWL-201)
Root cause found: sync failures all happen between 2 AM and 4 AM IST, during the ERP nightly batch. Two options were discussed: pause the sync during the batch window, or raise the timeout to 90 seconds. Northwind's ops lead, Farah Khan, prefers pausing the sync. Waiting for her written approval before we change it.

## Shipment tracking map (NWL-206)
Deprioritised. Northwind wants it after the January peak season, so it stays unassigned for now.
