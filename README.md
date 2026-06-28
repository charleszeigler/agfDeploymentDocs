# Agentforce Deployment Guides

Public Markdown content for moving existing Agentforce implementations from sandbox to production with Salesforce CLI and `package.xml`.

Last content review: June 28, 2026. Re-check linked Salesforce source docs before customer handoff because Agentforce, Data 360, and Enhanced Web Chat behavior changes frequently.

Start with [docs/index.md](docs/index.md). Each guide lists only the values needed for that path. [docs/meta.json](docs/meta.json) controls public docs-site navigation.

## Package templates

Use [manifests](manifests) as starting points. Replace placeholders and remove unused blocks before deployment.

| Template | Use |
|---|---|
| [manifests/service-agent-package.xml](manifests/service-agent-package.xml) | Service Agent source and dependencies |
| [manifests/employee-agent-package.xml](manifests/employee-agent-package.xml) | Employee Agent source and dependencies |
| [manifests/employee-agent-access-package.xml](manifests/employee-agent-access-package.xml) | Employee Agent access permission set after publish |
| [manifests/lead-nurture-agent-package.xml](manifests/lead-nurture-agent-package.xml) | Lead Nurture Agent dependencies only |
| [manifests/data-cloud-data-kit-package.xml](manifests/data-cloud-data-kit-package.xml) | Example Data Kit manifest shape; prefer the source Data Kit generated manifest |

## Coverage

Covered: Service and Employee Agent packages; publish, activate, and smoke test; Employee `agentAccesses`; Apex, tests, Flows, prompt templates, Custom Lightning Types, LWC CLT renderers, objects, fields, permission sets, and credentials; Data Kit generated-manifest packaging and runtime handoff; Lead Nurturing email/EAC target setup; and Enhanced Web Chat metadata candidate plus manual rebuild/publish/runtime checks.

Still customer-specific: Web Chat runtime migration and website smoke test; Lead Nurturing managed setup and Builder preview; Data Kit component deploy, connector reauthorization, and data refresh; Employee Agent Lightning panel or Testing Center smoke when CLI preview cannot infer user context; production validation output that reports zero Apex tests; and clean-target validation for each customer package.
