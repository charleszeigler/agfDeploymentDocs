# Publish and Activate

Use after a successful metadata deploy.

**Required before deploy:** Publishing is not a substitute for setup. Complete the target-org manual steps in the package-specific guide before publishing or activating.

## Values needed

| Value | Use |
|---|---|
| `<TARGET_ORG_ALIAS>` | Org where the agent was deployed |
| `<AGENT_API_NAME>` | Service or Employee Agent API name |
| `<SESSION_ID>` | Session ID returned by preview start |
| `<VERSION_NUMBER>` | Optional explicit version to activate |

## Service and Employee Agents

`sf project deploy` moves editable `AiAuthoringBundle` source. Publish creates a runnable version. Activate makes it available.

Validate the deployed bundle:

```bash
sf agent validate authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

Start live preview before publishing:

```bash
sf agent preview start --json --authoring-bundle <AGENT_API_NAME> --use-live-actions --target-org <TARGET_ORG_ALIAS>
```

Use live preview for deployment readiness. Simulated preview can use mock data or relaxed checks; it does not prove target-org permissions, records, flows, prompts, callouts, or Data 360 access.

Send a representative message with the returned `result.sessionId`:

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

Activating a new version sends new sessions to that version. Existing sessions can continue on the version that started them.

Smoke test the active agent:

```bash
sf agent preview start --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
sf agent preview send --json --api-name <AGENT_API_NAME> --session-id <SESSION_ID> --utterance "Test the main happy path" --target-org <TARGET_ORG_ALIAS>
sf agent preview end --json --api-name <AGENT_API_NAME> --session-id <SESSION_ID> --target-org <TARGET_ORG_ALIAS>
```

**Stop if:** Live preview fails, returns no expected data, or reports missing agent-user permissions. Fix target-org access before publishing.

**Manual after deploy:** For Employee Agents, published-agent CLI preview can fail if the session API cannot infer a user ID. If so, confirm active `BotVersion`, Agentforce user access, and `agentAccesses`, then smoke test from the Lightning Agentforce panel as a non-admin employee.

**Manual after deploy:** For clean-target Employee Agent deployments, deploy or update the permission set that contains `agentAccesses` only after publish and activation create the target `BotDefinition`.

## Lead Nurturing

Lead Nurturing managed-template agents are configured and activated in Agentforce Builder. The dependency package does not ship managed runtime.

**Manual after deploy:** Complete Lead Nurturing setup, connect the agent email account, confirm Einstein Activity Capture, configure the data library, then activate in Builder.

## Data 360

Do not publish a Data 360-dependent agent until the Data Kit is deployed and target data is refreshed.

**Data 360 prerequisite:** The target org must deploy Data Kit components, reauthorize inactive connectors, and run the required streams, mappings, identity, calculated insight, search, or data graph processes before agent live preview.

## Enhanced Web Chat

If the agent is exposed through Enhanced Web Chat, finish the Embedded Service Deployment setup after the agent is active.

**Manual after deploy:** Publish or republish the Web Chat deployment, update CORS/domain settings, verify the snippet or Embedded Messaging component, and test from the customer website or Experience Builder site.
