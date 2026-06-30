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

## Guides

Process:

| Guide | Use for |
|---|---|
| [Before You Start](00-before-you-start.md) | Target org and prerequisite checks |
| [Prepare and Retrieve a Package](01-prepare-and-retrieve-package.md) | Source retrieve and manifest review |
| [Deploy a Package](01-deploy-package.md) | Validate, deploy, and check deploy status |
| [Publish and Activate](02-publish-and-activate.md) | Agent publish, activation, and smoke tests |
| [Troubleshooting](03-troubleshooting.md) | Deployment, agent, Data 360, and Web Chat failures |
| [Final Go-Live Validation](30-final-go-live-validation.md) | Final runtime checks |

Package types:

| Package | Guide |
|---|---|
| Service Agent | [Deploy and Activate a Service Agent](10-service-agent.md) |
| Employee Agent | [Deploy and Activate an Employee Agent](11-employee-agent.md) |
| Lead Nurture Agent dependencies | [Deploy Lead Nurture Agent Dependencies](12-lead-nurture-agent.md) |
| Legacy agent actions | [Legacy Agent Actions](13-legacy-agent-actions.md) |
| Data 360 / Data Cloud | [Deploy a Data Cloud Data Kit](20-data-cloud-data-kit.md) |
| Enhanced Web Chat | [Migrate Enhanced Web Chat](21-enhanced-web-chat.md) |

## Confirm the agent metadata model

Match the source package before deploy. Agentforce metadata differs across legacy Agent Builder, committed Builder versions, and Agent Script.

| Source shape | Use |
|---|---|
| Draft Agent Script source in `aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent` | Service or Employee Agent guide; then set target users/access, live preview, publish, and activate |
| Committed custom agent version | Package-specific retrieve/deploy instructions; create a new target version for user or behavior changes |
| Legacy custom agent without Agent Script | Package-specific `Bot` / `BotVersion` instructions; validate in a sandbox before production |
| Managed Lead Nurturing or Sales Coach agent | Lead Nurturing dependencies guide; configure the managed agent directly in the target org |
| Project-owned legacy agent action | Legacy Agent Actions; add from Asset Library, preview, and publish target agent changes |

## Placeholder rule

Replace command placeholders with real values. Manifest XML uses XML-safe placeholders; raw angle-bracket placeholders inside `<members>` break XML.

## What package.xml does not carry

`package.xml` moves metadata definitions, not runtime state, secrets, or per-org users.

| Item | Finish in target org |
|---|---|
| Service Agent user | Setup before publish |
| Employee Agent access | Permission assignment |
| Committed agent user changes | New target-org version or Builder setup |
| Lead Nurturing email and EAC connections | Lead Nurturing setup |
| Asset Library selection | Target agent draft |
| Credential secrets and OAuth tokens | Credential setup |
| Data 360 runtime deploy and refresh | Data 360 setup |
| Enhanced Web Chat publish, CORS, and snippet/domain setup | Embedded Service Deployment setup |

## Before go-live

After deploy, use [Final Go-Live Validation](30-final-go-live-validation.md). These are target-org checks, not extra `package.xml` members.

| Includes | Confirm |
|---|---|
| Service Agent | Agent user exists, has required access, live preview passes, agent is published and active |
| Employee Agent | Access package is deployed after activation; a non-admin employee can use the agent from Lightning |
| Lead Nurturing | Managed setup is enabled, agent email/EAC is connected, and Builder preview shows expected email behavior |
| Legacy Agent Actions | Target agent draft includes the action, live-action preview passes, and target agent changes are published |
| Data 360 / Data Cloud | Data Kit components are deployed, connectors are reauthorized, data processes are refreshed, and target data is visible |
| Enhanced Web Chat | Target deployment is published, the website or Experience Builder page loads the target snippet/component, and an online Omni user or active agent handles a test conversation |
