# Dagger CI

Pipeline logic is a [Dagger](https://dagger.io) TypeScript module.

This repo is Agentforce **deployment guides**, not a customer ALM app. Static CI never calls an org. Org CI is a scratch-org **fixture** (`ci/sf`) so Salesforce CLI, Apex tests, and Playwright stay honest. Scratch orgs do not provision Agentforce, Einstein, Prompt Builder, or Data 360. Dress rehearsal for those packages is still a fresh Developer sandbox (`RunLocalTests`), as the guides say.

## Static checks

1. `node --check templates/deploy.mjs`
2. `node --test tests/deploy.test.mjs tests/check-coverage.test.mjs`
3. `node scripts/ci-check.mjs`

```bash
dagger call ci --source .
```

## Local

Needs the [Dagger CLI](https://docs.dagger.io/install) **v0.21.9** and a container runtime (Docker, Podman, or similar).

```bash
curl -fsSL https://dl.dagger.io/dagger/install.sh | DAGGER_VERSION=0.21.9 BIN_DIR=/usr/local/bin sh
dagger call ci --source .
```

Single static check:

```bash
dagger call syntax --source .
dagger call unit --source .
dagger call docs --source .
```

Without Dagger, Node 20+ is enough for the static path:

```bash
node --check templates/deploy.mjs
node --test tests/deploy.test.mjs tests/check-coverage.test.mjs
node scripts/ci-check.mjs
```

## Scratch-org CI

Requires a Dev Hub that can create scratch orgs. Auth is an sfdx auth URL (do not commit it):

```bash
sf org display --target-org <devhub> --verbose --json
# use result.sfdxAuthUrl
export SF_DEVHUB_AUTH_URL='force://...'
dagger call org-ci --source . --devhub-auth-url env://SF_DEVHUB_AUTH_URL
```

Or without Dagger, with `sf` and Playwright browsers installed:

```bash
bash ci/sf/org-ci.sh
```

That script:

1. logs in to the Dev Hub
2. creates a 1-day Developer scratch org
3. `sf project deploy start --dry-run --test-level RunLocalTests`
4. `sf project deploy start --test-level RunLocalTests`
5. `sf apex run test --code-coverage` and fails under 75%
6. Playwright Chromium opens Lightning through `/secur/frontdoor.jsp`
7. deletes the scratch org (unless `SF_SKIP_ORG_DELETE=1`)

Set `SF_DEVHUB_AUTH_URL` as a **secured** env var on Buildkite, or as a Cloud Build / Secret Manager secret named the same. If it is unset, hosts skip org CI and the static check still runs.

## Live GitHub host: Buildkite

[`.buildkite/pipeline.yml`](../.buildkite/pipeline.yml) is already wired (hosted `linux-small`, GitHub webhook). Static steps run in `node:20`. The Salesforce step runs `ci/sf/org-ci.sh` when `SF_DEVHUB_AUTH_URL` is set. See [`.buildkite/README.md`](../.buildkite/README.md).

## GCP host: Google Cloud Build

`cloudbuild.yaml` installs Dagger 0.21.9, runs `dagger call ci`, then `dagger call org-ci` when `SF_DEVHUB_AUTH_URL` is present. Pin the CLI version to `engineVersion` in [`dagger.json`](../dagger.json). To enable org CI, add that env var (or a Secret Manager secret with `secretEnv`).

1. Pick a GCP project. Enable the Cloud Build API:

   ```bash
   gcloud config set project PROJECT_ID
   gcloud services enable cloudbuild.googleapis.com
   ```

2. Connect this GitHub repo to Cloud Build.
   - Console: Cloud Build → Repositories → Link repository → GitHub.
   - Or [2nd gen / Developer Connect](https://cloud.google.com/build/docs/automating-builds/github/connect-repo-github).
   - Install the Cloud Build GitHub App on `charleszeigler/agfDeploymentDocs` so push and pull-request builds report a status check.

3. Create triggers that read `cloudbuild.yaml` from the repo. Example 1st-gen GitHub triggers:

   ```bash
   gcloud builds triggers create github \
     --name=dagger-ci-push \
     --repo-name=agfDeploymentDocs \
     --repo-owner=charleszeigler \
     --branch-pattern='.*' \
     --build-config=cloudbuild.yaml \
     --description='Dagger CI on push'

   gcloud builds triggers create github \
     --name=dagger-ci-pr \
     --repo-name=agfDeploymentDocs \
     --repo-owner=charleszeigler \
     --pull-request-pattern='.*' \
     --build-config=cloudbuild.yaml \
     --description='Dagger CI on pull requests'
   ```

   For a 2nd-gen connected repository, pass `--repository=projects/PROJECT_ID/locations/REGION/connections/CONNECTION/repositories/REPO` instead of `--repo-name` / `--repo-owner`.

4. Confirm a build. Push a commit or open a pull request, or:

   ```bash
   gcloud builds submit --config=cloudbuild.yaml
   ```

5. Optional: GitHub → Settings → Branches → require the Cloud Build check on `main`. Then disable the Buildkite pipeline and delete `.buildkite/`.

## Bump Dagger

Change these pins together, then run `dagger call ci --source .` locally:

- `engineVersion` in `dagger.json`
- `DAGGER_VERSION` in `cloudbuild.yaml`

If Buildkite is switched to `dagger call ci`, pin `DAGGER_VERSION` there too. `node scripts/ci-check.mjs` fails if the Cloud Build pin drifts.

## Retired

GitHub Actions (`.github/workflows/ci.yml`) is removed. Do not add it back.
