# Publish and Activate

Use this guide after a successful metadata deploy.

> **Required before deploy:** Publishing is not a substitute for setup. Complete the target-org manual steps in the package-specific guide before publishing or activating.

## Service and Employee Agents

For Service and Employee Agents, `sf project deploy` moves the editable `AiAuthoringBundle` source. It does not create a runnable active agent. Publish compiles the source into a runnable version, and activate makes that version available.

Validate the deployed bundle:

```bash
sf agent validate authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

Start live preview before publishing:

```bash
sf agent preview start --json --authoring-bundle <AGENT_API_NAME> --use-live-actions --target-org <TARGET_ORG_ALIAS>
```

Send a representative message using the returned `result.sessionId`:

```bash
sf agent preview send --json --authoring-bundle <AGENT_API_NAME> --session-id <SESSION_ID> --utterance "Test the main happy path" --target-org <TARGET_ORG_ALIAS>
```

End the preview:

```bash
sf agent preview end --json --authoring-bundle <AGENT_API_NAME> --session-id <SESSION_ID> --target-org <TARGET_ORG_ALIAS>
```

Publish:

```bash
sf agent publish authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

Activate:

```bash
sf agent activate --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

For audited rollouts, activate an explicit version:

```bash
sf agent activate --json --api-name <AGENT_API_NAME> --version <VERSION_NUMBER> --target-org <TARGET_ORG_ALIAS>
```

Smoke test the active agent:

```bash
sf agent preview start --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
sf agent preview send --json --api-name <AGENT_API_NAME> --session-id <SESSION_ID> --utterance "Test the main happy path" --target-org <TARGET_ORG_ALIAS>
sf agent preview end --json --api-name <AGENT_API_NAME> --session-id <SESSION_ID> --target-org <TARGET_ORG_ALIAS>
```

> **Stop if:** Live preview fails, returns no expected data, or reports missing agent-user permissions. Fix target-org access before publishing.

> **Manual after deploy:** For Employee Agents, the published-agent CLI preview can fail if the session API cannot infer a user ID. If that happens, confirm the `BotVersion` is active, confirm the employee has Salesforce Agentforce user access and the package permission set with `agentAccesses`, then smoke test from the Lightning Agentforce panel as an assigned non-admin employee.

> **Manual after deploy:** For clean-target Employee Agent deployments, deploy or update the permission set that contains `agentAccesses` only after publish and activation create the target `BotDefinition`.

## Lead Nurturing

Lead Nurturing managed-template agents are configured and activated in Agentforce Builder. The dependency package does not ship the managed runtime.

> **Manual after deploy:** Complete Lead Nurturing setup, connect the agent email account, confirm Einstein Activity Capture, configure the data library, then activate in Builder.

## Data 360

Do not publish an agent that depends on Data 360 until the Data Kit has been deployed and the target data is refreshed.

> **Data 360 prerequisite:** The target org must deploy Data Kit components, reauthorize inactive connectors, and run the required streams, mappings, identity, calculated insight, search, or data graph processes before agent live preview.

## Enhanced Web Chat

If the agent is exposed through Enhanced Web Chat, finish the Embedded Service Deployment setup after the agent is active.

> **Manual after deploy:** Publish or republish the Web Chat deployment, update CORS/domain settings, verify the snippet or Embedded Messaging component, and test from the customer website or Experience Builder site.
