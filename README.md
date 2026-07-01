# Agentforce Deployment Guides

Public Markdown for moving existing Agentforce implementations from sandbox to production with Salesforce CLI.

Last content review: June 29, 2026. Re-check linked Salesforce source docs before deployment handoff because Agentforce, Data 360, and Enhanced Web Chat behavior changes frequently.

Start with [docs/index.md](docs/index.md).

- Build/retrieve: [docs/01-prepare-and-retrieve-package.md](docs/01-prepare-and-retrieve-package.md)
- Public navigation: [docs/meta.json](docs/meta.json)
- Scope rule: each guide lists only the values needed for that path.

## Deployment Path

Start with `docs/index.md`. Use only the guides that match the package.

| Need | Use |
|---|---|
| Setup | `00-before-you-start` |
| Source retrieve | `01-prepare-and-retrieve-package` when files must be pulled from the source sandbox |
| Package deploy | `01-deploy-package` |
| Agent publish | `02-publish-and-activate` when the deployment creates or changes an agent version |
| Agent type | `10-service-agent`, `11-employee-agent`, or `12-lead-nurture-agent` |
| Dependencies | `13-legacy-agent-actions`, `20-data-cloud-data-kit`, or `21-enhanced-web-chat` when needed |
| Go-live | `30-final-go-live-validation` |

## Package templates

Use [manifests](manifests) as starting points. Replace placeholders and remove unused blocks before deployment.

| Template | Use |
|---|---|
| [manifests/service-agent-package.xml](manifests/service-agent-package.xml) | Service Agent source and dependencies |
| [manifests/employee-agent-package.xml](manifests/employee-agent-package.xml) | Employee Agent source and dependencies |
| [manifests/employee-agent-access-package.xml](manifests/employee-agent-access-package.xml) | Employee Agent access permission set after publish |
| [manifests/lead-nurture-agent-package.xml](manifests/lead-nurture-agent-package.xml) | Lead Nurture Agent dependencies only |
| [manifests/legacy-agent-actions-package.xml](manifests/legacy-agent-actions-package.xml) | Legacy Agent Actions |
| [manifests/data-cloud-data-kit-package.xml](manifests/data-cloud-data-kit-package.xml) | Example Data Kit manifest shape; prefer the source Data Kit generated manifest |
