import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  findUnfilledPlaceholders,
  main,
  parseArgs,
  parseJsonFromFirstBrace,
  redactText,
  stripSecrets,
} from '../templates/deploy.mjs';

test('parseArgs reads flags and repeatable --operator', () => {
  const parsed = parseArgs([
    '--deploy',
    '--target-org',
    'prod',
    '--start-at',
    'platform-deps',
    '--non-interactive',
    '--operator',
    'a@example.com',
    '--operator',
    'b@example.com',
  ]);
  assert.equal(parsed.deploy, true);
  assert.equal(parsed.validateOnly, false);
  assert.equal(parsed.targetOrg, 'prod');
  assert.equal(parsed.startAt, 'platform-deps');
  assert.equal(parsed.nonInteractive, true);
  assert.deepEqual(parsed.operators, ['a@example.com', 'b@example.com']);
});

test('parseArgs rejects unknown flags and missing values', () => {
  assert.throws(() => parseArgs(['--nope']), /Unknown flag/);
  assert.throws(() => parseArgs(['--target-org']), /requires a value/);
  assert.throws(() => parseArgs(['--target-org', '--deploy']), /requires a value/);
});

test('parseJsonFromFirstBrace skips CLI warning prefix', () => {
  assert.deepEqual(parseJsonFromFirstBrace('Warning: foo\n{"ok":true}'), { ok: true });
  assert.equal(parseJsonFromFirstBrace('no object here'), null);
  assert.equal(parseJsonFromFirstBrace('{not-json'), null);
  assert.equal(parseJsonFromFirstBrace(null), null);
});

test('stripSecrets redacts nested tokens', () => {
  const redacted = stripSecrets({
    result: { accessToken: 'secret', username: 'user@example.com' },
    refreshToken: 'also-secret',
    list: [{ accessToken: 'x' }],
  });
  assert.equal(redacted.result.accessToken, '[redacted]');
  assert.equal(redacted.result.username, 'user@example.com');
  assert.equal(redacted.refreshToken, '[redacted]');
  assert.equal(redacted.list[0].accessToken, '[redacted]');
});

test('redactText covers JSON and bare token forms', () => {
  assert.match(redactText('{"accessToken":"abc"}'), /\[redacted\]/);
  assert.match(redactText('accessToken=abc'), /\[redacted\]/);
  assert.equal(redactText('username=user@example.com'), 'username=user@example.com');
});

test('findUnfilledPlaceholders ignores comments and filled members', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Package>
  <types>
    <members>AGENT_API_NAME</members>
    <name>AiAuthoringBundle</name>
  </types>
  <!--
  <types>
    <members>APEX_CLASS_API_NAME</members>
    <name>ApexClass</name>
  </types>
  -->
  <types>
    <members>Service_Agent</members>
    <name>AiAuthoringBundle</name>
  </types>
  <types>
    <members>Account.CUSTOM_FIELD_API_NAME</members>
    <name>CustomField</name>
  </types>
</Package>`;
  const hits = findUnfilledPlaceholders(xml);
  assert.ok(hits.includes('AGENT_API_NAME'));
  assert.ok(hits.includes('Account.CUSTOM_FIELD_API_NAME'));
  assert.ok(!hits.includes('APEX_CLASS_API_NAME'));
  assert.ok(!hits.includes('Service_Agent'));
});

test('main --help exits 0 without contacting an org', async () => {
  const write = process.stdout.write.bind(process.stdout);
  process.stdout.write = () => true;
  try {
    const code = await main(['--help']);
    assert.equal(code, 0);
  } finally {
    process.stdout.write = write;
  }
});

test('main rejects invalid operator combinations', async () => {
  await assert.rejects(() => main(['--validate-only', '--deploy', '--target-org', 'x']), /not both/);
  await assert.rejects(() => main(['--target-org', 'x']), /Choose --validate-only or --deploy/);
  await assert.rejects(() => main(['--deploy']), /--target-org is required/);
  await assert.rejects(() => main(['--deploy', '--target-org', 'has space']), /whitespace/);
  await assert.rejects(() => main(['--deploy', '--target-org', 'x', '--start-at', 'nope']), /Unknown --start-at/);
});
