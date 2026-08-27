# Agentforce Deployment Guides

Move an existing Agentforce implementation from a Full or Partial Copy work org to production with Salesforce CLI. Dress-rehearse with a real deploy to a fresh Developer sandbox, then production `validate` and `quick`.

This repo uses Salesforce CLI. It does not set up Salesforce DevOps Center. A **DevOps Data Kit** is the Data 360 metadata package. It is not DevOps Center.

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
3. retrieve source files from the Full or Partial Copy work org
4. dress-rehearse with a real deploy to a fresh Developer sandbox (`RunLocalTests`). `--dry-run` is not rehearsal
5. confirm the production org
6. validate and quick-deploy to production
7. publish and activate the agent, or configure Lead Nurture Agent in the target org
8. capture go-live proof

If retrieve, deploy, preview, publish, Data 360, email, or web messaging fails, use [Troubleshooting](03-troubleshooting.md).

## 3. Use supporting guides only when needed

| If your deployment includes | Use this guide | Key instruction |
|---|---|---|
| A package that does not fit one agent guide | [Package CLI Reference](deployment-workflow.md) | Shared CLI reference for package setup, member-name syntax, retrieve, validate, and deploy. Not a substitute for guides 10, 11, or 12 |
| A staged CLI coordinator | [Build a staged Agentforce deploy script](30-deployment-script.md) | Copy `templates/deploy.mjs`, fill env, keep the phase names. Not a substitute for guides 10, 11, or 12 |
| Legacy Agent Builder or Asset Library actions | [Legacy Agent Actions](13-legacy-agent-actions.md) | Supporting path for custom `GenAiFunction` actions. Does not move an Agent Script agent or Lead Nurture Agent |
| Source AND target org both already on API 68.0+ (Winter '27) | [Move an Agent with AiAgentDefinition](14-agent-dx-v68-metadata.md) | Additive alternative to `AiAuthoringBundle`/`Bot`/`GenAiPlannerBundle`. One retrieve resolves the whole dependency graph; still set the target agent user before deploy |
| Data 360 | [Deploy a Data 360 DevOps Data Kit](20-data-360-data-kit.md) | Complete Data 360 provision, DevOps Data Kit metadata, component deploy, and refresh before any agent that depends on Data 360 data |
| Web messaging channel | [Migrate Enhanced Web Chat](21-enhanced-web-chat.md) | Rebuild and publish in the target org. This guide is Enhanced Chat / Messaging for In-App and Web only |
| A failed retrieve, deploy, preview, or runtime check | [Troubleshooting](03-troubleshooting.md) | Symptom table for package, agent, Lead Nurture, Data 360, and Enhanced Web Chat failures |
