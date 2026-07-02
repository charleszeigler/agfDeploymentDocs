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

1. Open the guide for the package type you are moving.
2. Build the package-specific `package.xml` from the selected path. Templates live in the repo-level `manifests/` directory; copy the selected template into the package's `manifest/` folder.
3. Use [Deploy a Package](deployment-workflow.md) for the common CLI steps: retrieve source when needed, confirm the target org, validate, deploy, and publish Service or Employee Agents.
4. Complete any package-specific target setup called out in the selected guide.

## If something fails

Use [Troubleshooting](03-troubleshooting.md). Stop on failed validation, missing target access, inactive Data 360 runtime, unapproved Lead Nurture Agent email setup, or Web Chat tests that do not create a target `MessagingSession`.
