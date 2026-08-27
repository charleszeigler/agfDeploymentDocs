# Dagger CI

Pipeline logic is a [Dagger](https://dagger.io) TypeScript module.

This repo is Agentforce **deployment guides**, not a customer ALM app. Static CI never calls an org. Org CI is a scratch-org **fixture** (`ci/sf`) so Salesforce CLI, Apex tests, and Playwright stay honest. Scratch orgs do not provision Agentforce, Einstein, Prompt Builder, or Data 360. Dress rehearsal for those packages is still a fresh Developer sandbox (`RunLocalTests`), as the guides say.

## What's left (owner, not repo code)

GCP host is now live: `gcloud` is authenticated as `charleszeigler64@gmail.com`, project **`build-czeigler`** has the Cloud Build + Secret Manager APIs enabled, and `dagger call ci` is verified green there (build `e356ce32`, 2m30s). Deleting `.buildkite/` still makes the existing webhook fail (Buildkite #10, 1 second), so the pipeline file stays.

Two things need your identity, not repo code:

| # | You do | Why an agent cannot |
|---|---|---|
| 1 | Install the Cloud Build GitHub App on `charleszeigler/agfDeploymentDocs` and add push/PR triggers — [GCP host](#gcp-host-google-cloud-build). Until then, run builds with `gcloud builds submit`; Buildkite already reports the push check. | The GitHub App install is a browser OAuth step; an agent cannot click it. |
| 2 | Provide a Dev Hub sfdx auth URL and store it as the Secret Manager secret `SF_DEVHUB_AUTH_URL` — [Scratch-org secret](#scratch-org-secret-on-cloud-build). | The auth URL is a live Salesforce credential; the agent environment blocks reading and storing it. Do not commit this value. |

After #2, the next `dagger call org-ci` (Cloud Build or local) runs: create scratch org → dry-run deploy → deploy `RunLocalTests` → Apex coverage ≥ 75% → Playwright Lightning frontdoor → delete org.

Not a leftover task: Agentforce / Data 360 dress rehearsal on a scratch org. Salesforce does not provision those products on scratch. Keep using a fresh Developer sandbox for that path.

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

[`.buildkite/pipeline.yml`](../.buildkite/pipeline.yml) is the live GitHub check (hosted `linux-small`). Static steps run in `node:20`. The Salesforce step runs `ci/sf/org-ci.sh` when `SF_DEVHUB_AUTH_URL` is set. See [`.buildkite/README.md`](../.buildkite/README.md).

## GCP host: Google Cloud Build

`cloudbuild.yaml` installs Dagger 0.21.9, runs `dagger call ci`, then `dagger call org-ci` when `SF_DEVHUB_AUTH_URL` is present. Pin the CLI version to `engineVersion` in [`dagger.json`](../dagger.json). To enable org CI, add that env var (or a Secret Manager secret with `secretEnv` — see [Scratch-org secret](#scratch-org-secret-on-cloud-build)).

The host is **`build-czeigler`** (account `charleszeigler64@gmail.com`). The Cloud Build + Secret Manager APIs are enabled and the static tier is verified green (`gcloud builds submit` → build `e356ce32`, SUCCESS). Its build service account is `181768915183-compute@developer.gserviceaccount.com`.

1. Project is set. To reproduce from scratch:

   ```bash
   gcloud config set project build-czeigler
   gcloud services enable cloudbuild.googleapis.com secretmanager.googleapis.com
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

5. Optional: GitHub → Settings → Branches → require the Cloud Build check on `main`.

### Scratch-org secret on Cloud Build

`org-ci` needs a Dev Hub sfdx auth URL. Store it in Secret Manager and let the build read it — the value never lands in the repo or the logs:

```bash
# 1. Store the Dev Hub auth URL (piped straight in; never printed or committed).
sf org display --target-org <devhub> --verbose --json | jq -r '.result.sfdxAuthUrl' \
  | gcloud secrets create SF_DEVHUB_AUTH_URL --data-file=- --project build-czeigler

# 2. Let the Cloud Build service account read it.
gcloud secrets add-iam-policy-binding SF_DEVHUB_AUTH_URL --project build-czeigler \
  --member=serviceAccount:181768915183-compute@developer.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

Then add this to `cloudbuild.yaml` so the step gets `SF_DEVHUB_AUTH_URL` (the `if [ -n ... ]` guard already runs `dagger call org-ci` once the var is set):

```yaml
steps:
  - name: gcr.io/cloud-builders/docker
    # ...existing step...
    secretEnv:
      - SF_DEVHUB_AUTH_URL
availableSecrets:
  secretManager:
    - versionName: projects/build-czeigler/secrets/SF_DEVHUB_AUTH_URL/versions/latest
      env: SF_DEVHUB_AUTH_URL
```

Rotate or revoke anytime with `gcloud secrets versions add` / `gcloud secrets delete SF_DEVHUB_AUTH_URL`.

## Bump Dagger

Change these pins together, then run `dagger call ci --source .` locally:

- `engineVersion` in `dagger.json`
- `DAGGER_VERSION` in `cloudbuild.yaml`

`node scripts/ci-check.mjs` fails if the Cloud Build pin drifts.

## Retired

GitHub Actions (`.github/workflows/ci.yml`) is removed. Do not add it back.
