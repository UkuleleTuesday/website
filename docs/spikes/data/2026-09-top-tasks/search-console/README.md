# Google Search Console exports: ukuleletuesday.ie

Evidence for the top-tasks review (`docs/spikes/2026-09-27-top-tasks-review.md`, sections 3.1
and 3.2) and for issue #177.

| | |
|---|---|
| Property | `ukuleletuesday.ie` Domain property (all hosts and protocols, so the apex host and the songbooks subdomain are included) |
| Search type | Web only (no Images, Video, News, Discover or Maps) |
| Exported | 2026-09-27, Search Console > Performance > Export |

## Two windows

| Folder | Period | Preset |
|---|---|---|
| `last-12-months/` | 2025-09-25 to 2026-09-24 | "Last 12 months" |
| `last-3-months/` | 2026-06-25 to 2026-09-24 | "Last 3 months" |

The three-month export was taken to check whether the twelve-month picture is still current,
in particular whether the apex host is still being served as a separate result. It is.

## Files (same layout in both folders)

| File | Contents |
|---|---|
| `Chart.csv` | Daily clicks, impressions, CTR and average position |
| `Queries.csv` | Top queries. Google omits rare queries for privacy, so this covers roughly half of all clicks |
| `Pages.csv` | Top pages, including the apex host and the songbooks subdomain where they appeared |
| `Countries.csv`, `Devices.csv` | Clicks and impressions by country and by device type |
| `Search appearance.csv` | Empty for this property |
| `Filters.csv` | The filters that were active on export |

All figures are aggregates. The query lists were scanned for personal names and contact details
before committing; none were present (the only name matches are song titles).

## Reproducing the tables

```bash
cd docs/spikes/data/2026-09-top-tasks/search-console
python3 analyse_search_console.py   # section 3.1 tables; reads last-12-months/ (pass another folder as an argument)
python3 compare_windows.py          # section 3.2 tables, twelve months against the last three
```

The scripts group queries into intent buckets with simple regular expressions and print the page,
device, country, monthly, weekday and query tables used in the report.
