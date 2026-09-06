# Trading Ledger recovery evidence — 2026-09-06

The existing GitHub Pages Trading Ledger release was restored and verified at its established URL, https://hank475.github.io/tanzer-anderson-website/trading-journal/. No application source or trading parameters were changed.

## Repairs

1. The daily verification trigger ran gh without a checkout or repository context. The existing trigger now explicitly targets ${{ github.repository }}. Provider run [34048780163](https://github.com/hank475/tanzer-anderson-website/actions/runs/34048780163) passed.
2. The final published archive segment contained duplicated compressed tail bytes. The decoded archive failed its original SHA-256 and gzip integrity, so the browser loader could not load the app. Removing the duplicated tail through exact reconstruction restored the original archive bytes and original SHA-256: `15c76c188aa49fe857ee450217cf94b998e22768b394e9e1bb527b04c9858ca8`. The expected checksum was preserved. Source archive commit: `0eec36f394a6be8b7b1a3d06d2cd712a4bd9bffd`; published segment commit: `4a1ec50a7f35aff8045b42f9ae02942623c10cb0`.
3. The release verifier previously looked for dynamically generated account names in HTML and TradingView attribution in JavaScript. Those checks now target the files containing the real definitions. Verification additionally checks gzip integrity and exact source/published archive equality.

## Provider evidence

- [Pages build and deployment 34049020303](https://github.com/hank475/tanzer-anderson-website/actions/runs/34049020303): success.
- [Hosted verification 34049299987](https://github.com/hank475/tanzer-anderson-website/actions/runs/34049299987), job `101529901100`: all steps succeeded.
- Verification source: `abbc067593beb9bc3ac93bea5eca6c05748b22f1`.
- [Generated release record](tanzer-trading-ledger-github-pages.md): recorded 2026-09-06T17:39:54Z after public endpoint, archive, JavaScript syntax and source checks passed.

## Browser evidence

On 2026-09-06 the hosted browser app loaded its full Command Ledger, navigated to Data Vault and back, and displayed eight accounts and zero committed trades in a fresh browser vault. The built-in system self-test returned all nine checks PASS: open IndexedDB, eight accounts, synthetic P&L sample ($50 net / 2.0 profit factor), one-row CSV parser sample, finite tax-model output, canvas support, file APIs, online status and service-worker capability.

These bounded checks do not establish tax accuracy, all imports, real brokerage account settings, installed offline operation, or full financial-model correctness. No trades, account configuration changes, imported financial records, or provider orders were performed. The separate Cloudflare deployment remains dependent on valid provider authentication; this recovery used the existing GitHub Pages deployment.
