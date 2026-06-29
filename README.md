# Agentforce Deployment Guides

Public Markdown for moving existing Agentforce implementations from sandbox to production with Salesforce CLI and `package.xml`.

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
| Dependencies | `13-reusable-agent-assets`, `20-data-cloud-data-kit`, or `21-enhanced-web-chat` when needed |
| Go-live | `30-final-go-live-validation` |

## Package templates

Use [manifests](manifests) as starting points. Replace placeholders and remove unused blocks before deployment.

| Template | Use |
|---|---|
| [manifests/service-agent-package.xml](manifests/service-agent-package.xml) | Service Agent source and dependencies |
| [manifests/employee-agent-package.xml](manifests/employee-agent-package.xml) | Employee Agent source and dependencies |
| [manifests/employee-agent-access-package.xml](manifests/employee-agent-access-package.xml) | Employee Agent access permission set after publish |
| [manifests/lead-nurture-agent-package.xml](manifests/lead-nurture-agent-package.xml) | Lead Nurture Agent dependencies only |
| [manifests/reusable-agent-assets-package.xml](manifests/reusable-agent-assets-package.xml) | Customer-owned reusable Agentforce subagents and actions |
| [manifests/data-cloud-data-kit-package.xml](manifests/data-cloud-data-kit-package.xml) | Example Data Kit manifest shape; prefer the source Data Kit generated manifest |

## Coverage

Covered:

- Package preparation and retrieve flow
- Service and Employee Agent packages
- Agent Script versus legacy metadata selection
- Reusable Agentforce subagents and actions
- Publish, activate, and smoke test
- Employee `agentAccesses`
- Apex, tests, Flows, prompt templates, objects, fields, permission sets, credentials, and Custom Lightning Types only where the package uses them
- Data Kit generated-manifest packaging plus component deployment handoff
- Lead Nurturing dependency-only packaging plus email/EAC target setup
- Enhanced Web Chat metadata candidate plus manual rebuild/publish/runtime checks

Still target-org specific:

- Web Chat host page/snippet and website smoke test
- Lead Nurturing managed setup, agent user, email/EAC, Builder preview, cadence, and activation
- Data Kit component payload approval, connector reauthorization, source data refresh, and row-count acceptance
- Employee Agent Lightning panel or Testing Center smoke when CLI preview cannot infer user context
- Production validation output that reports zero Apex tests
- Clean-target validation for each package
