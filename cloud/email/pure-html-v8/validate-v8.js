'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const source = fs.readFileSync(path.join(root, 'Code.gs'), 'utf8');

global.Utilities = {
  newBlob(value) {
    const buffer = Buffer.from(String(value), 'utf8');
    return {getBytes: () => Array.from(buffer)};
  }
};

vm.runInThisContext(source, {filename: 'Code.gs'});

const payload = normalizeV8_(samplePayloadV8_());
const outputs = {
  baseline_safe: buildBaselineSafeHtmlV8_(payload),
  maximum_safe_html: buildMaximumSafeHtmlV8_(Object.assign({}, payload, {mode: 'maximum_safe_html'}))
};

const forbidden = [
  '<img', 'background-image', 'url(', 'cid:', 'data:image', '<style',
  '@media', '<script', 'display:flex', 'display:grid', 'position:absolute',
  'position:fixed', 'transform:'
];

fs.mkdirSync(path.join(root, 'artifacts'), {recursive: true});
const receipt = {};
for (const [mode, markup] of Object.entries(outputs)) {
  validatePureHtmlV8_(markup);
  const lowered = markup.toLowerCase();
  for (const token of forbidden) {
    if (lowered.includes(token)) throw new Error(`${mode} contains forbidden token: ${token}`);
  }
  if (!markup.includes('Dear Henry,')) throw new Error(`${mode} is missing the personalized greeting.`);
  if (!markup.includes('Rather than send a general agency pitch I’d suggest')) throw new Error(`${mode} is missing the approved opening.`);
  if (!markup.includes('PROOF OF CONCEPT')) throw new Error(`${mode} is missing the proof map.`);
  if (!markup.includes('Principal Enterprise Security Engineer')) throw new Error(`${mode} is missing the role.`);
  if (!markup.includes('MANAGING DIRECTOR - STRATEGY AND BUSINESS DEVELOPMENT')) throw new Error(`${mode} has the wrong title.`);
  if (!markup.includes('director@tanzeranderson.com')) throw new Error(`${mode} has the wrong sender identity.`);
  const bytes = Buffer.byteLength(markup, 'utf8');
  if (bytes >= 50000) throw new Error(`${mode} exceeds the 50 KB gate: ${bytes}`);
  fs.writeFileSync(path.join(root, 'artifacts', `${mode}.html`), markup);
  receipt[mode] = {bytes, forbidden_tokens: 0, image_elements: 0, external_assets: 0, qa_pass: true};
}

fs.writeFileSync(path.join(root, 'artifacts', 'receipt.json'), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt, null, 2));
