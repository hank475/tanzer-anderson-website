# Tanzer Anderson Website — Cloudflare Deployment

This package contains the completed Tanzer Anderson public website, including the approved editorial homepage design, responsive mobile layouts, imagery, contact pathways, legal pages, sitemap, security headers, and Cloudflare contact handler.

## Publish through Cloudflare Pages

1. Sign in to Cloudflare.
2. Open **Workers & Pages**.
3. Select **Create application** and choose **Pages**.
4. Choose **Upload assets** or **Direct Upload**.
5. Upload `tanzer-anderson-cloudflare-site.zip`.
6. Set the project name to `tanzer-anderson` and deploy.
7. In the Pages project, open **Custom domains**.
8. Add `tanzeranderson.com` and `www.tanzeranderson.com`.

## Email routing

The website visibly uses:

- `clientservices@tanzeranderson.com`
- `henry@tanzeranderson.com`

Until a server-side `CONTACT_WEBHOOK_URL` is configured in Cloudflare, website forms safely open the visitor's email application with a completed message addressed to `clientservices@tanzeranderson.com`.

## Homepage design

The homepage follows the approved quiet-luxury editorial direction: dark photographic hero, ivory content bands, brass accents, leadership metrics, five-stage search process, insight cards, expertise and industry sections, impact proof, client feedback, and the complete footer. The separate mobile-device mockup from the visual reference is intentionally not part of the website.
