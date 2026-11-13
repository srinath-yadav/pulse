# Aurora Retail: Retail Analytics requirements

## Performance
Every dashboard must load in under 2 seconds for a regional manager with 50 stores. Charts currently take 4 to 6 seconds on the sales overview (AUR-301).

## Users
Regional managers compare stores in their region. Head office compares regions. Store-level filters (AUR-302) are the top request from regional managers.

## Data
Sales data arrives nightly as CSV exports from the store systems. Files are UTF-8, but older stores still send Windows-1252, which caused the encoding bug fixed in AUR-303.
