#!/usr/bin/env node
/**
 * TEMPLATE — Agentforce staged deploy coordinator
 *
 * Copy this file next to a retrieved Salesforce DX project. Do not run it from
 * inside force-app. It is a starting skeleton, not a tested org deployer, and
 * it has not been tested against the operator org.
 *
 * Follow docs/30-deployment-script.md. Fill env values and replace ALL_CAPS
 * placeholders in copied repo manifests before a real run.
 *
 * This file ships product-agnostic defaults only. Do not hardcode usernames,
 * org ids, product names, or emails. Sibling a/ and d/ folders are not
 * required.
 *
 * Usage (from the DX project after you copy this file):
 *   node deploy.mjs --validate-only --target-org <ALIAS>
 *   node deploy.mjs --deploy --target-org <ALIAS>
 *   node deploy.mjs --deploy --target-org <ALIAS> --start-at platform-deps
 *   node deploy.mjs --deploy --target-org <ALIAS> --operator <USERNAME>
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CWD = process.cwd();

const API_VERSION = process.env.API_VERSION || '67.0';
const WAIT_MINUTES = process.env.WAIT_MINUTES || '33';
const COVERAGE_FLOOR = 75;
const POLL_MS = 15_000;
const POLL_CAP = 80;

const PHASES = [
  'preflight',
  'data360-kit',
  'data360-ui',
  'platform-deps',
  'prompts',
  'prompts-activate',
  'apex',
  'agent-preview',
  'agent-publish',
  'employee-access',
  'permset-assign',
  'web-chat',
];

const PLATFORM_MANIFEST_NAMES = [
  'service-agent-package.xml',
  'employee-agent-package.xml',
  'lead-nurture-agent-package.xml',
];

const KNOWN_PLACEHOLDERS = [
  'AGENT_API_NAME',
  'AGENT_ACCESS_PERMISSION_SET_API_NAME',
  'APEX_CLASS_API_NAME',
  'APEX_CLASS_TEST_API_NAME',
  'FLOW_API_NAME',
  'PROMPT_TEMPLATE_API_NAME',
  'LIGHTNING_TYPE_API_NAME',
  'CLT_RENDERER_OR_EDITOR_LWC_API_NAME',
  'CUSTOM_OBJECT_API_NAME',
  'CUSTOM_FIELD_API_NAME',
  'NAMED_CREDENTIAL_API_NAME',
  'EXTERNAL_CREDENTIAL_API_NAME',
  'EMPLOYEE_DATA_ACCESS_PERMISSION_SET_API_NAME',
  'EMPLOYEE_PERMISSION_SET_GROUP_API_NAME',
  'CUSTOM_APPLICATION_API_NAME',
  'CUSTOM_TAB_API_NAME',
  'FLEXIPAGE_API_NAME',
  'EMPLOYEE_AGENT_ACCESS_PERMISSION_SET_API_NAME',
  'EMPLOYEE_AGENT_ACCESS_PERMISSION_SET_GROUP_API_NAME',
  'LEAD_NURTURE_PERMISSION_SET_API_NAME',
  'NURTURE_CUSTOM_OBJECT_API_NAME',
  'EMAIL_TEMPLATE_API_NAME',
  'DATA_KIT_DEVELOPER_NAME',
  'DATA_KIT_OBJECT_MEMBER',
  'DATA_KIT_OBJECT_DEPENDENCY',
  'DATA_KIT_OBJECT_TEMPLATE',
  'DATA_SOURCE_BUNDLE_DEFINITION',
  'DATA_STREAM_TEMPLATE',
  'DATA_SOURCE_NAME',
  'DATA_SOURCE_OBJECT_NAME',
  'DATA_STREAM_DEFINITION_NAME',
  'DATA_CONNECTOR_NAME',
  'DATA_SOURCE_DATA_MODEL_FIELD_MAP',
  'OBJECT_SOURCE_TARGET_MAP',
  'FIELD_SOURCE_TARGET_RELATIONSHIP',
  'CALCULATED_INSIGHT_API_NAME',
  'MARKET_SEGMENT_DEFINITION',
  'SEARCH_INDEX_CONFIGURATION',
];

const PLACEHOLDER_MEMBER_RE =
  /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*(?:_API_NAME|_DEVELOPER_NAME|_NAME|_MEMBER|_DEPENDENCY|_TEMPLATE|_DEFINITION|_MAP|_RELATIONSHIP|_CONFIGURATION|_OBJECT_NAME)$/;

const USAGE = `TEMPLATE — Agentforce staged deploy coordinator

Copy this file next to a retrieved DX project. Not a tested org deployer.
See docs/30-deployment-script.md.

Usage:
  node deploy.mjs --validate-only --target-org <ALIAS>
  node deploy.mjs --deploy --target-org <ALIAS> [--operator <USERNAME>]...
  node deploy.mjs --deploy --target-org <ALIAS> --start-at <PHASE>
  node deploy.mjs --help

Flags:
  --validate-only      Preflight + dry-run/validate only. Do not save past that.
  --deploy             Mutate after successful validation. Type DEPLOY to continue.
  --target-org         Required. Alias passed to every sf command.
  --start-at           Resume at a named phase after earlier phases completed.
  --non-interactive    Fail at DEPLOY / DONE. Do not skip those gates.
  --operator           Repeatable. Username for permset assign. Also logged.
  --help               Print this help.

Phases:
  ${PHASES.join(', ')}

Env (all optional; skip a phase when its path is missing):
  API_VERSION          Default 67.0
  WAIT_MINUTES         Default 33
  TEST_LEVEL           Agentforce packages default to RunLocalTests
  PLATFORM_PACKAGE     service | employee | lead manifest path
  DATA360_KIT_MANIFEST / DATA360_PACKAGE
  PROMPTS_MANIFEST / PROMPTS_PACKAGE
  APEX_MANIFEST / APEX_PACKAGE / APEX_SOURCE_DIR / APEX_TESTS
  EMPLOYEE_ACCESS_MANIFEST
  AGENT_API_NAME       Required for preview/publish
  PERMSET_NAME         Permission set for --operator assign
  SKIP_WEB_CHAT=1      Skip the web-chat DONE checkpoint

Checkpoints:
  Type exactly DEPLOY to mutate. Type exactly DONE at UI gates.
  --non-interactive fails those gates.

Logs:
  ~/.agf-deployment/<alias>/<timestamp>/deploy.log
`;

export function parseArgs(argv) {
  const out = {
    validateOnly: false,
    deploy: false,
    targetOrg: '',
    startAt: '',
    nonInteractive: false,
    operators: [],
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case '--validate-only':
        out.validateOnly = true;
        break;
      case '--deploy':
        out.deploy = true;
        break;
      case '--target-org':
        out.targetOrg = requireValue(arg, next);
        i += 1;
        break;
      case '--start-at':
        out.startAt = requireValue(arg, next);
        i += 1;
        break;
      case '--non-interactive':
        out.nonInteractive = true;
        break;
      case '--operator':
        out.operators.push(requireValue(arg, next));
        i += 1;
        break;
      case '--help':
      case '-h':
        out.help = true;
        break;
      default:
        throw new Error(`Unknown flag: ${arg}\n\n${USAGE}`);
    }
  }
  return out;
}

function requireValue(flag, value) {
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

export function parseJsonFromFirstBrace(text) {
  const idx = String(text ?? '').indexOf('{');
  if (idx === -1) return null;
  try {
    return JSON.parse(String(text).slice(idx));
  } catch {
    return null;
  }
}

export function stripSecrets(value) {
  if (Array.isArray(value)) return value.map(stripSecrets);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = /^(accessToken|refreshToken)$/i.test(key)
        ? '[redacted]'
        : stripSecrets(nested);
    }
    return out;
  }
  return value;
}

export function redactText(text) {
  return String(text ?? '')
    .replace(/("(?:accessToken|refreshToken)"\s*:\s*")(?:[^"\\]|\\.)*(")/gi, '$1[redacted]$2')
    .replace(/(accessToken|refreshToken)\s*[:=]\s*\S+/gi, '$1=[redacted]');
}

function quoteWin(arg) {
  const s = String(arg);
  if (!/[\s&()^|<>"]/.test(s)) return s;
  return `"${s.replace(/"/g, '\\"')}"`;
}

function timestampStamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

function searchRoots() {
  return [...new Set([CWD, HERE, path.join(CWD, 'manifests'), path.join(CWD, 'manifest'), path.join(HERE, 'manifests'), path.join(HERE, 'manifest')])];
}

function firstExisting(candidates) {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const resolved = path.isAbsolute(candidate) ? candidate : path.resolve(CWD, candidate);
    if (fs.existsSync(resolved)) return resolved;
    for (const root of searchRoots()) {
      const nested = path.resolve(root, candidate);
      if (fs.existsSync(nested)) return nested;
    }
  }
  return '';
}

function resolveEnvPath(...keys) {
  for (const key of keys) {
    if (process.env[key]) {
      const found = firstExisting([process.env[key]]);
      if (found) return found;
    }
  }
  return '';
}

function stripXmlComments(xml) {
  return String(xml).replace(/<!--[\s\S]*?-->/g, '');
}

export function findUnfilledPlaceholders(xml) {
  const live = stripXmlComments(xml);
  const members = [...live.matchAll(/<members>([^<]+)<\/members>/g)].map((m) => m[1].trim());
  const hits = new Set();
  for (const member of members) {
    const leaf = member.includes('/') ? member.split('/').pop() : member;
    const fieldLeaf = leaf.includes('.') ? leaf.split('.').pop() : leaf;
    if (KNOWN_PLACEHOLDERS.includes(member) || KNOWN_PLACEHOLDERS.includes(leaf) || KNOWN_PLACEHOLDERS.includes(fieldLeaf)) {
      hits.add(member);
      continue;
    }
    if (PLACEHOLDER_MEMBER_RE.test(member) || PLACEHOLDER_MEMBER_RE.test(leaf) || PLACEHOLDER_MEMBER_RE.test(fieldLeaf)) {
      hits.add(member);
    }
  }
  return [...hits];
}

function assertFilledManifest(filePath) {
  const xml = fs.readFileSync(filePath, 'utf8');
  const leftovers = findUnfilledPlaceholders(xml);
  if (leftovers.length) {
    throw new Error(
      `Refuse to deploy ${filePath}: unfilled ALL_CAPS placeholders: ${leftovers.join(', ')}. Replace them in the copied repo manifest first.`,
    );
  }
}

function listApexClasses(dir) {
  if (!dir || !fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.cls') && !name.endsWith('.cls-meta.xml'))
    .map((name) => name.replace(/\.cls$/, ''));
}

function isTestClassName(name) {
  return /(?:^|_)(?:Test|Tests)$|Test$/.test(name);
}

function coveragePercent(entry) {
  const locations = Number(entry?.numLocations ?? 0);
  const missed = Number(entry?.numLocationsNotCovered ?? 0);
  if (!locations) return 100;
  return ((locations - missed) / locations) * 100;
}

function isProductionOrg(org) {
  if (org?.isSandbox === true) return false;
  if (org?.sandboxName) return false;
  const url = String(org?.instanceUrl || '');
  if (/test\.salesforce\.com|\.sandbox\.|cs\d+\./i.test(url)) return false;
  return true;
}

function jobIdFrom(parsed) {
  return (
    parsed?.result?.id ||
    parsed?.result?.jobId ||
    parsed?.result?.deployId ||
    parsed?.id ||
    parsed?.jobId ||
    ''
  );
}

function deployStatus(parsed) {
  return String(parsed?.result?.status || parsed?.status || '');
}

function isTerminalStatus(status) {
  return /^(Succeeded|Failed|Canceled|Cancelled)$/i.test(status);
}

function isWaitTimeout(exitCode, parsed, text) {
  const blob = `${JSON.stringify(parsed || {})}\n${text}`;
  if (/timed out|timeout|exceeded the wait|wait limit/i.test(blob)) return true;
  const status = deployStatus(parsed);
  if (exitCode !== 0 && /InProgress|Pending|Canceling|Cancelling/i.test(status)) return true;
  return false;
}

function testsAreTerminal(parsed) {
  const result = parsed?.result || parsed || {};
  const rtr = result.details?.runTestResult;
  const status = String(result.status || '');
  if (result.numberTestsTotal != null && result.numberTestsCompleted != null) {
    return Number(result.numberTestsCompleted) >= Number(result.numberTestsTotal);
  }
  if (rtr?.outcome) return true;
  if (rtr && (rtr.successes || rtr.failures || rtr.numTestsRun != null)) {
    return isTerminalStatus(status) || result.done === true;
  }
  return isTerminalStatus(status) && result.done !== false;
}

function looksUnsupported(text) {
  return /unknown command|is not a .* command|not yet supported|unsupported|command .* not found|no such command/i.test(
    String(text || ''),
  );
}

function alreadyAssigned(text) {
  return /already assigned|duplicate value|DUPLICATE_VALUE|already has the permission set/i.test(
    String(text || ''),
  );
}

class Coordinator {
  constructor(options) {
    this.options = options;
    this.logDir = '';
    this.logPath = '';
    this.logStream = null;
    this.org = null;
    this.production = false;
    this.mutateConfirmed = false;
    this.platformKind = '';
  }

  log(line) {
    const stamped = `${new Date().toISOString()} ${line}`;
    process.stdout.write(`${stamped}\n`);
    if (this.logStream) this.logStream.write(`${stamped}\n`);
  }

  fail(message) {
    this.log(`ERROR ${message}`);
    throw new Error(message);
  }

  openLog() {
    const alias = this.options.targetOrg.replace(/[^\w.-]+/g, '_');
    this.logDir = path.join(os.homedir(), '.agf-deployment', alias, timestampStamp());
    fs.mkdirSync(this.logDir, { recursive: true });
    this.logPath = path.join(this.logDir, 'deploy.log');
    this.logStream = fs.createWriteStream(this.logPath, { flags: 'a' });
    this.log(`Log file ${this.logPath}`);
    this.log(`TEMPLATE coordinator. Not tested against the operator org.`);
    this.log(`Operators: ${this.options.operators.join(', ') || '(none)'}`);
    this.log(`Flags: ${JSON.stringify({
      validateOnly: this.options.validateOnly,
      deploy: this.options.deploy,
      targetOrg: this.options.targetOrg,
      startAt: this.options.startAt || '(start)',
      nonInteractive: this.options.nonInteractive,
    })}`);
    this.log(`API ${API_VERSION}; wait ${WAIT_MINUTES}`);
  }

  async promptExact(expected, why) {
    if (this.options.nonInteractive) {
      this.fail(`--non-interactive cannot satisfy the ${expected} checkpoint (${why}). Do not skip.`);
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((resolve) => {
      rl.question(`Type exactly ${expected} to continue (${why}): `, resolve);
    });
    rl.close();
    if (answer !== expected) {
      this.fail(`Expected exactly ${expected}. Got ${JSON.stringify(answer)}. Aborting.`);
    }
    this.log(`Checkpoint ${expected} accepted (${why}).`);
  }

  async confirmMutate() {
    if (this.mutateConfirmed) return;
    await this.promptExact('DEPLOY', 'mutate the target org');
    this.mutateConfirmed = true;
  }

  async runSf(args, { allowFail = false } = {}) {
    const full = [...args];
    if (!full.includes('--json')) full.push('--json');
    if (!full.includes('--target-org') && this.options.targetOrg) {
      full.push('--target-org', this.options.targetOrg);
    }
    if (this.production && full.includes('--ignore-errors')) {
      this.fail('Never --ignore-errors on production.');
    }
    this.log(`$ sf ${full.join(' ')}`);
    const result = await spawnSf(full);
    const parsed = parseJsonFromFirstBrace(`${result.stdout}\n${result.stderr}`);
    const safeParsed = parsed ? stripSecrets(parsed) : null;
    const safeOut = redactText(result.stdout);
    const safeErr = redactText(result.stderr);
    if (safeOut.trim()) this.log(safeOut.trim());
    if (safeErr.trim()) this.log(safeErr.trim());
    if (safeParsed) this.log(`json ${JSON.stringify(safeParsed)}`);
    result.parsed = parsed;
    result.safeParsed = safeParsed;
    result.text = `${result.stdout}\n${result.stderr}`;
    if (!allowFail && result.exitCode !== 0 && !isWaitTimeout(result.exitCode, parsed, result.text)) {
      this.fail(`sf exited ${result.exitCode}: ${summarizeSfError(parsed, result.text)}`);
    }
    return result;
  }

  printTimeoutHelp(parsed) {
    const id = jobIdFrom(parsed);
    this.log('Wait timeout is not a deploy failure.');
    if (id) {
      this.log(`Job id: ${id}`);
      this.log(`Resume: sf project deploy resume --json --job-id ${id} --target-org ${this.options.targetOrg} --wait ${WAIT_MINUTES}`);
      this.log(`Report: sf project deploy report --json --job-id ${id} --target-org ${this.options.targetOrg} --wait ${WAIT_MINUTES}`);
    } else {
      this.log('No job id in the CLI output. Check the log and Deployment Status in the target org.');
    }
    return id;
  }

  async waitForTerminalJob(jobId, { needTests = false } = {}) {
    if (!jobId) this.fail('Cannot poll a deploy without a job id.');
    for (let i = 0; i < POLL_CAP; i += 1) {
      const report = await this.runSf(
        [
          'project',
          'deploy',
          'report',
          '--job-id',
          jobId,
          '--wait',
          WAIT_MINUTES,
          '--api-version',
          API_VERSION,
        ],
        { allowFail: true },
      );
      if (isWaitTimeout(report.exitCode, report.parsed, report.text)) {
        this.printTimeoutHelp(report.parsed);
        await sleep(POLL_MS);
        continue;
      }
      const status = deployStatus(report.parsed);
      if (isTerminalStatus(status)) {
        if (needTests && !testsAreTerminal(report.parsed)) {
          this.log('Deploy is green or failed, but the Apex test summary is not terminal yet. Polling before coverage.');
          await sleep(POLL_MS);
          continue;
        }
        if (report.exitCode !== 0 && /Failed|Canceled|Cancelled/i.test(status)) {
          this.fail(`Deploy job ${jobId} ended ${status}`);
        }
        return report;
      }
      this.log(`Job ${jobId} still ${status || 'unknown'}. Polling.`);
      await sleep(POLL_MS);
    }
    this.fail(`Gave up polling job ${jobId}. Use resume/report with that id.`);
  }

  async deployPackage({ label, manifest, sourceDir, testLevel, tests = [], requireCoverage = false }) {
    if (manifest) assertFilledManifest(manifest);
    const scope = manifest
      ? ['--manifest', manifest]
      : ['--source-dir', sourceDir];
    const testArgs = ['--test-level', testLevel];
    if (testLevel === 'RunSpecifiedTests') {
      if (!tests.length) this.fail(`${label}: RunSpecifiedTests requires at least one test class.`);
      for (const name of tests) testArgs.push('--tests', name);
    }

    const common = [...scope, '--wait', WAIT_MINUTES, '--api-version', API_VERSION, ...testArgs];

    if (this.production) {
      const validate = await this.runSf(
        ['project', 'deploy', 'validate', ...common],
        { allowFail: true },
      );
      let parsed = validate.parsed;
      if (isWaitTimeout(validate.exitCode, parsed, validate.text)) {
        const id = this.printTimeoutHelp(parsed);
        const resumed = await this.waitForTerminalJob(id, { needTests: requireCoverage });
        parsed = resumed.parsed;
      } else if (validate.exitCode !== 0) {
        this.fail(`${label} validate failed: ${summarizeSfError(parsed, validate.text)}`);
      }
      if (!this.options.deploy) {
        this.log(`${label}: validate-only complete. Not saving to the org.`);
        return parsed;
      }
      await this.confirmMutate();
      const id = jobIdFrom(parsed);
      if (!id) this.fail(`${label}: validate succeeded but no job id was returned for quick deploy.`);
      const quick = await this.runSf(
        ['project', 'deploy', 'quick', '--job-id', id, '--wait', WAIT_MINUTES, '--api-version', API_VERSION],
        { allowFail: true },
      );
      if (isWaitTimeout(quick.exitCode, quick.parsed, quick.text)) {
        return (await this.waitForTerminalJob(this.printTimeoutHelp(quick.parsed) || id, { needTests: requireCoverage })).parsed;
      }
      if (quick.exitCode !== 0) this.fail(`${label} quick deploy failed: ${summarizeSfError(quick.parsed, quick.text)}`);
      if (requireCoverage) {
        return (await this.waitForTerminalJob(jobIdFrom(quick.parsed) || id, { needTests: true })).parsed;
      }
      return quick.parsed;
    }

    const dry = await this.runSf(
      ['project', 'deploy', 'start', '--dry-run', ...common],
      { allowFail: true },
    );
    if (isWaitTimeout(dry.exitCode, dry.parsed, dry.text)) {
      await this.waitForTerminalJob(this.printTimeoutHelp(dry.parsed), { needTests: requireCoverage });
    } else if (dry.exitCode !== 0) {
      this.fail(`${label} dry-run failed: ${summarizeSfError(dry.parsed, dry.text)}`);
    }
    if (!this.options.deploy) {
      this.log(`${label}: sandbox dry-run complete. Not saving to the org.`);
      return dry.parsed;
    }
    await this.confirmMutate();
    const start = await this.runSf(
      ['project', 'deploy', 'start', ...common],
      { allowFail: true },
    );
    if (isWaitTimeout(start.exitCode, start.parsed, start.text)) {
      return (await this.waitForTerminalJob(this.printTimeoutHelp(start.parsed), { needTests: requireCoverage })).parsed;
    }
    if (start.exitCode !== 0) this.fail(`${label} deploy failed: ${summarizeSfError(start.parsed, start.text)}`);
    if (requireCoverage) {
      const id = jobIdFrom(start.parsed);
      if (id) return (await this.waitForTerminalJob(id, { needTests: true })).parsed;
    }
    return start.parsed;
  }

  assertCoverage(parsed, classNames) {
    if (!testsAreTerminal(parsed)) {
      this.fail('Do not read coverage until the Apex test run is terminal.');
    }
    const coverages = parsed?.result?.details?.runTestResult?.codeCoverage || [];
    const byName = new Map(coverages.map((row) => [row.name || row.fullName, row]));
    const missing = [];
    const low = [];
    for (const name of classNames) {
      if (isTestClassName(name)) continue;
      const row = byName.get(name);
      if (!row) {
        missing.push(name);
        continue;
      }
      const pct = coveragePercent(row);
      this.log(`Coverage ${name}: ${pct.toFixed(1)}%`);
      if (pct < COVERAGE_FLOOR) low.push(`${name} ${pct.toFixed(1)}%`);
    }
    if (missing.length) {
      this.fail(`Coverage missing after a green deploy for: ${missing.join(', ')}. Do not read coverage until the Apex test run is terminal.`);
    }
    if (low.length) {
      this.fail(`RunSpecifiedTests requires ${COVERAGE_FLOOR}% per deployed class. Below floor: ${low.join(', ')}`);
    }
  }

  shouldRun(phase) {
    if (!this.options.startAt) return true;
    const start = PHASES.indexOf(this.options.startAt);
    const here = PHASES.indexOf(phase);
    return here >= start;
  }

  async maybePhase(name, fn) {
    if (!this.shouldRun(name)) {
      this.log(`Skipping ${name}: --start-at ${this.options.startAt} (do not replay succeeded phases).`);
      return;
    }
    this.log(`=== phase ${name} ===`);
    await fn();
    this.log(`=== done ${name} ===`);
  }

  resolveData360Kit() {
    return (
      resolveEnvPath('DATA360_KIT_MANIFEST', 'DATA360_PACKAGE') ||
      firstExisting([
        'data-360-data-kit-package.xml',
        path.join('manifests', 'data-360-data-kit-package.xml'),
        path.join('manifest', 'data-360-data-kit-package.xml'),
      ])
    );
  }

  resolvePlatformPackage() {
    const fromEnv = resolveEnvPath('PLATFORM_PACKAGE');
    if (fromEnv) {
      this.platformKind = classifyPlatform(fromEnv);
      return fromEnv;
    }
    for (const name of PLATFORM_MANIFEST_NAMES) {
      const found = firstExisting([name, path.join('manifests', name), path.join('manifest', name)]);
      if (found) {
        this.platformKind = classifyPlatform(found);
        return found;
      }
    }
    return '';
  }

  resolvePrompts() {
    return (
      resolveEnvPath('PROMPTS_MANIFEST', 'PROMPTS_PACKAGE') ||
      firstExisting([
        'prompts-package.xml',
        path.join('manifests', 'prompts-package.xml'),
        path.join('manifest', 'prompts-package.xml'),
      ])
    );
  }

  resolveApex() {
    const manifest =
      resolveEnvPath('APEX_MANIFEST', 'APEX_PACKAGE') ||
      firstExisting(['apex-package.xml', path.join('manifests', 'apex-package.xml'), path.join('manifest', 'apex-package.xml')]);
    const sourceDir =
      resolveEnvPath('APEX_SOURCE_DIR') ||
      firstExisting([
        path.join('force-app', 'main', 'default', 'classes'),
        path.join('force-app', 'main', 'default', 'triggers'),
      ]);
    return { manifest, sourceDir };
  }

  resolveEmployeeAccess() {
    return (
      resolveEnvPath('EMPLOYEE_ACCESS_MANIFEST') ||
      firstExisting([
        'employee-agent-access-package.xml',
        path.join('manifests', 'employee-agent-access-package.xml'),
        path.join('manifest', 'employee-agent-access-package.xml'),
      ])
    );
  }

  agentforceTestLevel() {
    return process.env.TEST_LEVEL || 'RunLocalTests';
  }

  async phasePreflight() {
    this.openLog();
    const display = await this.runSf(['org', 'display']);
    this.org = stripSecrets(display.parsed?.result || {});
    this.production = isProductionOrg(display.parsed?.result || {});
    this.log(`Org username: ${this.org.username || '(missing)'}`);
    this.log(`Org id: ${this.org.id || '(missing)'}`);
    this.log(`Instance: ${this.org.instanceUrl || '(missing)'}`);
    this.log(`Production: ${this.production}`);
    if (!this.org.username || !this.org.id || !this.org.instanceUrl) {
      this.fail('sf org display did not return username, org id, and instance URL.');
    }
    if (this.production) {
      this.log('Production path: validate then quick --job-id. Never --ignore-errors.');
    } else {
      this.log('Sandbox path: start --dry-run then start. Do not pass a dry-run job to quick.');
    }
  }

  async phaseData360Kit() {
    const manifest = this.resolveData360Kit();
    if (!manifest) {
      this.log('No Data 360 kit manifest. Skipping.');
      return;
    }
    this.log(`Data 360 kit manifest: ${manifest}`);
    await this.deployPackage({
      label: 'data360-kit',
      manifest,
      testLevel: this.agentforceTestLevel(),
    });
  }

  async phaseData360Ui() {
    if (!this.options.deploy) {
      this.log('validate-only: skipping data360-ui DONE checkpoint.');
      return;
    }
    if (!this.resolveData360Kit() && !process.env.REQUIRE_DATA360_UI) {
      this.log('No Data 360 kit path. Skipping data360-ui.');
      return;
    }
    await this.promptExact(
      'DONE',
      'Data Kit component deploy, connector reauth, and data refresh in the target org',
    );
  }

  async phasePlatformDeps() {
    const manifest = this.resolvePlatformPackage();
    if (!manifest) {
      this.log('No service/employee/lead platform manifest. Skipping platform-deps.');
      return;
    }
    this.log(`Platform package (${this.platformKind || 'unknown'}): ${manifest}`);
    await this.deployPackage({
      label: 'platform-deps',
      manifest,
      testLevel: this.agentforceTestLevel(),
    });
  }

  async phasePrompts() {
    const manifest = this.resolvePrompts();
    if (!manifest) {
      this.log('No prompts manifest. Skipping.');
      return;
    }
    this.log(`Prompts manifest: ${manifest}`);
    await this.deployPackage({
      label: 'prompts',
      manifest,
      testLevel: this.agentforceTestLevel(),
    });
  }

  async phasePromptsActivate() {
    if (!this.options.deploy) {
      this.log('validate-only: skipping prompts-activate DONE checkpoint.');
      return;
    }
    if (!this.resolvePrompts() && !process.env.REQUIRE_PROMPTS_ACTIVATE) {
      this.log('No prompts package. Skipping prompts-activate.');
      return;
    }
    await this.promptExact('DONE', 'Prompt Builder templates are published/active before Apex');
  }

  async phaseApex() {
    const { manifest, sourceDir } = this.resolveApex();
    const classDir = sourceDir && sourceDir.endsWith('triggers')
      ? path.join(path.dirname(sourceDir), 'classes')
      : sourceDir;
    const classes = listApexClasses(classDir);
    if (!manifest && !classes.length) {
      this.log('No optional Apex package or classes. Skipping apex.');
      return;
    }
    const extraTests = (process.env.APEX_TESTS || '')
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    const tests = [...new Set([...classes.filter(isTestClassName), ...extraTests])];
    const units = classes.filter((name) => !isTestClassName(name));
    if (!manifest && !units.length && !tests.length) {
      this.log('Apex folder exists but has no classes. Skipping.');
      return;
    }
    this.log(`Optional Apex. Classes: ${units.join(', ') || '(none)'}. Tests: ${tests.join(', ') || '(none)'}.`);
    const parsed = await this.deployPackage({
      label: 'apex',
      manifest: manifest || undefined,
      sourceDir: manifest ? undefined : classDir,
      testLevel: 'RunSpecifiedTests',
      tests,
      requireCoverage: true,
    });
    if (this.options.deploy) this.assertCoverage(parsed, units);
  }

  async phaseAgentPreview() {
    if (!this.options.deploy) {
      this.log('validate-only: skipping agent-preview.');
      return;
    }
    const apiName = process.env.AGENT_API_NAME;
    if (!apiName) {
      this.log('AGENT_API_NAME is not set. Skipping agent-preview.');
      return;
    }
    const start = await this.runSf(
      ['agent', 'preview', 'start', '--authoring-bundle', apiName, '--use-live-actions'],
      { allowFail: true },
    );
    if (start.exitCode !== 0) {
      if (looksUnsupported(start.text) || /INVALID_TYPE|AgentApiNotFound/i.test(start.text)) {
        this.log('agent-preview is optional and looks unsupported here. Not failing the coordinator.');
        return;
      }
      this.fail(`agent preview start failed: ${summarizeSfError(start.parsed, start.text)}`);
    }
    const sessionId = start.parsed?.result?.sessionId || start.parsed?.result?.id;
    if (!sessionId) {
      this.log('Preview started but no session id was returned. Operator should finish preview in the org.');
      return;
    }
    const utterance = process.env.PREVIEW_UTTERANCE || 'Test the main happy path';
    const sent = await this.runSf(
      ['agent', 'preview', 'send', '--authoring-bundle', apiName, '--session-id', sessionId, '--utterance', utterance],
      { allowFail: true },
    );
    if (sent.exitCode !== 0 && looksUnsupported(sent.text)) {
      this.log('agent preview send is unsupported. Not failing.');
    } else if (sent.exitCode !== 0) {
      this.fail(`agent preview send failed: ${summarizeSfError(sent.parsed, sent.text)}`);
    }
    await this.runSf(
      ['agent', 'preview', 'end', '--authoring-bundle', apiName, '--session-id', sessionId],
      { allowFail: true },
    );
  }

  async phaseAgentPublish() {
    if (!this.options.deploy) {
      this.log('validate-only: skipping agent-publish.');
      return;
    }
    if (this.platformKind === 'lead') {
      this.log('Lead Nurture dependencies path: do not publish the packaged agent. Configure it in Builder.');
      return;
    }
    const apiName = process.env.AGENT_API_NAME;
    if (!apiName) {
      this.log('AGENT_API_NAME is required for sf agent publish authoring-bundle --skip-retrieve. Skipping.');
      return;
    }
    await this.confirmMutate();
    await this.runSf([
      'agent',
      'publish',
      'authoring-bundle',
      '--api-name',
      apiName,
      '--skip-retrieve',
    ]);
    await this.runSf(['agent', 'activate', '--api-name', apiName]);
  }

  async phaseEmployeeAccess() {
    const manifest = this.resolveEmployeeAccess();
    if (!manifest) {
      this.log('No employee access manifest. Skipping.');
      return;
    }
    if (this.platformKind === 'service') {
      this.log('Service Agent path: employee access package is not required. Skipping.');
      return;
    }
    this.log(`Employee access manifest: ${manifest}`);
    await this.deployPackage({
      label: 'employee-access',
      manifest,
      testLevel: this.agentforceTestLevel(),
    });
  }

  async phasePermsetAssign() {
    if (!this.options.deploy) {
      this.log('validate-only: skipping permset-assign.');
      return;
    }
    const permset = process.env.PERMSET_NAME;
    const operators = this.options.operators;
    if (!permset || !operators.length) {
      this.log('PERMSET_NAME or --operator missing. Skipping permset-assign.');
      return;
    }
    await this.confirmMutate();
    for (const username of operators) {
      const result = await this.runSf(
        ['org', 'assign', 'permset', '--name', permset, '--on-behalf-of', username],
        { allowFail: true },
      );
      if (result.exitCode === 0 || alreadyAssigned(result.text)) {
        this.log(`Permset ${permset} assigned (or already assigned) to an --operator username.`);
        continue;
      }
      this.fail(`permset assign failed: ${summarizeSfError(result.parsed, result.text)}`);
    }
  }

  async phaseWebChat() {
    if (!this.options.deploy) {
      this.log('validate-only: skipping web-chat DONE checkpoint.');
      return;
    }
    if (process.env.SKIP_WEB_CHAT === '1') {
      this.log('SKIP_WEB_CHAT=1. Skipping web-chat.');
      return;
    }
    await this.promptExact('DONE', 'Enhanced Web Chat rebuilt and published in the target org');
  }

  async run() {
    if (this.options.startAt && !PHASES.includes(this.options.startAt)) {
      this.fail(`Unknown --start-at ${this.options.startAt}. Use one of: ${PHASES.join(', ')}`);
    }
    await this.maybePhase('preflight', () => this.phasePreflight());
    if (!this.org) {
      this.log('--start-at skipped preflight. Confirming the org so later phases still know production vs sandbox.');
      await this.phasePreflight();
    }
    await this.maybePhase('data360-kit', () => this.phaseData360Kit());
    await this.maybePhase('data360-ui', () => this.phaseData360Ui());
    await this.maybePhase('platform-deps', () => this.phasePlatformDeps());
    await this.maybePhase('prompts', () => this.phasePrompts());
    await this.maybePhase('prompts-activate', () => this.phasePromptsActivate());
    await this.maybePhase('apex', () => this.phaseApex());
    await this.maybePhase('agent-preview', () => this.phaseAgentPreview());
    await this.maybePhase('agent-publish', () => this.phaseAgentPublish());
    await this.maybePhase('employee-access', () => this.phaseEmployeeAccess());
    await this.maybePhase('permset-assign', () => this.phasePermsetAssign());
    await this.maybePhase('web-chat', () => this.phaseWebChat());
    this.log('Coordinator finished.');
  }
}

function classifyPlatform(filePath) {
  const base = path.basename(filePath);
  if (base.includes('lead')) return 'lead';
  if (base.includes('employee')) return 'employee';
  if (base.includes('service')) return 'service';
  return '';
}

function summarizeSfError(parsed, text) {
  const message = parsed?.message || parsed?.result?.message || parsed?.result?.errorMessage;
  if (message) return String(message);
  const trimmed = String(text || '').trim();
  return trimmed ? trimmed.slice(0, 800) : 'no CLI message';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function spawnSf(args) {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === 'win32';
    const child = isWin
      ? spawn(['sf', ...args].map(quoteWin).join(' '), {
          shell: true,
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        })
      : spawn('sf', args, {
          stdio: ['ignore', 'pipe', 'pipe'],
        });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (exitCode) => {
      resolve({ exitCode: exitCode ?? 1, stdout, stderr });
    });
  });
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(USAGE);
    return 0;
  }
  if (options.validateOnly && options.deploy) {
    throw new Error(`Choose --validate-only or --deploy, not both.\n\n${USAGE}`);
  }
  if (!options.validateOnly && !options.deploy) {
    throw new Error(`Choose --validate-only or --deploy.\n\n${USAGE}`);
  }
  if (!options.targetOrg) {
    throw new Error(`--target-org is required.\n\n${USAGE}`);
  }
  if (/\s/.test(options.targetOrg)) {
    throw new Error(`--target-org must not contain whitespace.\n\n${USAGE}`);
  }
  if (options.startAt && !PHASES.includes(options.startAt)) {
    throw new Error(`Unknown --start-at ${options.startAt}. Use one of: ${PHASES.join(', ')}`);
  }
  const coordinator = new Coordinator(options);
  try {
    await coordinator.run();
    return 0;
  } finally {
    if (coordinator.logStream) coordinator.logStream.end();
  }
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().then(
    (code) => {
      process.exit(code);
    },
    (error) => {
      process.stderr.write(`${error.message || error}\n`);
      process.exit(1);
    },
  );
}
