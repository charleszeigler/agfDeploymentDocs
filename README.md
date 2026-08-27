# Agentforce Deployment Guides

Public Markdown and `package.xml` templates for moving an **existing** Agentforce implementation from a work sandbox to production with Salesforce CLI.

For consultants and FDEs on a short handoff. Not a customer ALM rollout.

Start here: [docs/index.md](docs/index.md).

Last content review: August 26, 2026. Re-check linked Salesforce source docs before deployment handoff because Agentforce, Data 360, and Enhanced Web Chat behavior changes frequently.

## Org path

| Org | Job |
|---|---|
| Full or Partial Copy | Build and retrieve. Data-shaped smoke (Data 360 rows, search, web chat) |
| Fresh Developer sandbox | Dress rehearsal: real `sf project deploy start --test-level RunLocalTests`. `--dry-run` does not count |
| Production | `sf project deploy validate --test-level RunLocalTests` then `sf project deploy quick --job-id` |

Fresh means this package is not already in that Developer sandbox. Provision Agentforce, Einstein, Prompt Builder, and Data 360 there if the handoff uses them.

## What this is not

- Not Salesforce **DevOps Center**. This repo does not set up a Git pipeline.
- A **DevOps Data Kit** is the Data 360 metadata package. It is not DevOps Center. See [docs/20-data-360-data-kit.md](docs/20-data-360-data-kit.md).
- Not a full-org retrieve. Each guide lists only the members for that path.
- [`templates/deploy.mjs`](templates/deploy.mjs) is a starting skeleton, not a tested org deployer.

## Deployment Path

Use only the guides that match the package.

| Need | Use |
|---|---|
| Agent path | `10-service-agent`, `11-employee-agent`, or `12-lead-nurture-agent` |
| CLI reference | `deployment-workflow` when a package does not fit one primary guide |
| Staged deploy script | `30-deployment-script` when writing or running a Node coordinator instead of stepping 10/11 by hand |
| Dependencies | `13-legacy-agent-actions`, `20-data-360-data-kit`, or `21-enhanced-web-chat` when needed |
| Failed retrieve, deploy, preview, or runtime check | `03-troubleshooting` |

Shared deploy order when more than one path applies: Data 360 provision → DevOps Data Kit metadata → component deploy and refresh → agent package → preview → publish/activate → Employee access package → web chat.

- CLI package reference: [docs/deployment-workflow.md](docs/deployment-workflow.md)
- Staged deploy script: [docs/30-deployment-script.md](docs/30-deployment-script.md)
- Public navigation: [docs/meta.json](docs/meta.json)
- Scope rule: each guide lists only the values needed for that path.

## Package templates

Use [manifests](manifests) as starting points. These files are not retrieve-ready or deploy-ready if copied blindly. Build exact members with [Build package.xml from exact source names](docs/deployment-workflow.md#2-build-packagexml-from-exact-source-names), replace placeholders, and remove unused blocks before retrieve or deployment.

| Template | Use |
|---|---|
| [manifests/service-agent-package.xml](manifests/service-agent-package.xml) | Service Agent source and dependencies |
| [manifests/employee-agent-package.xml](manifests/employee-agent-package.xml) | Employee Agent source and dependencies |
| [manifests/employee-agent-access-package.xml](manifests/employee-agent-access-package.xml) | Employee Agent access permission set after publish |
| [manifests/lead-nurture-agent-package.xml](manifests/lead-nurture-agent-package.xml) | Lead Nurture Agent dependencies only |
| [manifests/legacy-agent-actions-package.xml](manifests/legacy-agent-actions-package.xml) | Legacy Agent Actions |
| [manifests/data-360-data-kit-package.xml](manifests/data-360-data-kit-package.xml) | Partial example of DevOps Data Kit manifest shape; prefer the source DevOps Data Kit generated manifest |

There is no Enhanced Web Chat `package.xml` template. Rebuild and publish the Embedded Service Deployment in the target org is the supported path.

## API versions

Summer ’26 Metadata API is 67.0. Use 67.0 unless a generated Data Kit manifest or current Agentforce DX example says otherwise.

## License

[MIT](LICENSE). Copy the guides and templates.

PRs welcome. `node scripts/ci-check.mjs` must pass. Do not expand this repo into a pipeline product.

## Checks

[Dagger](https://dagger.io) is the pipeline. [Buildkite](.buildkite/README.md) is the live GitHub host today. [Google Cloud Build](ci/README.md) is the GCP host. No Salesforce org. No deploy.

```bash
dagger call ci --source .
```

Without Dagger, Node 20+ is enough:

```bash
node --check templates/deploy.mjs
node --test tests/deploy.test.mjs
node scripts/ci-check.mjs
```

The checker walks Markdown links and heading anchors, `docs/meta.json` nav slugs, manifest XML, README manifest coverage, coordinator `--start-at` names in [docs/30-deployment-script.md](docs/30-deployment-script.md), fenced `--test-level NoTestRun`, and the Dagger pins. Host setup: [ci/README.md](ci/README.md).
