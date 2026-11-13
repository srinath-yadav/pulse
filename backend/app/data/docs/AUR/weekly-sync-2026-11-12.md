# Aurora weekly sync, 12 November 2026

## Slow dashboard (AUR-301)
Profiling showed the sales overview runs one database query per store. Sahil is replacing it with a single grouped query and expects load time under 2 seconds by 19 November.

## Saved views (AUR-306)
Low priority. Aurora is happy to wait until after the store filter ships.
