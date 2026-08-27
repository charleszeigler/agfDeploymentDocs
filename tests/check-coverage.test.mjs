import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

function run(json) {
  return spawnSync(process.execPath, ['ci/sf/check-coverage.mjs'], {
    input: JSON.stringify(json),
    encoding: 'utf8',
  });
}

test('check-coverage accepts a green RunLocalTests report', () => {
  const result = run({
    result: { summary: { outcome: 'Passed', failing: 0, testRunCoverage: '100%' } },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /coverage 100%/);
});

test('check-coverage rejects failures and low coverage', () => {
  const failed = run({
    result: { summary: { outcome: 'Failed', failing: 1, testRunCoverage: '100%' } },
  });
  assert.equal(failed.status, 1);
  const low = run({
    result: { summary: { outcome: 'Passed', failing: 0, testRunCoverage: '40%' } },
  });
  assert.equal(low.status, 1);
  assert.match(low.stderr, /below 75%/);
});
