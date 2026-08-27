#!/usr/bin/env node
/**
 * Read `sf apex run test --json` from stdin. Fail unless every test passed
 * and test-run coverage is at least 75% (same floor as templates/deploy.mjs).
 */
import fs from 'node:fs';

const FLOOR = 75;
const raw = fs.readFileSync(0, 'utf8');
let parsed;
try {
  parsed = JSON.parse(raw.slice(raw.indexOf('{')));
} catch {
  process.stderr.write('ERROR apex test JSON was not parseable\n');
  process.exit(1);
}

const summary = parsed?.result?.summary || parsed?.summary || {};
const failing = Number(summary.failing ?? summary.numTestsFail ?? 0);
const outcome = String(summary.outcome || '');
if (failing > 0 || /failed/i.test(outcome)) {
  process.stderr.write(`ERROR Apex tests failed (failing=${failing} outcome=${outcome || 'unknown'})\n`);
  process.exit(1);
}

const coverageRaw = summary.testRunCoverage ?? summary.orgWideCoverage ?? '';
const coverage = Number(String(coverageRaw).replace('%', ''));
if (!Number.isFinite(coverage)) {
  process.stderr.write('ERROR Apex test report had no coverage percent\n');
  process.exit(1);
}
if (coverage < FLOOR) {
  process.stderr.write(`ERROR coverage ${coverage}% is below ${FLOOR}%\n`);
  process.exit(1);
}

process.stdout.write(`OK Apex tests passed; coverage ${coverage}%\n`);
