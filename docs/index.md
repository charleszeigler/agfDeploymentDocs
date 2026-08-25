# Agentforce Deployment Guides

Move an existing Agentforce implementation from sandbox to production with Salesforce CLI.

Start with the agent guide that matches what you are moving. Service Agent and Employee Agent guides include the package, retrieve, deploy, target configuration, publish, activation, and validation steps for that path. Lead Nurture Agent is an agent path that deploys custom dependencies only. Use supporting guides only for the features your deployment includes.

## 1. Choose the agent guide

| What you are moving | Start here | Key instruction |
|---|---|---|
| Service Agent | [Deploy and Activate a Service Agent](10-service-agent.md) | Set `access.default_agent_user` to the target-org username before deploying the target copy |
| Employee Agent | [Deploy and Activate an Employee Agent](11-employee-agent.md) | Deploy the agent first, then deploy user access after publish and activation |
| Lead Nurture Agent | [Deploy Lead Nurture Agent Dependencies](12-lead-nurture-agent.md) | Deploy custom dependencies only. Do not deploy Lead Nurture Agent itself |

Service Agent and Employee Agent assume Agent Script source. Lead Nurture Agent is configured in the target org after its dependencies deploy.

## 2. Follow the guide end to end

The selected guide should be enough to run the deployment without switching pages:

1. create the package folder
2. build `package.xml` from exact source names
3. retrieve source files when needed
4. confirm the target org
5. validate and deploy
6. publish and activate the agent, or configure Lead Nurture Agent in the target org
7. capture go-live proof

If retrieve, deploy, preview, publish, Data 360, email, or web messaging fails, use [Troubleshooting](03-troubleshooting.md).

## 3. Use supporting guides only when needed

| If your deployment includes | Use this guide | Key instruction |
|---|---|---|
| A package that does not fit one agent guide | [Package CLI Reference](deployment-workflow.md) | Shared CLI reference for package setup, member-name syntax, retrieve, validate, and deploy. Not a substitute for guides 10, 11, or 12 |
| A staged CLI coordinator | [Build a staged Agentforce deploy script](30-deployment-script.md) | Copy `templates/deploy.mjs`, fill env, keep the phase names. Not a substitute for guides 10, 11, or 12 |
| Legacy Agent Builder or Asset Library actions | [Legacy Agent Actions](13-legacy-agent-actions.md) | Supporting path for custom `GenAiFunction` actions. Does not move an Agent Script agent or Lead Nurture Agent |
| Data 360 | [Deploy a Data 360 DevOps Data Kit](20-data-360-data-kit.md) | Complete Data 360 provision, DevOps Data Kit metadata, component deploy, and refresh before any agent that depends on Data 360 data |
| Web messaging channel | [Migrate Enhanced Web Chat](21-enhanced-web-chat.md) | Rebuild and publish in the target org. This guide is Enhanced Chat / Messaging for In-App and Web only |
| A failed retrieve, deploy, preview, or runtime check | [Troubleshooting](03-troubleshooting.md) | Symptom table for package, agent, Lead Nurture, Data 360, and Enhanced Web Chat failures |
