# Agentforce Deployment Guides

Public Markdown for moving existing Agentforce implementations from sandbox to production with Salesforce CLI.

Last content review: August 24, 2026. Re-check linked Salesforce source docs before deployment handoff because Agentforce, Data 360, and Enhanced Web Chat behavior changes frequently.

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

Shared deploy order when more than one path applies: Data 360 provision → DevOps Data Kit metadata → component deploy and refresh → agent package → preview → publish/activate → Employee access package → web chat.

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

| Package or call | Version | Rule |
|---|---|---|
| Agent Script, platform, and legacy action packages | `67.0` | Follow a current Agentforce DX example if it specifies another version |
| Data Kit REST calls and generated DevOps Data Kit manifests | `67.0` | Follow the generated manifest if it specifies another version |
