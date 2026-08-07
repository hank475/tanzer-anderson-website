'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const source = [
  fs.readFileSync(path.join(root, 'Code.gs'), 'utf8'),
  fs.readFileSync(path.join(root, 'PortalIntegration.gs'), 'utf8')
].join('\n\n');

global.Utilities = {
  newBlob(value) {
    const buffer = Buffer.from(String(value), 'utf8');
    return {getBytes: () => Array.from(buffer)};
  },
  getUuid() {
    return 'ABCDEF12-3456-7890-ABCD-EF1234567890';
  }
};

vm.runInThisContext(source, {filename: 'max-safe-portal.js'});

const payload = normalizeV9_(samplePayloadV9_());
payload.reference = 'ABCDEF12';
const baseMarkup = buildMaxSafeHtmlV9_(payload);
validateMaxSafeV9_(baseMarkup);
const markup = addRoleIntakePortalV10_(baseMarkup, payload);
validateMaxSafePortalV10_(markup);

const lowered = markup.toLowerCase();
const forbidden = [
  '<img', 'background-image', 'url(', 'cid:', 'data:image',
  '@media', '<script', 'display:flex', 'display:grid', 'position:absolute',
  'position:fixed', 'transform:'
];
for (const token of forbidden) {
  if (lowered.includes(token)) throw new Error(`Max Safe Portal contains forbidden token: ${token}`);
}
if (/\bring\b/i.test(markup)) throw new Error('Max Safe Portal contains the prohibited word "ring".');
if (!markup.includes('Dear Henry,')) throw new Error('Personalized greeting missing.');
if (!markup.includes('Rather than send a general agency pitch I’d suggest')) throw new Error('Approved opening missing.');
if (!markup.includes('PROOF OF CONCEPT')) throw new Error('Proof map missing.');
if (!markup.includes('Principal Enterprise Security Engineer')) throw new Error('Role missing.');
if (!markup.includes('MANAGING DIRECTOR - STRATEGY AND BUSINESS DEVELOPMENT')) throw new Error('Exact title missing.');
if (!markup.includes('director@tanzeranderson.com')) throw new Error('Exact sender identity missing.');
if (!markup.includes('https://tanzeranderson.com/role-intake/')) throw new Error('Role-intake portal URL missing.');
if (!markup.includes('contact=Henry')) throw new Error('Contact prefill missing.');
if (!markup.includes('company=Palo%20Alto%20Networks')) throw new Error('Company prefill missing.');
if (!markup.includes('role=Principal%20Enterprise%20Security%20Engineer')) throw new Error('Role prefill missing.');
if (!markup.includes('class="ta-role-cta"')) throw new Error('Role-intake CTA class missing.');
if (!markup.includes('.ta-role-cta:hover')) throw new Error('Progressive hover rule missing.');

const bytes = Buffer.byteLength(markup, 'utf8');
if (bytes >= 50000) throw new Error(`Max Safe Portal exceeds 50 KB: ${bytes}`);

fs.mkdirSync(path.join(root, 'artifacts'), {recursive: true});
fs.writeFileSync(path.join(root, 'artifacts', 'max-safe-portal.html'), markup);

const receipt = {
  version: 'TA_MAX_SAFE_V10_PORTAL',
  bytes,
  forbidden_tokens: 0,
  prohibited_copy_terms: 0,
  image_elements: 0,
  external_assets: 0,
  side_panel: false,
  role_intake_link: true,
  personalized_prefill: true,
  progressive_hover: true,
  qa_pass: true
};
fs.writeFileSync(path.join(root, 'artifacts', 'receipt.json'), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt, null, 2));
