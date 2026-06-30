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

- [Before You Start](00-before-you-start.md)
- [Prepare and Retrieve a Package](01-prepare-and-retrieve-package.md)
- [Deploy a Package](01-deploy-package.md)
- [Publish and Activate](02-publish-and-activate.md)
- [Troubleshooting](03-troubleshooting.md)
- [Final Go-Live Validation](30-final-go-live-validation.md)

Package types:

- [Service Agent](10-service-agent.md)
- [Employee Agent](11-employee-agent.md)
- [Lead Nurture Agent](12-lead-nurture-agent.md)
- [Reusable Agent Assets](13-reusable-agent-assets.md)
- [Data Cloud Data Kit](20-data-cloud-data-kit.md)
- [Enhanced Web Chat](21-enhanced-web-chat.md)

## Confirm the agent metadata model

Match the source package before deploy. Agentforce metadata differs across legacy Agent Builder, committed Builder versions, and Agent Script.

- Draft Agent Script source in `aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent`: use the Service or Employee Agent guide; then set target users/access, live preview, publish, and activate.
- Committed custom agent version: use package-specific retrieve/deploy instructions. Do not edit generated metadata; create a new target version for user or behavior changes.
- Legacy custom agent without Agent Script: use package-specific `Bot` / `BotVersion` instructions and validate in a sandbox before production.
- Managed Lead Nurturing or Sales Coach agent: use the Lead Nurturing dependencies guide and configure the managed agent directly in the target org.
- Customer-owned reusable subagent or action: use Reusable Agent Assets, add from Asset Library, preview, and publish target agent changes.

## Placeholder rule

Replace command placeholders with real values. Manifest XML uses XML-safe placeholders; raw angle-bracket placeholders inside `<members>` break XML.

## What package.xml does not carry

`package.xml` moves metadata definitions, not runtime state, secrets, or per-org users.

Finish these in the target org:

- Service Agent user setup before publish.
- Employee Agent access assignment.
- Committed agent user changes through a new target-org version or Builder setup.
- Lead Nurturing email and EAC connections.
- Asset Library selection in a target agent draft.
- Credential secrets and OAuth tokens.
- Data 360 runtime deploy and refresh.
- Enhanced Web Chat publish, CORS, and snippet/domain setup.

## Before go-live

After deploy, use [Final Go-Live Validation](30-final-go-live-validation.md). These are target-org checks, not extra `package.xml` members.

- Service Agent: agent user exists, has required access, live preview passes, agent is published and active.
- Employee Agent: access package is deployed after activation; a non-admin employee can use the agent from Lightning.
- Lead Nurturing: managed setup is enabled, agent email/EAC is connected, and Builder preview shows the expected email behavior.
- Reusable Agent Assets: target agent draft includes the asset, live-action preview passes, and target agent changes are published.
- Data 360 / Data Cloud: Data Kit components are deployed, connectors are reauthorized, data processes are refreshed, and target data is visible.
- Enhanced Web Chat: target deployment is published, the website or Experience Builder page loads the target snippet/component, and an online Omni user or active agent handles a test conversation.
