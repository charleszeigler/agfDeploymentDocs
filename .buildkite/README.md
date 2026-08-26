# Buildkite CI

`pipeline.yml` mirrors the three checks that `.github/workflows/ci.yml` runs today:

1. `node --check templates/deploy.mjs`
2. `node --test tests/deploy.test.mjs`
3. `node scripts/ci-check.mjs`

Each step runs inside a `node:20` container via the Docker plugin, so the only
agent requirement is Docker.

## Run it fully in the cloud (nothing on your machine)

Buildkite runs builds on **agents**. To avoid running an agent on your own
machine or a VM you manage, use **Buildkite Hosted Agents** — Buildkite-managed
cloud compute.

1. **Create or choose a Buildkite organization** at https://buildkite.com.
2. **Enable Hosted Agents** (Organization Settings → Clusters → add a Hosted
   queue). Pick a **Linux** instance; Hosted Linux agents include Docker, which
   this pipeline needs. Hosted Agents are billed compute — check current pricing.
3. **Create a pipeline**:
   - New Pipeline → connect the GitHub repo `charleszeigler/agfDeploymentDocs`.
   - Point the pipeline's cluster/queue at the Hosted queue from step 2.
   - Keep the default steps (a "pipeline upload" step) so Buildkite reads
     `.buildkite/pipeline.yml` from the repo on each build.
4. **Install the Buildkite GitHub App** on the repo (Buildkite prompts for this
   while connecting) so pushes and pull requests trigger builds and report
   status back to GitHub.
5. **Trigger a build** (push a commit, or click *New Build*) and confirm all
   three steps pass.

## After Buildkite is green

- Optional status badge in the top-level `README.md`:
  `[![Build status](https://badge.buildkite.com/<token>.svg)](https://buildkite.com/<org>/agf-deployment-docs)`
- If you want a required check on `main`: GitHub → Settings → Branches → add a
  rule requiring the Buildkite status.
- **Retire GitHub Actions**: delete `.github/workflows/ci.yml`. Keeping it until
  Buildkite is verified green means `main` never loses CI coverage.

## Agents that already have Node

If you run agents with Node 20+ preinstalled, simplify `pipeline.yml` by
removing each `plugins:` block and keeping only the `command:` lines.

## Notes

- Pin the Docker plugin to a current release. `docker#v5.11.0` is used here;
  bump it to the latest `docker-buildkite-plugin` tag if needed.
- The three steps have no dependencies, so Buildkite runs them in parallel.
