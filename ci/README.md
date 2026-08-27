# Dagger CI

Pipeline logic is a [Dagger](https://dagger.io) TypeScript module. It does not call a Salesforce org and it does not deploy.

The three checks:

1. `node --check templates/deploy.mjs`
2. `node --test tests/deploy.test.mjs`
3. `node scripts/ci-check.mjs`

Every host runs the same function:

```bash
dagger call ci --source .
```

## Local

Needs the [Dagger CLI](https://docs.dagger.io/install) **v0.21.9** and a container runtime (Docker, Podman, or similar).

```bash
curl -fsSL https://dl.dagger.io/dagger/install.sh | DAGGER_VERSION=0.21.9 BIN_DIR=/usr/local/bin sh
dagger call ci --source .
```

Single check:

```bash
dagger call syntax --source .
dagger call unit --source .
dagger call docs --source .
```

Without Dagger, Node 20+ is enough:

```bash
node --check templates/deploy.mjs
node --test tests/deploy.test.mjs
node scripts/ci-check.mjs
```

## Live GitHub host: Buildkite

[`.buildkite/pipeline.yml`](../.buildkite/pipeline.yml) is already wired (hosted `linux-small`, GitHub webhook). It runs the three Node checks in `node:20` containers. See [`.buildkite/README.md`](../.buildkite/README.md). Those commands are the same ones `dagger call ci` runs.

## GCP host: Google Cloud Build

`cloudbuild.yaml` installs Dagger 0.21.9 and runs the same command. Pin that CLI version to the `engineVersion` in [`dagger.json`](../dagger.json).

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
