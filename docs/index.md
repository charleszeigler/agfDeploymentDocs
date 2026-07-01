# Agentforce Deployment Guides

Move an existing Agentforce implementation from sandbox to production with Salesforce CLI.

Start by choosing the package type. Service and Employee Agent paths assume Agent Script. Lead Nurture Agent is the exception: package only custom dependencies and finish setup in the target org.

## Choose your path

| Package or feature | Use this guide | Key instruction |
|---|---|---|
| Service Agent | [Deploy and Activate a Service Agent](10-service-agent.md) | Confirm or create the target agent user before publish |
| Employee Agent | [Deploy and Activate an Employee Agent](11-employee-agent.md) | Deploy the agent first, then deploy user access after publish and activation |
| Lead Nurture Agent | [Deploy Lead Nurture Agent Dependencies](12-lead-nurture-agent.md) | Package only custom dependencies; configure the agent in the target org |
| Legacy Agent Actions | [Legacy Agent Actions](13-legacy-agent-actions.md) | Deploy standalone `GenAiFunction` / `GenAiPlugin` metadata, then add actions from Asset Library |
| Data 360 / Data Cloud | [Deploy a Data Cloud Data Kit](20-data-cloud-data-kit.md) | Use the source Data Kit generated manifest; keep the Data Kit package separate |
| Enhanced Web Chat / Messaging | [Migrate Enhanced Web Chat](21-enhanced-web-chat.md) | Validate the metadata path in a sandbox or rebuild and publish in the target org |

## Follow the sequence

1. [Before You Start](00-before-you-start.md): confirm the target org, CLI auth, Agentforce readiness, and Data 360 readiness when used.
2. Build the package-specific `package.xml` from the selected path. Templates live in the repo-level `manifests/` directory; copy the selected template into the package's `manifest/` folder.
3. [Prepare and Retrieve a Package](01-prepare-and-retrieve-package.md) when source files need to be pulled from a sandbox.
4. [Deploy a Package](01-deploy-package.md): validate first, then deploy or quick deploy.
5. Complete target-org setup in the selected path.
6. [Publish and Activate](02-publish-and-activate.md) when deploying or changing a Service or Employee Agent.
7. [Final Go-Live Validation](30-final-go-live-validation.md): capture runtime proof before handoff.

## If something fails

Use [Troubleshooting](03-troubleshooting.md). Stop on failed validation, missing target access, inactive Data 360 runtime, unapproved Lead Nurture Agent email setup, or Web Chat tests that do not create a target `MessagingSession`.
