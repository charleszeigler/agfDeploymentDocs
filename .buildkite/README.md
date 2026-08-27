# Buildkite host

Buildkite is the live GitHub status check.

Static steps (always):

1. `node --check templates/deploy.mjs`
2. `node --test tests/deploy.test.mjs tests/check-coverage.test.mjs`
3. `node scripts/ci-check.mjs`

Each of those runs in `node:20` via the Docker plugin on hosted `linux-small`.

Org step (after `wait`): if `SF_DEVHUB_AUTH_URL` is set on the pipeline, run `ci/sf/org-ci.sh` in the Playwright image (Salesforce CLI installed at start). If the secret is missing, the step skips so the GitHub check stays green.

Scratch-org CI is a fixture. It is not Agentforce dress rehearsal. See [ci/README.md](../ci/README.md).

## How it's wired

- **Org:** `charleszeigler` · **Cluster:** Default cluster · **Queue:** `linux-small` (hosted)
- **Pipeline:** `agf-deployment-docs`, repo `git@github.com:charleszeigler/agfDeploymentDocs.git`
- **Trigger:** GitHub webhook from `bk pipeline create --create-webhook`
- The initial step runs `buildkite-agent pipeline upload`, which reads this `pipeline.yml`
- Set a secured pipeline env var `SF_DEVHUB_AUTH_URL` (Dev Hub sfdx auth url) to enable org CI

## Operating it

```bash
bk build create --pipeline agf-deployment-docs --branch main
bk build list --pipeline agf-deployment-docs
bk build watch <number> --pipeline agf-deployment-docs
```

## After Cloud Build is green

When a Cloud Build trigger reports on GitHub and you want that to be the only host:

1. Require the Cloud Build check on `main` if you use branch protection.
2. Disable or delete the Buildkite pipeline `agf-deployment-docs` and its GitHub webhook.
3. Delete `.buildkite/`.
