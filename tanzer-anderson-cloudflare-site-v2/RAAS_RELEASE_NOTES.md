# Recruiting-as-a-Service Review Release

## Commercial model

- Standard Professional Search: $1,250 per opening
- Specialized Professional Search: $2,000–$2,500 per opening, classified before acceptance
- Five Standard Searches: $5,500 prepaid
- Ten Standard Searches: $9,500 prepaid
- RaaS eligibility: individual contributor through Senior Manager
- Director / Senior Director: $20,000 separate Leadership Search
- VP: $30,000 separate Executive Search
- C-Suite / President: $50,000 retained Executive Search

## Operating rules

- The search starts only after payment or approved credit allocation and acceptance of the completed official intake and agreed criteria.
- Initial candidate delivery is targeted within 10 business days after official start.
- The search is fulfilled by three distinct interview selections or one offer selection.
- One or two interview selections keep the search open.
- A date passing never fulfills a search.
- Paid recruiting media, assessments, background checks, and other third-party costs require separate approval and funding.
- Director+ never enters RaaS checkout.

## Technical boundary

- Checkout remains disabled in `raas/config.js`.
- Forms use the existing `/api/contact` route with an email fallback.
- The Worker injects a reversible RaaS link and approved summary sections into the existing home and Expertise pages.
- The sitemap includes `/raas/` and `/executive-search/`.

## Review required before production

- Commercial and legal terms
- Stripe account and test-mode products
- Form delivery and mailbox readback
- Role-routing tests
- Responsive and accessibility tests
- Existing-route regression
- Cloudflare preview and rollback evidence
- Explicit merge and production-promotion authorization
