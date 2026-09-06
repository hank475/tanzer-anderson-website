# Trading data and publisher recovery — 2026-09-06

The existing Meridian Oil Radar and NQ Intelligence routes were repaired in the existing repository and deployment. No new runtime, trade routing, broker connection or financial action was created.

## Meridian Oil Radar

- Repair source commit: `66656992872ecfb995d1f2b1e4cc394a90bdcce3`.
- [Publisher run 34049736700](https://github.com/hank475/tanzer-anderson-website/actions/runs/34049736700): success, including parser tests, build, public exact-snapshot readback and durable record.
- [Pages run 34049769602](https://github.com/hank475/tanzer-anderson-website/actions/runs/34049769602): success.
- [Current hosted status](meridian-oil-radar-github-pages.md) records 23 news items, 10 market series, six fundamental series and zero fallback sections.
- Public snapshot: https://hank475.github.io/tanzer-anderson-website/oil-radar/api/snapshot.json
- Verified snapshot generated `2026-09-06T17:48:34.635Z`: healthy sources increased from 11/19 to 17/19; available fundamentals increased from 0 to 6.

The code had routed EIA identifiers through FRED. It also mapped Cushing to total U.S. crude stocks and production to refinery utilization. The adapter now reads the correct [official EIA weekly histories](https://www.eia.gov/petroleum/supply/weekly/), checks the exact series title and units, preserves observation dates, and rejects missing or withheld observations instead of treating them as zero.

| Capability | Verified EIA series | Latest observation | Source value |
| --- | --- | --- | --- |
| Commercial crude ex-SPR | WCESTUS1 | 2026-08-28 | 424460 thousand barrels |
| Cushing crude | W_EPC0_SAX_YCUOK_MBBL | 2026-08-28 | 22508 thousand barrels |
| Strategic reserve | WCSSTUS1 | 2026-08-28 | 286604 thousand barrels |
| Total gasoline stocks | WGTSTUS1 | 2026-08-28 | 205669 thousand barrels |
| Distillate stocks | WDISTUS1 | 2026-08-28 | 104187 thousand barrels |
| U.S. crude production | WCRFPUS2 | 2026-08-28 | 13862 thousand barrels/day |

All six values were independently read from the current official history pages and then read back from the provider-published snapshot and rendered Fundamentals page. The published observation date agrees with the EIA's latest weekly report at verification time (released September 2; next release September 10). Two regression tests cover date/value parsing and rejection of wrong identities/units. No financial model weights were changed.

## NQ Intelligence

- The scheduled publisher was overwriting the existing approved v2.2 interface with a v2.0 archive. It now publishes the existing `cloud/nq-intelligence-v22` HTML/assets, preserving its original HTML SHA-256 `e68422f279b594a7de2895ae9e9026b7da4768ae3dab034148c118d379e6576f`.
- The established daily triggers now dispatch the same current publisher, so the older archive renderer does not overwrite the route.
- CFTC discovery was repaired to the feed linked from the [official CFTC RSS directory](https://www.cftc.gov/RSS/index.htm).
- The old Treasury RSS endpoint returned 404/timeouts. The adapter now reads dated releases from the [current official Treasury index](https://home.treasury.gov/news/press-releases), preserving source timestamps and rejecting off-domain or undated links.
- Final source commit: `d7a4464eae7f3e3032911611c5f306bd225a0a5d`.
- [Final publisher run 34049891462](https://github.com/hank475/tanzer-anderson-website/actions/runs/34049891462), job `101531471750`: success, including three source-adapter tests, build, v2.2 source integrity, deployment and exact public timestamp/hash readback.
- [Pages run 34049918578](https://github.com/hank475/tanzer-anderson-website/actions/runs/34049918578): success.
- Public data: https://hank475.github.io/tanzer-anderson-website/nq-intelligence/data/latest.json
- Verified edition: `2026-09-06T17:51:27.739348Z`; evidence hash `8154a40b1151158387ab3dcc1117345738e94d3e4e01622de647c67adbb70b92`.
- Source health increased from 21/24 to 23/24. Provider readback confirms 10 Treasury releases and 8 CFTC releases.
- Browser readback confirms title v2.2, all 30 enhancement modules and working enhancement-suite navigation. Desktop overflow check: 1363-pixel viewport, 1348-pixel document width. Mobile/device-specific behavior was not re-certified in this repair.

## Remaining external data gates

- GDELT still returns HTTP 429 in both existing provider pipelines. The current runs retried the established fetch path; official sources continue, the failed feed remains unavailable, and existing scheduled refreshes will retry. Provider rate-limit recovery is required for broader news discovery.
- The optional FRED gold fixing series returns 404 because FRED [removed the IBA/LBMA gold series in January 2022](https://news.research.stlouisfed.org/2022/01/ice-benchmark-administration-ltd-iba-data-to-be-removed-from-fred/). No equivalent data was fabricated or relabeled. Restoring that optional capability requires an authorized replacement source with compatible data rights.
- Public market quotes remain delayed/indicative and retain their existing stale/as-of labels. Licensed real-time data and consensus-surprise features remain gated.

This record certifies the source-routing and publication repairs, not trading performance or all product functionality. No orders or trades were transmitted.
