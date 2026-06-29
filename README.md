# Agentforce Deployment Guides

Public Markdown content for moving existing Agentforce implementations from sandbox to production with Salesforce CLI and `package.xml`.

Last content review: June 29, 2026. Re-check linked Salesforce source docs before customer handoff because Agentforce, Data 360, and Enhanced Web Chat behavior changes frequently.

Start with [docs/index.md](docs/index.md). Use [docs/01-prepare-and-retrieve-package.md](docs/01-prepare-and-retrieve-package.md) to build the manifest and retrieve source files before deployment. Each guide lists only the values needed for that path. [docs/meta.json](docs/meta.json) controls public docs-site navigation.

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

Covered: package preparation and retrieve flow; Service and Employee Agent packages; Agent Script versus legacy metadata selection; reusable Agentforce subagents and actions; publish, activate, and smoke test; Employee `agentAccesses`; Apex, tests, Flows, prompt templates, Custom Lightning Types, LWC CLT renderers, objects, fields, permission sets, and credentials; Data Kit generated-manifest packaging plus component deployment handoff; Lead Nurturing dependency-only packaging plus email/EAC target setup; and Enhanced Web Chat metadata candidate plus manual rebuild/publish/runtime checks.

Still customer-specific: Web Chat host page/snippet and website smoke test; Lead Nurturing managed setup, agent user, email/EAC, Builder preview, cadence, and activation; Data Kit component payload approval, connector reauthorization, source data refresh, and row-count acceptance; Employee Agent Lightning panel or Testing Center smoke when CLI preview cannot infer user context; production validation output that reports zero Apex tests; and clean-target validation for each customer package.
