# Agentforce Deployment Guides

Move an existing Agentforce implementation from sandbox to production with Salesforce CLI.

Start by choosing the package type. Each path tells you what to put in `package.xml`, what to retrieve, what to deploy, and which target-org setup remains manual.

## Choose Your Path

| What are you moving? | Use this guide | Key instruction |
|---|---|---|
| Service Agent source in `aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent` | [Deploy and Activate a Service Agent](10-service-agent.md) | Confirm or create the target agent user before publish |
| Employee Agent source in `aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent` | [Deploy and Activate an Employee Agent](11-employee-agent.md) | Deploy source first, then deploy user access after publish and activation |
| Managed Lead Nurturing setup or dependencies | [Deploy Lead Nurture Agent Dependencies](12-lead-nurture-agent.md) | Package only project-owned dependencies; configure the managed agent in the target org |
| Legacy Agent Builder or committed Builder actions | [Legacy Agent Actions](13-legacy-agent-actions.md) | Move standalone `GenAiFunction` / `GenAiPlugin` assets, then add them from Asset Library |
| Data 360 / Data Cloud assets | [Deploy a Data Cloud Data Kit](20-data-cloud-data-kit.md) | Use the source Data Kit generated manifest; keep the Data Kit package separate |
| Enhanced Web Chat or Messaging setup | [Migrate Enhanced Web Chat](21-enhanced-web-chat.md) | Validate the metadata path in a sandbox or rebuild and publish in the target org |

## Follow the Sequence

1. [Before You Start](00-before-you-start.md): confirm the target org, CLI auth, Agentforce readiness, and Data 360 readiness when used.
2. Build the package-specific `package.xml` from the selected path.
3. [Prepare and Retrieve a Package](01-prepare-and-retrieve-package.md) when source files need to be pulled from a sandbox.
4. [Deploy a Package](01-deploy-package.md): validate first, then deploy or quick deploy.
5. Complete target-org setup in the selected path.
6. [Publish and Activate](02-publish-and-activate.md) when deploying or changing Service or Employee Agent source.
7. [Final Go-Live Validation](30-final-go-live-validation.md): capture runtime proof before handoff.

## If Something Fails

Use [Troubleshooting](03-troubleshooting.md). Stop on failed validation, missing target access, inactive Data 360 runtime, unapproved Lead Nurturing email setup, or Web Chat tests that do not create a target `MessagingSession`.
