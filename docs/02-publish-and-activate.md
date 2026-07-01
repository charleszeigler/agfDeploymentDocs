# Publish and Activate

Use after a successful metadata deploy.

**Required before publish:** Publishing is not a substitute for setup. Complete the target-org manual steps in the package-specific guide before publishing or activating.

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

With `--json` and no `--version`, the CLI activates the latest published version automatically.

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

## Roll Back an Agent Version

If the new active version misbehaves in production, reactivate the prior known-good version:

```bash
sf agent activate --json --api-name <AGENT_API_NAME> --version <PRIOR_VERSION_NUMBER> --target-org <TARGET_ORG_ALIAS>
```

Capture the active version, prior version, preview or runtime session IDs, failing utterances, and deployment job ID for support. Deactivate the agent only when no version should be available to users.

## Related post-deploy paths

Complete the guide that matches the package before go-live.

| If the deployment includes | Continue with | Finish before go-live |
|---|---|---|
| Lead Nurture Agent dependencies | [Deploy Lead Nurture Agent Dependencies](12-lead-nurture-agent.md) | Target Lead Nurture Agent setup, email/EAC, data library, Builder preview, and activation |
| Data 360 / Data Cloud | [Deploy a Data Cloud Data Kit](20-data-cloud-data-kit.md) | Data Kit component deploy, connector reauthorization, and target data refresh before agent live preview |
| Enhanced Web Chat or Messaging | [Migrate Enhanced Web Chat](21-enhanced-web-chat.md) | Target deployment publish, domain setup, snippet or component setup, and website or Experience Builder conversation test |

In all cases, finish with [Final Go-Live Validation](30-final-go-live-validation.md).
