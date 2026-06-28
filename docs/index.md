# Agentforce Deployment Guides

Use these guides to move an existing Agentforce implementation from sandbox to production with Salesforce CLI and `package.xml`.

> **Required before deploy:** Confirm the package type first. Service and Employee Agents use Agent Script metadata. Lead Nurturing packages dependencies only. Data 360 assets use a separate Data Kit package.

## Choose the right guide

Open only the guides that match the package. Each guide lists the values it needs; do not gather Data Kit, Web Chat, Lead Nurturing, or user-access values unless that guide applies.

| Need | Guide |
|---|---|
| Log in and learn how to run command boxes | [Before You Start](00-before-you-start.md) |
| Validate and deploy a `package.xml` package | [Deploy a Package](01-deploy-package.md) |
| Publish, activate, and smoke test agents | [Publish and Activate](02-publish-and-activate.md) |
| Resolve common deployment failures | [Troubleshooting](03-troubleshooting.md) |
| Deploy a customer-facing Service Agent | [Deploy and Activate a Service Agent](10-service-agent.md) |
| Deploy an employee-facing Employee Agent | [Deploy and Activate an Employee Agent](11-employee-agent.md) |
| Move Lead Nurture Agent custom dependencies | [Deploy Lead Nurture Agent Dependencies](12-lead-nurture-agent.md) |
| Move Data 360 / Data Cloud assets | [Deploy a Data Cloud Data Kit](20-data-cloud-data-kit.md) |
| Move Enhanced Web Chat configuration | [Migrate Enhanced Web Chat](21-enhanced-web-chat.md) |
| Confirm target-org runtime readiness | [Final Go-Live Validation](30-final-go-live-validation.md) |

## Placeholder rule

Replace placeholders before running commands. Do not type the angle brackets. For example, if the target alias is `customerProduction`, use `--target-org customerProduction`, not `--target-org <customerProduction>`.

Manifest XML uses XML-safe placeholders such as `AGENT_API_NAME`; raw `<AGENT_API_NAME>` inside `<members>` would break XML.

## What package.xml does not carry

`package.xml` moves metadata definitions. It does not move runtime state, secrets, or per-org users.

| Item | Where to finish it |
|---|---|
| Service Agent user | Target org setup before publish |
| Employee Agent access | Target org permission assignment |
| Lead Nurturing email and EAC connections | Target org Lead Nurturing setup |
| Credential secrets and OAuth tokens | Target org credential setup |
| Data 360 runtime deploy and refresh | Target org Data 360 setup |
| Enhanced Web Chat publish, CORS, and snippet/domain setup | Target org Embedded Service Deployment setup |

## Before go-live

After deploy, use [Final Go-Live Validation](30-final-go-live-validation.md). These are target-org checks, not extra `package.xml` members.

| If the deployment includes | Confirm before go-live |
|---|---|
| Service Agent | Agent user exists, has required access, live preview passes, agent is published and active |
| Employee Agent | Employee access package is deployed after activation, a non-admin employee can use the agent from Lightning |
| Lead Nurturing | Managed setup is enabled, agent email/EAC is connected, Builder preview shows the expected email behavior |
| Data 360 / Data Cloud | Data Kit components are deployed, connectors are reauthorized, data processes are refreshed, target data is visible |
| Enhanced Web Chat | Target deployment is published, website or Experience Builder page loads the target snippet/component, an online Omni user or active agent handles a test conversation |
