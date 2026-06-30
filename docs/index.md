# Agentforce Deployment Guides

Move an existing Agentforce implementation from sandbox to production with Salesforce CLI and `package.xml`.

**Required before deploy:** Confirm the package type first. Service and Employee Agents use Agent Script metadata. Lead Nurturing packages dependencies only. Data 360 assets use a separate Data Kit package.

## Deployment Steps

1. [Before You Start](00-before-you-start.md): confirm the target org and prerequisites.
2. Select the package or agent type guide below.
3. Build the package-specific `package.xml` in the selected guide.
4. [Prepare and Retrieve a Package](01-prepare-and-retrieve-package.md), if source files need to be pulled from a sandbox.
5. [Deploy a Package](01-deploy-package.md): validate, then deploy to the target org.
6. Complete target setup in the selected guide.
7. [Publish and Activate](02-publish-and-activate.md): publish, activate, and smoke test agent changes.
8. [Final Go-Live Validation](30-final-go-live-validation.md): run final go-live checks.

## Select Guides

| Need | Guide |
|---|---|
| Any deployment | [Before You Start](00-before-you-start.md) |
| Retrieve source files | [Prepare and Retrieve a Package](01-prepare-and-retrieve-package.md) |
| Validate or deploy a package | [Deploy a Package](01-deploy-package.md) |
| Publish or activate agent changes | [Publish and Activate](02-publish-and-activate.md) |
| Fix failures | [Troubleshooting](03-troubleshooting.md) |
| Service Agent | [Service Agent](10-service-agent.md) |
| Employee Agent | [Employee Agent](11-employee-agent.md) |
| Lead Nurture Agent dependencies | [Lead Nurture Agent](12-lead-nurture-agent.md) |
| Reusable subagents or actions | [Reusable Agent Assets](13-reusable-agent-assets.md) |
| Data 360 / Data Cloud | [Data Cloud Data Kit](20-data-cloud-data-kit.md) |
| Enhanced Web Chat | [Enhanced Web Chat](21-enhanced-web-chat.md) |
| Go-live validation | [Final Go-Live Validation](30-final-go-live-validation.md) |

## Confirm the agent metadata model

Match the source package before deploy. Agentforce metadata differs across legacy Agent Builder, committed Builder versions, and Agent Script.

| Source shape | Package path | Target-org finish |
|---|---|---|
| Draft Agent Script source in `aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent` | Service or Employee Agent guide | Set target users/access, live-preview, publish, activate |
| Committed custom agent version | Package-specific retrieve/deploy instructions | Do not edit generated metadata; create a new target version for user or behavior changes |
| Legacy custom agent without Agent Script | Package-specific `Bot` / `BotVersion` instructions | Validate in a sandbox before production |
| Managed Lead Nurturing or Sales Coach agent | Lead Nurturing dependencies guide | Create and configure the managed agent directly in the target org |
| Customer-owned reusable subagent or action | Reusable Agent Assets guide | Add from Asset Library, preview, publish target agent changes |

## Placeholder rule

Replace command placeholders with real values. Manifest XML uses XML-safe placeholders; raw angle-bracket placeholders inside `<members>` break XML.

## What package.xml does not carry

`package.xml` moves metadata definitions, not runtime state, secrets, or per-org users.

| Item | Where to finish it |
|---|---|
| Service Agent user | Target org setup before publish |
| Employee Agent access | Target org permission assignment |
| Committed agent user changes | New target-org version or Builder setup |
| Lead Nurturing email and EAC connections | Target org Lead Nurturing setup |
| Asset Library selection in a target agent draft | Target org Agentforce Builder |
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
| Reusable Agent Assets | Target agent draft includes the asset, live-action preview passes, target agent changes are published |
| Data 360 / Data Cloud | Data Kit components are deployed, connectors are reauthorized, data processes are refreshed, target data is visible |
| Enhanced Web Chat | Target deployment is published, website or Experience Builder page loads the target snippet/component, an online Omni user or active agent handles a test conversation |
