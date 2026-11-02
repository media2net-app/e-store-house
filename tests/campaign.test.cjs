const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const moduleExports = {};
const source = ts.transpileModule(fs.readFileSync('src/lib/campaign.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(source, { exports: moduleExports, require: key => {
  if (key === '@/data/campaign.json') return { default: JSON.parse(fs.readFileSync('src/data/campaign.json', 'utf8')) };
  throw Error(key);
} });
const { campaignActive, nextCampaignTransition } = moduleExports;
const start = '2026-11-05T00:00:00+02:00';
const end = '2026-11-12T00:00:00+02:00';
const auto = { timeZone: 'Europe/Bucharest', mode: 'auto', startAt: start, endAt: end };
test('campaign changes at Romanian start and end boundaries', () => {
  const beginning = Date.parse(start), ending = Date.parse(end);
  assert.equal(campaignActive(beginning - 1, auto), false);
  assert.equal(campaignActive(beginning, auto), true);
  assert.equal(campaignActive(ending - 1, auto), true);
  assert.equal(campaignActive(ending, auto), false);
  assert.equal(nextCampaignTransition(beginning - 1, auto), beginning);
  assert.equal(nextCampaignTransition(beginning, auto), ending);
  assert.equal(nextCampaignTransition(ending, auto), null);
});
test('manual control and missing dates never invent an expiry', () => {
  assert.equal(campaignActive(Date.parse(end) + 1, { ...auto, mode: 'on', endAt: null }), true);
  assert.equal(campaignActive(Date.parse(start), { ...auto, mode: 'off' }), false);
  assert.equal(campaignActive(Date.parse(start), { ...auto, endAt: null }), false);
});
