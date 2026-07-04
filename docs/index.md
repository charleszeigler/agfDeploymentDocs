# Agentforce Deployment Guides

Move an existing Service Agent or Employee Agent implementation from sandbox to production with Salesforce CLI.

Start with the agent guide that matches what you are moving. Each guide includes the package, retrieve, deploy, target configuration, publish, activation, and validation steps for that path. Use supporting guides only for the features your deployment includes.

## 1. Choose the agent guide

| What you are moving | Start here | Key instruction |
|---|---|---|
| Service Agent | [Deploy and Activate a Service Agent](10-service-agent.md) | Set the target-org agent user before deploying the target copy |
| Employee Agent | [Deploy and Activate an Employee Agent](11-employee-agent.md) | Deploy the agent first, then deploy user access after publish and activation |

Both paths assume Agent Script source.

## 2. Follow the guide end to end

The selected guide should be enough to run the deployment without switching pages:

1. create the package folder
2. build `package.xml` from exact source names
3. retrieve source files when needed
4. confirm the target org
5. validate and deploy
6. publish and activate the agent
7. capture go-live proof

## 3. Use supporting guides only when needed

| If your deployment includes | Use this guide | Key instruction |
|---|---|---|
| A package that does not fit one agent guide | [Package CLI Reference](deployment-workflow.md) | Use as a quick reference for package setup, member-name syntax, retrieve, validate, and deploy commands |
| Data 360 | [Deploy Data 360 for Agentforce](20-data-360-data-kit.md) | Use before any agent that depends on Data 360 data; covers data kits, search indexes, retrievers, and why the Agentforce Data Library is recreated in the target org |
| Web messaging channel | [Migrate Enhanced Web Chat](21-enhanced-web-chat.md) | Validate the metadata path in a sandbox or rebuild and publish in the target org |
