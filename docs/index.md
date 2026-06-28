# Agentforce Deployment Guides

Use these guides to move an existing Agentforce implementation from a sandbox to a production org with Salesforce CLI and `package.xml`.

> **Required before deploy:** Confirm which package type you have before you start. Service and Employee Agents use Agent Script metadata. Lead Nurturing uses a managed template and this guide set packages dependencies only. Data 360 assets must use a separate Data Kit package.

## Choose the right guide

| Need | Guide |
|---|---|
| Prepare values, log in, and confirm prerequisites | [Before You Start](00-before-you-start.md) |
| Validate and deploy a `package.xml` package | [Deploy a Package](01-deploy-package.md) |
| Publish, activate, and smoke test agents | [Publish and Activate](02-publish-and-activate.md) |
| Resolve common deployment failures | [Troubleshooting](03-troubleshooting.md) |
| Deploy a customer-facing Service Agent | [Deploy and Activate a Service Agent](10-service-agent.md) |
| Deploy an employee-facing Employee Agent | [Deploy and Activate an Employee Agent](11-employee-agent.md) |
| Move Lead Nurturing custom dependencies | [Deploy Lead Nurturing Dependencies](12-lead-nurture-sdr.md) |
| Move Data 360 / Data Cloud assets | [Deploy a Data Cloud Data Kit](20-data-cloud-data-kit.md) |
| Move Enhanced Web Chat configuration | [Migrate Enhanced Web Chat](21-enhanced-web-chat.md) |
| Confirm target-org runtime readiness | [Final Go-Live Validation](30-final-go-live-validation.md) |

## Placeholder convention

Replace every placeholder before running a command or handing off a package.

| Placeholder | Meaning |
|---|---|
| `<SOURCE_ORG_ALIAS>` | Source sandbox alias in Salesforce CLI |
| `<TARGET_ORG_ALIAS>` | Target production or sandbox alias in Salesforce CLI |
| `<PACKAGE_XML_PATH>` | Path to the package manifest, such as `manifest/package.xml` |
| `<AGENT_API_NAME>` | Agent API/developer name |
| `<DATA_KIT_DEVELOPER_NAME>` | Data Kit developer name |
| `<DATA_CLOUD_TABLE_NAME>` | Data Cloud DLO or DMO table name, if row-count validation is used |
| `<MESSAGING_CHANNEL_API_NAME>` | Enhanced Web Chat messaging channel API name |
| `<MESSAGING_SESSION_ID>` | Messaging Session record ID created during an Enhanced Web Chat smoke test |
| `<AGENT_USER_USERNAME>` | Username of the Service Agent user in the target org |
| `<EMPLOYEE_USERNAME>` | Username of an employee who will use the Employee Agent |
| `<SESSION_ID>` | Session ID returned by an agent preview command |
| `<VERSION_NUMBER>` | Agent version number returned by publish or activation status |
| `<JOB_ID>` | Deploy or Data Kit job ID returned by Salesforce CLI or REST API |
| `<JOB_ID_FROM_VALIDATE>` | Job ID from a successful production validation command |

> **Customer-specific value:** Do not type the angle brackets. For example, if the target alias is `customerProduction`, use `--target-org customerProduction`, not `--target-org <customerProduction>`.

## What package.xml does not carry

`package.xml` moves metadata definitions. It does not carry runtime state, production secrets, or per-org users.

| Item | Where to finish it |
|---|---|
| Service Agent user | Target org setup before publish |
| Employee Agent access | Target org permission assignment |
| Lead Nurturing email and EAC connections | Target org Lead Nurturing setup |
| Credential secrets and OAuth tokens | Target org credential setup |
| Data 360 runtime deploy and refresh | Target org Data 360 setup |
| Enhanced Web Chat publish, CORS, and snippet/domain setup | Target org Embedded Service Deployment setup |

## Before go-live

Use this checklist after the package deploy succeeds. These checks are manual target-org validation, not extra metadata to add to `package.xml`. For the complete customer handoff checklist, use [Final Go-Live Validation](30-final-go-live-validation.md).

| If the deployment includes | Confirm before go-live |
|---|---|
| Service Agent | Agent user exists, has required access, live preview passes, agent is published and active |
| Employee Agent | Employee access package is deployed after activation, a non-admin employee can use the agent from Lightning |
| Lead Nurturing | Managed setup is enabled, agent email/EAC is connected, Builder preview shows the expected email behavior |
| Data 360 / Data Cloud | Data Kit components are deployed, connectors are reauthorized, data processes are refreshed, target data is visible |
| Enhanced Web Chat | Target deployment is published, website or Experience Builder page loads the target snippet/component, an online Omni user or active agent handles a test conversation |
