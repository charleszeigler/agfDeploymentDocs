# Agentforce Deployment Guides

Customer-facing deployment guides for moving Agentforce implementations from sandbox to production with Salesforce CLI and `package.xml`.

Last content review: June 28, 2026. Re-check the linked Salesforce source docs before a customer handoff because Agentforce, Data 360, and Enhanced Web Chat deployment behavior changes frequently.

## Public guide set

| Guide | Purpose |
|---|---|
| [docs/index.md](docs/index.md) | Start here and choose the correct deployment path. |
| [docs/00-before-you-start.md](docs/00-before-you-start.md) | Gather values, install CLI, log in, and verify prerequisites. |
| [docs/01-deploy-package.md](docs/01-deploy-package.md) | Validate, deploy, retrieve, and check package status. |
| [docs/02-publish-and-activate.md](docs/02-publish-and-activate.md) | Publish, activate, and smoke test agents after metadata deploy. |
| [docs/03-troubleshooting.md](docs/03-troubleshooting.md) | Diagnose common deploy, publish, Data Kit, and Web Chat issues. |
| [docs/10-service-agent.md](docs/10-service-agent.md) | Deploy and activate a Service Agent. |
| [docs/11-employee-agent.md](docs/11-employee-agent.md) | Deploy and activate an Employee Agent. |
| [docs/12-lead-nurture-sdr.md](docs/12-lead-nurture-sdr.md) | Deploy Lead Nurturing dependencies and finish managed-template setup. |
| [docs/20-data-cloud-data-kit.md](docs/20-data-cloud-data-kit.md) | Prepare and deploy a separate Data 360 / Data Cloud Data Kit package. |
| [docs/21-enhanced-web-chat.md](docs/21-enhanced-web-chat.md) | Migrate or manually rebuild Enhanced Web Chat setup for an Agentforce channel. |
| [docs/30-final-go-live-validation.md](docs/30-final-go-live-validation.md) | Final target-org runtime checklist for customer handoff. |
| [docs/meta.json](docs/meta.json) | Public docs-site navigation. |

Validation notes and evidence under `internal/` are not public guide content.

## Public validation gate

Before a customer handoff, run the full local validation gate:

```bash
cd agentforce-deployment
node scripts/validate-handoff.mjs
```

This runs the public docs gate, docs-site build and lint, rendered route smoke test, and runtime-summary regression. It does not deploy to Salesforce and does not run live target-org runtime checks.

For a faster docs-only check, run:

```bash
node scripts/validate-public-docs.mjs
```

The gate checks public wording, placeholder consistency, Salesforce CLI command shapes, Markdown links, public navigation, XML parsing, and the Data Kit manifest shape. It does not validate target-org runtime readiness; use [docs/30-final-go-live-validation.md](docs/30-final-go-live-validation.md) after deployment.

## Package templates

Use the manifest templates in [manifests](manifests) as starting points. They are not deploy-ready until project-specific placeholders are replaced and unused blocks are removed.

| Template | Use |
|---|---|
| [manifests/service-agent-package.xml](manifests/service-agent-package.xml) | Service Agent source and dependencies. |
| [manifests/employee-agent-package.xml](manifests/employee-agent-package.xml) | Employee Agent source and dependencies. |
| [manifests/employee-agent-access-package.xml](manifests/employee-agent-access-package.xml) | Employee Agent access permission set after publish. |
| [manifests/lead-nurture-sdr-agent-package.xml](manifests/lead-nurture-sdr-agent-package.xml) | Lead Nurturing dependencies only. |
| [manifests/data-cloud-data-kit-package.xml](manifests/data-cloud-data-kit-package.xml) | Example Data Kit manifest shape. Prefer the source Data Kit generated manifest. |

## Placeholder convention

Markdown commands use angle-bracket placeholders:

- `<SOURCE_ORG_ALIAS>`
- `<TARGET_ORG_ALIAS>`
- `<PACKAGE_XML_PATH>`
- `<AGENT_API_NAME>`
- `<DATA_KIT_DEVELOPER_NAME>`
- `<DATA_CLOUD_TABLE_NAME>`
- `<MESSAGING_CHANNEL_API_NAME>`
- `<MESSAGING_SESSION_ID>`
- `<AGENT_USER_USERNAME>`
- `<EMPLOYEE_USERNAME>`
- `<SESSION_ID>`
- `<VERSION_NUMBER>`
- `<JOB_ID>`
- `<JOB_ID_FROM_VALIDATE>`

Manifest XML uses XML-safe placeholder text such as `AGENT_API_NAME` because raw `<AGENT_API_NAME>` inside a `<members>` value would break XML.

## Guide Coverage

Covered in this guide set:

- Service and Employee Agent package mechanics.
- Agent publish, activate, and smoke-test sequence after metadata deploy.
- Employee Agent post-publish permission-set access through `agentAccesses`.
- Dependency coverage for invocable Apex, tests, Flows, prompt templates, Custom Lightning Types, LWC CLT renderers, objects, fields, permission sets, and credentials.
- Data Kit source-package path: create a DevOps Data Kit in sandbox, download its generated manifest, retrieve that package.
- Data Kit runtime handoff guidance: target component deployment is separate from metadata deploy, and API deployment requires component-specific payloads.
- Lead Nurturing email/EAC setup being target-org manual setup.
- Enhanced Web Chat candidate metadata, manual rebuild fallback, publish, website/domain, Omni routing, and smoke-test steps.

Customer-specific validation required:

- Full Enhanced Web Chat runtime migration, publish, website embedding, and conversation smoke test. Salesforce Known Issue W-15932771 still lists Messaging for Web deployment as not supported, so validate every customer package and keep the manual rebuild path.
- Lead Nurturing managed-template enablement and Builder preview in the target org.
- Data Kit runtime component deploy, connector reauthorization, and data refresh in the target org. Use the Data Cloud UI unless the technical team has a sandbox-validated component payload.
- Published Employee Agent CLI preview still returned `Invalid user ID provided on start session`; use Testing Center and the Lightning Agentforce panel for Employee Agent active-runtime smoke testing.
- Target validate-only output can still report zero Apex tests run even with `RunSpecifiedTests`; stop and inspect the JSON before quick deploy.
- Full clean-target sandbox deploy, publish, activate, and channel smoke test for each customer package.
