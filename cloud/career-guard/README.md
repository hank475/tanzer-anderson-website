# Career Guard Private Room — Validated Source Bundle

This directory contains the immutable, checksum-verified source bundle for the separate Henry and Destiny Career Guard workspaces.

GitHub Actions runs `reconstruct.sh`, verifies the archive SHA-256 and every source-file checksum, then executes the nine-test suite, Wrangler dry run, Cloudflare deployment, production health checks, and the initial live-source refresh.

The deployed system includes:

- encrypted candidate profiles derived from the approved Resume Foundry records;
- on-demand job-specific ATS DOCX resumes generated from verified work history;
- remote recruiter, sourcer, recruiting-coordinator, contract, fractional, RPO, agency, and part-time lanes;
- six-hour source rotation across direct Ashby, Lever, and Greenhouse boards plus attributed remote-job feeds;
- one-click standing authorization renewal;
- a deduplicated application and evidence ledger;
- a fail-closed external-submission boundary until an authenticated executor returns confirmation evidence.

Raw candidate access tokens are never committed. Only token hashes are present inside the encrypted source bundle.
