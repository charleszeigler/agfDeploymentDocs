# Buildkite host

Buildkite is the live GitHub status check. It runs the same three commands as `dagger call ci`:

1. `node --check templates/deploy.mjs`
2. `node --test tests/deploy.test.mjs`
3. `node scripts/ci-check.mjs`

Each step runs in `node:20` via the Docker plugin on hosted `linux-small`. Pipeline logic you can run locally or on GCP is the Dagger module; see [ci/README.md](../ci/README.md).

## How it's wired

- **Org:** `charleszeigler` · **Cluster:** Default cluster · **Queue:** `linux-small` (hosted)
- **Pipeline:** `agf-deployment-docs`, repo `git@github.com:charleszeigler/agfDeploymentDocs.git`
- **Trigger:** GitHub webhook from `bk pipeline create --create-webhook`
- The initial step runs `buildkite-agent pipeline upload`, which reads this `pipeline.yml`

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
