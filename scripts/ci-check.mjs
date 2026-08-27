#!/usr/bin/env node
/**
 * Repo integrity checks for docs, nav, manifests, and coordinator phase names.
 * Node built-ins only. Does not call Salesforce or fetch external URLs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function walkFiles(dir, suffix, out = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(rel, suffix, out);
    else if (entry.name.endsWith(suffix)) out.push(rel);
  }
  return out;
}

function stripFencedCode(md) {
  return md.replace(/```[\s\S]*?```/g, '');
}

function githubSlug(heading) {
  return heading
    .replace(/`+/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]+/gu, '')
    .replace(/\s+/g, '-');
}

function headingSlugs(md) {
  const slugs = new Map();
  for (const line of stripFencedCode(md).split(/\r?\n/)) {
    const match = line.match(/^#{1,6}\s+(.+)$/);
    if (!match) continue;
    const base = githubSlug(match[1]);
    const count = slugs.get(base) || 0;
    slugs.set(count ? `${base}-${count}` : base, true);
    slugs.set(base, count + 1);
  }
  return slugs;
}

function collectNavSlugs(node, out = []) {
  if (typeof node === 'string') {
    out.push(node);
    return out;
  }
  if (Array.isArray(node)) {
    for (const child of node) collectNavSlugs(child, out);
    return out;
  }
  if (node && typeof node === 'object') {
    if (typeof node.slug === 'string' && node.slug) out.push(node.slug);
    if (node.pages) collectNavSlugs(node.pages, out);
  }
  return out;
}

function mdLinks(md) {
  return [...md.matchAll(/\[(?:[^\]]|\\.)+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map((m) => m[1]);
}

function checkRelativeLink(fromFile, href) {
  if (/^(https?:|mailto:|#)/i.test(href)) return;
  const [rawPath, hash] = href.split('#');
  const targetPath = rawPath
    ? path.normalize(path.join(path.dirname(fromFile), decodeURIComponent(rawPath)))
    : fromFile;
  if (!exists(targetPath)) {
    fail(`${fromFile}: broken link ${href}`);
    return;
  }
  if (!hash || !targetPath.endsWith('.md')) return;
  const slugs = headingSlugs(read(targetPath));
  if (!slugs.has(hash.toLowerCase())) {
    fail(`${fromFile}: missing heading #${hash} in ${targetPath}`);
  }
}

function assertWellFormedXml(xml, file) {
  const live = xml.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?xml[\s\S]*?\?>/g, '');
  const stack = [];
  const re = /<(\/)?([A-Za-z_][\w:.-]*)([^>]*?)(\/)?>/g;
  let match;
  while ((match = re.exec(live))) {
    const [, close, name, , self] = match;
    if (self) continue;
    if (close) {
      const expected = stack.pop();
      if (expected !== name) {
        fail(`${file}: XML tag mismatch, got </${name}> expected </${expected || '?'}>`);
        return;
      }
    } else {
      stack.push(name);
    }
  }
  if (stack.length) fail(`${file}: unclosed XML tags: ${stack.join(', ')}`);
}

const mdFiles = [
  'README.md',
  ...walkFiles('docs', '.md'),
  ...walkFiles('ci', '.md'),
  ...(exists('.buildkite') ? walkFiles('.buildkite', '.md') : []),
];
for (const file of mdFiles) {
  const md = read(file);
  for (const href of mdLinks(md)) {
    if (/^https?:/i.test(href)) continue;
    checkRelativeLink(file, href);
  }
  for (const block of md.matchAll(/```[\s\S]*?```/g)) {
    if (/--test-level\s+NoTestRun/.test(block[0])) {
      fail(`${file}: fenced code uses --test-level NoTestRun; dress rehearsal and production use RunLocalTests`);
    }
  }
}

const meta = JSON.parse(read('docs/meta.json'));
const navSlugs = collectNavSlugs(meta.pages);
for (const slug of navSlugs) {
  if (!exists(path.join('docs', `${slug}.md`))) {
    fail(`docs/meta.json: no docs/${slug}.md for nav slug "${slug}"`);
  }
}

const docNames = walkFiles('docs', '.md').map((file) => path.basename(file, '.md'));
for (const name of docNames) {
  if (name === 'meta') continue;
  if (!navSlugs.includes(name)) {
    fail(`docs/${name}.md is not listed in docs/meta.json`);
  }
}

const manifestFiles = walkFiles('manifests', '.xml');
if (!manifestFiles.length) fail('no manifests/*.xml files');
for (const file of manifestFiles) {
  const xml = read(file);
  if (!/<Package[\s>]/.test(xml) || !/<\/Package>/.test(xml)) {
    fail(`${file}: missing Package wrapper`);
  }
  assertWellFormedXml(xml, file);
}

const readme = read('README.md');
for (const file of manifestFiles) {
  if (!readme.includes(file)) fail(`README.md does not mention ${file}`);
}

const template = read('templates/deploy.mjs');
const phaseBlock = template.match(/const PHASES = \[([\s\S]*?)\];/);
if (!phaseBlock) {
  fail('templates/deploy.mjs: could not read PHASES');
} else {
  const phases = [...phaseBlock[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const guide = read('docs/30-deployment-script.md');
  for (const phase of phases) {
    if (!guide.includes(`\`${phase}\``)) {
      fail(`docs/30-deployment-script.md is missing coordinator phase \`${phase}\``);
    }
  }
}

if (!exists('templates/deploy.mjs')) fail('templates/deploy.mjs is missing');

const orgFiles = [
  'ci/sf/org-ci.sh',
  'ci/sf/check-coverage.mjs',
  'ci/sf/sfdx-project.json',
  'ci/sf/config/project-scratch-def.json',
  'ci/sf/force-app/main/default/classes/CiSmoke.cls',
  'ci/sf/force-app/main/default/classes/CiSmokeTest.cls',
  'ci/playwright/package.json',
  'ci/playwright/package-lock.json',
  'ci/playwright/playwright.config.ts',
  'ci/playwright/tests/lightning-home.spec.ts',
  'ci/README.md',
];
for (const file of orgFiles) {
  if (!exists(file)) fail(`${file} is missing`);
}
const orgScript = read('ci/sf/org-ci.sh');
if (/--test-level\s+NoTestRun/.test(orgScript)) {
  fail('ci/sf/org-ci.sh uses --test-level NoTestRun; scratch CI uses RunLocalTests');
}
if (!orgScript.includes('--dry-run')) fail('ci/sf/org-ci.sh must dry-run deploy before saving');
if (!/RunLocalTests/.test(orgScript)) fail('ci/sf/org-ci.sh must use RunLocalTests');
if (!read('dagger/src/index.ts').includes('orgCi')) {
  fail('dagger/src/index.ts is missing orgCi');
}
if (!read('ci/README.md').includes("What's left (owner, not repo code)")) {
  fail('ci/README.md must document leftover owner work (Dev Hub / secret / host)');
}
if (!read('README.md').includes('ci/README.md#whats-left-owner-not-repo-code')) {
  fail('README.md Checks must link leftover owner work in ci/README.md');
}
if (!read('ci/playwright/tests/lightning-home.spec.ts').includes('frontdoor.jsp')) {
  fail('Playwright smoke must use Salesforce frontdoor login');
}

if (exists('.github/workflows/ci.yml')) {
  fail('.github/workflows/ci.yml is retired; CI is Dagger');
}
if (!exists('dagger.json')) fail('dagger.json is missing');
if (!exists('dagger/src/index.ts')) fail('dagger/src/index.ts is missing');
if (!exists('cloudbuild.yaml')) fail('cloudbuild.yaml is missing');
if (!exists('ci/README.md')) fail('ci/README.md is missing');

const dagger = JSON.parse(read('dagger.json'));
const engineVersion = String(dagger.engineVersion || '');
if (!/^v\d+\.\d+\.\d+$/.test(engineVersion)) {
  fail(`dagger.json engineVersion must look like v0.21.9 (got ${JSON.stringify(dagger.engineVersion)})`);
}
const expectedCli = engineVersion.replace(/^v/, '');
const cloudbuild = read('cloudbuild.yaml');
if (!cloudbuild.includes(`DAGGER_VERSION=${expectedCli}`)) {
  fail(`cloudbuild.yaml must pin DAGGER_VERSION=${expectedCli} to match dagger.json ${engineVersion}`);
}
if (!/dagger call ci\b/.test(cloudbuild)) {
  fail('cloudbuild.yaml must run dagger call ci');
}
if (!/dagger call org-ci\b/.test(cloudbuild)) {
  fail('cloudbuild.yaml must run dagger call org-ci when SF_DEVHUB_AUTH_URL is set');
}
if (!/--source\s+\./.test(cloudbuild)) {
  fail('cloudbuild.yaml must pass --source . so Cloud Build does not depend on git defaultPath');
}

if (exists('.buildkite/pipeline.yml')) {
  const pipeline = read('.buildkite/pipeline.yml');
  const live = pipeline.replace(/#[^\n]*/g, '');
  const usesDagger = /dagger call ci\b/.test(live);
  const usesNodeChecks =
    pipeline.includes('node --check templates/deploy.mjs') &&
    pipeline.includes('node --test tests/deploy.test.mjs') &&
    pipeline.includes('node scripts/ci-check.mjs');
  if (!usesDagger && !usesNodeChecks) {
    fail('.buildkite/pipeline.yml must run dagger call ci or the three Node checks');
  }
  if (!live.includes('ci/sf/org-ci.sh') && !/dagger call org-ci\b/.test(live)) {
    fail('.buildkite/pipeline.yml must run scratch-org CI (ci/sf/org-ci.sh or dagger call org-ci)');
  }
  if (usesDagger) {
    if (!pipeline.includes(`DAGGER_VERSION=${expectedCli}`)) {
      fail(`.buildkite/pipeline.yml must pin DAGGER_VERSION=${expectedCli} to match dagger.json ${engineVersion}`);
    }
    if (!/--source\s+\./.test(pipeline)) {
      fail('.buildkite/pipeline.yml must pass --source . when it runs Dagger');
    }
  }
}

if (errors.length) {
  process.stderr.write(errors.map((line) => `ERROR ${line}`).join('\n') + '\n');
  process.exit(1);
}

process.stdout.write(
  `OK ${mdFiles.length} markdown files, ${navSlugs.length} nav slugs, ${manifestFiles.length} manifests\n`,
);
