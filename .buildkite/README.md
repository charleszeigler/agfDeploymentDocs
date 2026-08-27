# Buildkite host

Buildkite is the live GitHub status check. The webhook is installed on this repo and cannot be removed from a Cloud Agent (no Buildkite API token, GitHub hooks API 403). Deleting this directory makes that check fail in about a second.

Static steps (always):

1. `node --check templates/deploy.mjs`
2. `node --test tests/deploy.test.mjs tests/check-coverage.test.mjs`
3. `node scripts/ci-check.mjs`

Each of those runs in `node:20` via the Docker plugin on hosted `linux-small`. Same work as `dagger call ci`.

Org step (after `wait`): if `SF_DEVHUB_AUTH_URL` is set on the pipeline, run `ci/sf/org-ci.sh` in the Playwright image (Salesforce CLI installed at start). If the secret is missing, the step skips so the GitHub check stays green.

Scratch-org CI is a fixture. It is not Agentforce dress rehearsal. See [ci/README.md](../ci/README.md).

## How it's wired

- **Org:** `charleszeigler` · **Cluster:** Default cluster · **Queue:** `linux-small` (hosted)
- **Pipeline:** `agf-deployment-docs`, repo `git@github.com:charleszeigler/agfDeploymentDocs.git`
- **Trigger:** GitHub webhook from `bk pipeline create --create-webhook`
- The initial step runs `buildkite-agent pipeline upload`, which reads this `pipeline.yml`
- Set a secured pipeline env var `SF_DEVHUB_AUTH_URL` (Dev Hub sfdx auth url) to enable org CI

## After Cloud Build is green

When a Cloud Build trigger reports on GitHub and you want that to be the only host:

1. Require the Cloud Build check on `main` if you use branch protection.
2. Disable or delete the Buildkite pipeline `agf-deployment-docs` and its GitHub webhook.
3. Delete `.buildkite/`.
