# Dagger CI

Pipeline logic is a [Dagger](https://dagger.io) TypeScript module.

This repo is Agentforce **deployment guides**, not a customer ALM app. Static CI never calls an org. Org CI is a scratch-org **fixture** (`ci/sf`) so Salesforce CLI, Apex tests, and Playwright stay honest. Scratch orgs do not provision Agentforce, Einstein, Prompt Builder, or Data 360. Dress rehearsal for those packages is still a fresh Developer sandbox (`RunLocalTests`), as the guides say.

## What's left (owner, not repo code)

GCP host is now live: `gcloud` is authenticated as `charleszeigler64@gmail.com`, project **`build-czeigler`** has the Cloud Build + Secret Manager APIs enabled, and `dagger call ci` is verified green there (build `e356ce32`, 2m30s). Deleting `.buildkite/` still makes the existing webhook fail (Buildkite #10, 1 second), so the pipeline file stays.

Two things need your identity, not repo code:

| # | You do | Why an agent cannot |
|---|---|---|
| 1 | Install the Cloud Build GitHub App on `charleszeigler/agfDeploymentDocs` and add push/PR triggers — [GCP host](#gcp-host-google-cloud-build). Until then, run builds with `gcloud builds submit`; Buildkite already reports the push check. | The GitHub App install is a browser OAuth step; an agent cannot click it. |
| 2 | Create the JWT connected app in the Dev Hub (t6) and store its private key as the Secret Manager secret `SF_JWT_KEY` — [Scratch-org secret](#scratch-org-secret-on-cloud-build). t6 never mints a `force://` refresh-token URL, so JWT is the auth path. | The connected app is a browser Setup step, and the private key is a live credential the agent environment blocks storing. Never commit the key. |

After #2, the next `dagger call org-ci-jwt` (Cloud Build or local) runs: create scratch org → dry-run deploy → deploy `RunLocalTests` → Apex coverage ≥ 75% → Playwright Lightning frontdoor → delete org.

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

Requires a Dev Hub that can create scratch orgs. Auth is one of two paths — never commit either credential.

**JWT bearer (headless, works when the org never mints a refresh token).** A connected app in the Dev Hub holds a self-signed cert; the private key signs the assertion. This is the path for `build-czeigler`. Key is a Secret; consumer key and username are not.

```bash
export SF_CONSUMER_KEY='<connected-app-consumer-key>'
export SF_HUB_USERNAME='<dev-hub-username>'
dagger call org-ci-jwt --source . \
  --jwt-key file://$HOME/.config/agf-ci/server.key \
  --consumer-key "$SF_CONSUMER_KEY" \
  --hub-username "$SF_HUB_USERNAME"
```

**sfdx auth URL (only if the org mints a refresh token).** Simpler, but many orgs return no `force://…` URL:

```bash
sf org display --target-org <devhub> --verbose --json
# use result.sfdxAuthUrl
export SF_DEVHUB_AUTH_URL='force://...'
dagger call org-ci --source . --devhub-auth-url env://SF_DEVHUB_AUTH_URL
```

Or without Dagger, with `sf` and Playwright browsers installed — set either
`SF_DEVHUB_AUTH_URL` or `SF_JWT_KEY` + `SF_CONSUMER_KEY` + `SF_HUB_USERNAME`:

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

Store the credential as a **secured** env var on Buildkite, or a Cloud Build / Secret Manager secret: `SF_JWT_KEY` (the RSA private key) plus plain `SF_CONSUMER_KEY` / `SF_HUB_USERNAME` for JWT, or `SF_DEVHUB_AUTH_URL` for the sfdx-url path. If none is set, hosts skip org CI and the static check still runs.

## Live GitHub host: Buildkite

[`.buildkite/pipeline.yml`](../.buildkite/pipeline.yml) is the live GitHub check (hosted `linux-small`). Static steps run in `node:20`. The Salesforce step runs `ci/sf/org-ci.sh` when `SF_DEVHUB_AUTH_URL` is set. See [`.buildkite/README.md`](../.buildkite/README.md).

## GCP host: Google Cloud Build

`cloudbuild.yaml` installs Dagger 0.21.9, runs `dagger call ci`, then `dagger call org-ci-jwt` when `SF_JWT_KEY` is wired (else `dagger call org-ci` when `SF_DEVHUB_AUTH_URL` is set, else skip). Pin the CLI version to `engineVersion` in [`dagger.json`](../dagger.json). To enable org CI, wire the Dev Hub secret with `secretEnv` — see [Scratch-org secret](#scratch-org-secret-on-cloud-build).

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

`org-ci-jwt` needs the JWT private key. Store it in Secret Manager and let the build read it — the key never lands in the repo or the logs. The consumer key and username are not secret and travel as plain build env vars.

```bash
# 1. Store the JWT private key (the file, piped in; never printed or committed).
gcloud secrets create SF_JWT_KEY --data-file="$HOME/.config/agf-ci/server.key" \
  --project build-czeigler

# 2. Let the Cloud Build service account read it.
gcloud secrets add-iam-policy-binding SF_JWT_KEY --project build-czeigler \
  --member=serviceAccount:181768915183-compute@developer.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

Then add this to `cloudbuild.yaml` so the step gets `SF_JWT_KEY` as a secret and the two non-secret values as env (the `if [ -n ... ]` guard already runs `dagger call org-ci-jwt` once `SF_JWT_KEY` is set):

```yaml
steps:
  - name: gcr.io/cloud-builders/docker
    # ...existing step...
    env:
      - DAGGER_NO_NAG=1
      - SF_CONSUMER_KEY=<connected-app-consumer-key>
      - SF_HUB_USERNAME=<dev-hub-username>
    secretEnv:
      - SF_JWT_KEY
availableSecrets:
  secretManager:
    - versionName: projects/build-czeigler/secrets/SF_JWT_KEY/versions/latest
      env: SF_JWT_KEY
```

Rotate or revoke anytime with `gcloud secrets versions add` / `gcloud secrets delete SF_JWT_KEY`. The sfdx-url path (`SF_DEVHUB_AUTH_URL`, `dagger call org-ci`) still works for any org that mints a refresh token.

## Bump Dagger

Change these pins together, then run `dagger call ci --source .` locally:

- `engineVersion` in `dagger.json`
- `DAGGER_VERSION` in `cloudbuild.yaml`

`node scripts/ci-check.mjs` fails if the Cloud Build pin drifts.

## Retired

GitHub Actions (`.github/workflows/ci.yml`) is removed. Do not add it back.
