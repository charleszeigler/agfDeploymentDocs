# Agentforce Deployment Guides

Public Markdown for moving existing Agentforce implementations from sandbox to production with Salesforce CLI.

Last content review: June 29, 2026. Re-check linked Salesforce source docs before deployment handoff because Agentforce, Data 360, and Enhanced Web Chat behavior changes frequently.

Start with [docs/index.md](docs/index.md).

- CLI package reference: [docs/deployment-workflow.md](docs/deployment-workflow.md)
- Public navigation: [docs/meta.json](docs/meta.json)
- Scope rule: each guide lists only the values needed for that path.

## Deployment Path

Start with `docs/index.md`. Use only the guides that match the package.

| Need | Use |
|---|---|
| Agent path | `10-service-agent`, `11-employee-agent`, or `12-lead-nurture-agent` |
| CLI reference | `deployment-workflow` when a package does not fit one primary guide |
| Dependencies | `13-legacy-agent-actions`, `20-data-360-data-kit`, or `21-enhanced-web-chat` when needed |

## Package templates

Use [manifests](manifests) as starting points. Replace placeholders and remove unused blocks before deployment.

| Template | Use |
|---|---|
| [manifests/service-agent-package.xml](manifests/service-agent-package.xml) | Service Agent source and dependencies |
| [manifests/employee-agent-package.xml](manifests/employee-agent-package.xml) | Employee Agent source and dependencies |
| [manifests/employee-agent-access-package.xml](manifests/employee-agent-access-package.xml) | Employee Agent access permission set after publish |
| [manifests/lead-nurture-agent-package.xml](manifests/lead-nurture-agent-package.xml) | Lead Nurture Agent dependencies only |
| [manifests/legacy-agent-actions-package.xml](manifests/legacy-agent-actions-package.xml) | Legacy Agent Actions |
| [manifests/data-360-data-kit-package.xml](manifests/data-360-data-kit-package.xml) | Example Data Kit manifest shape; prefer the source Data Kit generated manifest |
