# Agentforce Deployment Guides

Move an existing Agentforce implementation from sandbox to production with Salesforce CLI.

Start with the agent guide that matches what you are moving. Each primary guide includes the package, retrieve, deploy, target configuration, and validation steps for that path. Use additional guides only for the features your deployment includes.

## 1. Choose the agent guide

| What you are moving | Start here | Key instruction |
|---|---|---|
| Service Agent | [Deploy and Activate a Service Agent](10-service-agent.md) | Confirm or create the target agent user before publish |
| Employee Agent | [Deploy and Activate an Employee Agent](11-employee-agent.md) | Deploy the agent first, then deploy user access after publish and activation |
| Lead Nurture Agent | [Deploy Lead Nurture Agent Dependencies](12-lead-nurture-agent.md) | Package only custom dependencies; configure the agent in the target org |

Service Agent and Employee Agent paths assume Agent Script source. Lead Nurture Agent is the exception: package only custom dependencies and finish agent configuration in the target org.

## 2. Follow that guide end to end

The primary guide should be enough to run the deployment without switching pages:

1. create the package folder
2. retrieve source files when needed
3. confirm the target org
4. validate and deploy
5. publish and activate Service or Employee Agents, or configure Lead Nurture Agent in the target org
6. capture go-live proof

## 3. Use additional guides only when needed

| If your deployment includes | Use this guide | Key instruction |
|---|---|---|
| A package that does not fit one agent guide | [Deploy a Package](deployment-workflow.md) | Use as a CLI reference for retrieve, validate, deploy, publish, and activate commands |
| Data 360 | [Deploy a Data 360 Data Kit](20-data-360-data-kit.md) | Use before any agent that depends on Data 360 data; keep the Data Kit package separate |
| Web messaging channel | [Migrate Enhanced Web Chat](21-enhanced-web-chat.md) | Validate the metadata path in a sandbox or rebuild and publish in the target org |
| Legacy Agent Actions | [Legacy Agent Actions](13-legacy-agent-actions.md) | Deploy standalone `GenAiFunction` / `GenAiPlugin` metadata, then add actions from Asset Library |

## If something fails

Use [Troubleshooting](03-troubleshooting.md). Stop on failed validation, missing target access, inactive Data 360 runtime, unapproved Lead Nurture Agent email behavior, or web messaging tests that do not create a target `MessagingSession`.
