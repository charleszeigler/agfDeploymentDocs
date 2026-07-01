# Agentforce Deployment Guides

Move an existing Agentforce implementation from sandbox to production with Salesforce CLI.

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

## Choose the right package path

Match the source package before deploy. Agentforce metadata differs across Agent Script, managed setup, legacy actions, Data 360, and Web Chat.

| Source package has | Use |
|---|---|
| Agent Script source in `aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent` | Service Agent or Employee Agent guide |
| Managed Lead Nurturing setup | Lead Nurturing dependencies guide; configure the managed agent in the target org |
| Legacy Agent Builder or committed Builder actions | Legacy Agent Actions guide |
| Data 360 / Data Cloud assets | Data Cloud Data Kit guide |
| Enhanced Web Chat or Messaging setup | Enhanced Web Chat guide |
