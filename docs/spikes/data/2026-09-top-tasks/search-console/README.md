# Google Search Console export: ukuleletuesday.ie

Evidence for the top-tasks review (`docs/spikes/2026-09-27-top-tasks-review.md`, section 3.1)
and for issue #177.

| | |
|---|---|
| Property | `https://www.ukuleletuesday.ie/` (URL-prefix property) |
| Search type | Web only (no Images, Video, News, Discover or Maps) |
| Period | 2025-09-25 to 2026-09-24, the "last 12 months" preset at export time |
| Exported | 2026-09-27, Search Console > Performance > Export |

## Files

| File | Contents |
|---|---|
| `Chart.csv` | Daily clicks, impressions, CTR and average position |
| `Queries.csv` | Top queries. Google omits rare queries for privacy, so this covers roughly half of all clicks |
| `Pages.csv` | Top pages, including the apex host and the songbooks subdomain where they appeared |
| `Countries.csv`, `Devices.csv` | Clicks and impressions by country and by device type |
| `Search appearance.csv` | Empty for this property |
| `Filters.csv` | The filters that were active on export |

All figures are aggregates. The query list was scanned for personal names and contact details
before committing; none were present (the only name matches are song titles).

## Reproducing the tables

```bash
cd docs/spikes/data/2026-09-top-tasks/search-console
python3 analyse_search_console.py
```

The script groups queries into intent buckets with simple regular expressions and prints the page,
device, country, monthly, weekday and query tables used in the report.
