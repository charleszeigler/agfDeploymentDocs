# Buildkite CI

`pipeline.yml` runs the three checks that CI enforces:

1. `node --check templates/deploy.mjs`
2. `node --test tests/deploy.test.mjs`
3. `node scripts/ci-check.mjs`

Each step runs inside a `node:20` container via the Docker plugin, on the
Buildkite org's **hosted `linux-small` queue** — Buildkite-managed cloud
compute, so nothing runs on your machine.

## How it's wired

- **Org:** `charleszeigler` · **Cluster:** Default cluster · **Queue:**
  `linux-small` (hosted). The Default cluster's default queue is `linux-small`.
- **Pipeline:** `agf-deployment-docs`, repo
  `git@github.com:charleszeigler/agfDeploymentDocs.git`, default branch `main`.
- **Trigger:** a GitHub webhook created with `bk pipeline create --create-webhook`
  builds every push and pull request.
- The initial build step runs `buildkite-agent pipeline upload`, which reads
  this `pipeline.yml` from the repo on each build.

## Operating it

```bash
bk build create --pipeline agf-deployment-docs --branch main   # trigger a build
bk build list --pipeline agf-deployment-docs                   # recent builds
bk build watch <number> --pipeline agf-deployment-docs         # follow one
```

Optional status badge for the top-level `README.md`:
`[![Build status](https://badge.buildkite.com/<token>.svg)](https://buildkite.com/charleszeigler/agf-deployment-docs)`
(get `<token>` from Pipeline Settings → Badges).

## Agents with Node preinstalled

If you switch to agents that already have Node 20+, simplify `pipeline.yml` by
removing each `plugins:` block and keeping only the `command:` lines. Bump the
Docker plugin (`docker#v5.14.0`) to the latest release as needed.
