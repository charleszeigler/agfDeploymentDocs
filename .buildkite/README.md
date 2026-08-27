# Buildkite host

Buildkite is the live GitHub status check. It runs the Dagger pipeline:

```bash
dagger call ci --source .
```

That is the same function [Google Cloud Build](../ci/README.md) runs. Pipeline logic is [`dagger/src/index.ts`](../dagger/src/index.ts), not the three Node commands copied into YAML.

Hosted `linux-small` agents already have Docker, which Dagger uses to start its engine.

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
