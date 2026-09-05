# Deploy and Activate a Service Agent

Move an Agentforce Service Agent from a Full or Partial Copy work org to production.

## When this applies

| Field | Value |
|---|---|
| Source metadata | `force-app/main/default/aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent` |
| Agent type | `AgentforceServiceAgent` |
| Running user | Dedicated target-org Einstein Agent User |
| Agent access | `default_agent_user` is required under `access:` and must use the target-org username |
| Publish path | Deploy source, live preview, publish, activate |

## Deployment order

When this Service Agent also uses Data 360 or Enhanced Web Chat, keep this order:

1. Data 360 provisioned and data spaces created. Provision can take up to 60 minutes; finish it before Agentforce enablement.
2. DevOps Data Kit metadata package deploy.
3. Data Kit component deploy, connector reauthorization, and data refresh.
4. Service Agent package deploy.
5. Live preview.
6. Publish and activate.
7. Enhanced Web Chat rebuild and publish, if used.

**Stop if:** The agent depends on Data 360 and the target data is not refreshed. Do not deploy or preview the agent yet.

## Authoring bundle states

Salesforce documents draft, committed, and versioned representations in [Retrieve and deploy Agentforce metadata](https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-deploy-metadata.html):

| State | Metadata | Editable |
|---|---|---|
| Draft (uncommitted) | `AiAuthoringBundle` | Yes |
| Committed | `AiAuthoringBundle`, `Bot`, `BotVersion` | No. Create a new version |
| Legacy agent | `Bot`, `BotVersion` | n/a |

This guide deploys `AiAuthoringBundle` only, then publishes and activates in the target org. That remains the recommended path. Do not add `Bot` or `BotVersion` to the package unless that is the actual retrieved state you intend to deploy. If you saved more bundle versions than you committed, the `AiAuthoringBundle` version can differ from `Bot`/`BotVersion`.

If the source AND target org are both on API 68.0+ (Winter '27), retrieve and deploy `AiAgentDefinition`/`AiAgentDefinitionVersion` instead — see [Move an Agent with AiAgentDefinition](14-agent-dx-v68-metadata.md). Never mix that path with `AiAuthoringBundle`/`Bot`/`GenAiPlannerBundle` in the same deploy.

## Create the package folder

Create or open one Salesforce DX project folder for this package:

Generate the staging project:

```bash
sf template generate project --name deploy-service-agent --template empty --default-package-dir force-app --api-version 67.0
```

Create the manifest folder:

```bash
mkdir -p deploy-service-agent/manifest
```

```text
deploy-service-agent/
+-- sfdx-project.json
+-- manifest/
|   +-- package.xml
+-- force-app/main/default/
```

Generated `sfdx-project.json` is local CLI config (not deployed). Keep an existing project’s file. `sourceApiVersion` should be `67.0` unless a generated Data Kit manifest says otherwise.

Copy `manifests/service-agent-package.xml` to `manifest/package.xml`; replace XML-safe placeholders with real API names and remove unused blocks. The template is not retrieve-ready or deploy-ready if copied blindly. Use [Build package.xml from exact source names](deployment-workflow.md#2-build-packagexml-from-exact-source-names) for member-name formats. Summer ’26 Metadata API is 67.0. Use 67.0 unless a generated Data Kit manifest or current Agentforce DX example says otherwise.

## Prepare the package

Include referenced dependencies:

| Dependency | Metadata type |
|---|---|
| Agent Script bundle | `AiAuthoringBundle` |
| Invocable Apex actions and tests | `ApexClass` |
| Flow actions | `Flow` |
| Prompt templates | `GenAiPromptTemplate` |
| Structured custom action schemas, if the agent uses Custom Lightning Types | `LightningTypeBundle` |
| Custom Lightning Type editor or renderer components, if used by those schemas | `LightningComponentBundle` |
| Objects and fields | `CustomObject`, `CustomField` |
| Agent user access | `PermissionSet` |
| Callout definitions | `NamedCredential`, `ExternalCredential` |

Package the access metadata, not the `User` record.

Start with only the `AiAuthoringBundle` member if the agent's dependencies are not known. Retrieve the agent source first, inspect the `.agent` file for `apex://`, `flow://`, `prompt://`, `generatePromptResponse://`, `complex_data_type_name`, and named-credential names when used, then add only confirmed dependencies to `package.xml`.

## Retrieve and complete the package

Authenticate the source alias if needed, then confirm it is the expected sandbox:

```bash
sf org login web --json --alias <SOURCE_ORG_ALIAS> --instance-url https://test.salesforce.com
sf org display --json --target-org <SOURCE_ORG_ALIAS>
```

Confirm the source bundle exists:

```bash
sf org list metadata --json --metadata-type AiAuthoringBundle --target-org <SOURCE_ORG_ALIAS>
```

Retrieve the first package:

```bash
sf project retrieve start --json --manifest manifest/package.xml --target-org <SOURCE_ORG_ALIAS>
```

Confirm the retrieve result is `Succeeded`.

Identify action targets in the retrieved source bundle:

1. Open `force-app/main/default/aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent`.
2. Search in the file for `apex://` and add every referenced Apex class.
3. Search in the file for `flow://` and add every referenced Flow.
4. Search in the file for `prompt://` and `generatePromptResponse://` and add every referenced prompt template.
5. Search in the file for `complex_data_type_name` and add Custom Lightning Types and their editor or renderer LWCs when used.
6. Search retrieved Apex, Flow, and prompt files for named credential or external credential API names when the source uses callouts.

Also add referenced objects, fields, and permission sets only when the source uses them.

Retrieve again after updating `package.xml`:

```bash
sf project retrieve start --json --manifest manifest/package.xml --target-org <SOURCE_ORG_ALIAS>
```

Review the package before deploy:

- Every `package.xml` member has a matching file under `force-app/main/default`.
- The package contains only the Service Agent and its dependencies.
- The package does not contain source-org usernames, website domains, generated Web Chat snippets, credential secrets, OAuth tokens, connector auth, or runtime state.

## Validate in the source sandbox

Confirm the source bundle is visible in the source sandbox:

```bash
sf org list metadata --json --metadata-type AiAuthoringBundle --target-org <SOURCE_ORG_ALIAS>
```

Validate the source bundle:

```bash
sf agent validate authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <SOURCE_ORG_ALIAS>
```

Fix validation errors before handoff.

## Confirm the target org

Authenticate the target alias if needed, then confirm it is the expected org. Use `https://login.salesforce.com` for production or `https://test.salesforce.com` for a sandbox:

```bash
sf org login web --json --alias <TARGET_ORG_ALIAS> --instance-url https://login.salesforce.com
sf org display --json --target-org <TARGET_ORG_ALIAS>
```

Confirm Agentforce authoring bundle metadata is available in the target org:

```bash
sf org list metadata --json --metadata-type AiAuthoringBundle --target-org <TARGET_ORG_ALIAS>
```

**Stop if:** The target org command returns `INVALID_TYPE` or `Not available for deploy for this organization`. Enable and provision Agentforce for the target org before continuing.

## Set the target agent user

Complete this section before deploying the target copy of the agent source. The target user record is org-specific configuration; the deployable `.agent` source references it by username.

A Service Agent runs as a Salesforce user in the target org. Use an existing Einstein Agent User or create one.

Create one with CLI if needed:

```bash
sf org create agent-user --json --target-org <TARGET_ORG_ALIAS>
```

Copy the username from `result.username`. If you use an existing Einstein Agent User instead, copy the `Username` value from that target-org user record and confirm it has the Salesforce-provided sets that `sf org create agent-user` assigns: `AgentforceServiceAgentBase`, `AgentforceServiceAgentUser`, and `EinsteinGPTPromptTemplateUser`.

Before deploying the `.agent` file to the target org, set `default_agent_user` to that target-org username. Official [Agent Script Blocks](https://developer.salesforce.com/docs/ai/agentforce/guide/ascript-blocks.html) put this field under `access:`, not `config:` (`config.default_agent_user` is deprecated). CLI help that still says `config.default_agent_user` is stale. Use the username, not the User record ID.

```text
access:
    default_agent_user: "agent.user@example.com"
```

Sandbox refreshes and production orgs use different usernames. Replace any source-sandbox username before deploy.

Official retrieve/deploy guidance is: do not modify retrieved metadata (uploading edited metadata can corrupt the org). The documented exception is string-replacing the agent username on a draft bundle. You cannot string-replace a committed agent's username; create a new version instead.

Validate the local bundle against the target org:

```bash
sf agent validate authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

**Stop if:** The package still contains a source-sandbox agent username. Replace it before deploy.

## Data 360 DevOps Data Kit

If this Service Agent uses Data 360 data, complete [Deploy a Data 360 DevOps Data Kit](20-data-360-data-kit.md) before deploying the agent package.

Confirm the target Data 360 components are deployed, connector access is reauthorized, required data is refreshed, and the agent user has the Data 360 access required by the agent.

If the agent grounds on an Agentforce Data Library, recreate it in the target org — it is not deployed. Recreating it provisions a new search index and retriever in that org. Do not expect a Data Kit to move the library’s generated Pro-code/ADL retriever. Same-data-space is the intended path. Re-point a prompt template only if a no-code retriever API name changed during recovery. See [Deploy a Data 360 DevOps Data Kit](20-data-360-data-kit.md#what-does-not-move-the-agentforce-data-library).

**Stop if:** The agent depends on Data 360 and the target data space does not match the source, or target data is not refreshed.

## Deploy the package

Retrieve from the Full or Partial Copy work org. Dress-rehearse on a fresh Developer sandbox before production. Commands match [Validate and deploy](deployment-workflow.md#4-validate-and-deploy).

**Stop if:** The rehearsal org already contains this package, agent, prompt templates, or Data Kit from a prior attempt. Provision Agentforce and Einstein in the rehearsal org.

```bash
sf project deploy start --json --manifest manifest/package.xml --target-org <REHEARSAL_ORG_ALIAS> --test-level RunLocalTests --wait 30
```

Continue only after the deploy result is `Succeeded`. If Apex is in the package, confirm tests ran.

Optional: `sf project deploy start --dry-run` is a syntax check. It does not save and does not count as rehearsal.

Production deploys must run Apex tests. Validate first:

```bash
sf project deploy validate --json --manifest manifest/package.xml --target-org <TARGET_ORG_ALIAS> --test-level RunLocalTests --wait 30
```

If validation succeeds, copy `result.id` and quick deploy:

```bash
sf project deploy quick --json --job-id <JOB_ID_FROM_VALIDATE> --target-org <TARGET_ORG_ALIAS> --wait 30
```

## Assign custom access to the agent user

Assign the custom access permission set shipped with the package:

```bash
sf org assign permset --json --name AGENT_ACCESS_PERMISSION_SET_API_NAME --on-behalf-of <AGENT_USER_USERNAME> --target-org <TARGET_ORG_ALIAS>
```

The custom permission set must cover the agent's Apex, Flows, prompt templates, objects, fields, and callouts.

After deploy, confirm record sharing. If Apex uses sharing or user-mode access, confirm the agent user can see the target records.

## Preview, publish, activate

Who runs what: live preview needs the Agent Platform Builder system permission. Publish needs Modify All Data and Manage AI Agents. Assign those system permissions with a permission set if the runner is not a system administrator.

Validate the deployed bundle:

```bash
sf agent validate authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

Start live preview before publishing:

```bash
sf agent preview start --json --authoring-bundle <AGENT_API_NAME> --use-live-actions --target-org <TARGET_ORG_ALIAS>
```

Send a representative message with the returned `result.sessionId`:

```bash
sf agent preview send --json --authoring-bundle <AGENT_API_NAME> --session-id <SESSION_ID> --utterance "Test the main happy path" --target-org <TARGET_ORG_ALIAS>
```

End the preview:

```bash
sf agent preview end --json --authoring-bundle <AGENT_API_NAME> --session-id <SESSION_ID> --target-org <TARGET_ORG_ALIAS>
```

**Stop if:** Live preview fails, returns no expected data, or reports missing agent-user permissions. Fix target-org access before publishing.

Publish:

```bash
sf agent publish authoring-bundle --json --api-name <AGENT_API_NAME> --skip-retrieve --target-org <TARGET_ORG_ALIAS>
```

`--skip-retrieve` keeps published `Bot` / `BotVersion` / planner files out of the local project.

Activate:

```bash
sf agent activate --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

With `--json` and no `--version`, the CLI activates the latest published version automatically.

Smoke test the active agent:

Start a published-agent preview session:

```bash
sf agent preview start --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

Send a representative message with the returned `result.sessionId`:

```bash
sf agent preview send --json --api-name <AGENT_API_NAME> --session-id <SESSION_ID> --utterance "Test the main happy path" --target-org <TARGET_ORG_ALIAS>
```

End the preview session:

```bash
sf agent preview end --json --api-name <AGENT_API_NAME> --session-id <SESSION_ID> --target-org <TARGET_ORG_ALIAS>
```

To roll back a bad version, reactivate the prior known-good version:

```bash
sf agent activate --json --api-name <AGENT_API_NAME> --version <PRIOR_VERSION_NUMBER> --target-org <TARGET_ORG_ALIAS>
```

`sf agent deactivate` exists when you need to take the current version offline before a swap:

```bash
sf agent deactivate --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

## Web messaging channel

To deploy this Service Agent to a web messaging channel, complete [Migrate Enhanced Web Chat](21-enhanced-web-chat.md) after the agent is active.

## Checklist

- [ ] Agent API name replaced everywhere.
- [ ] Every `apex://`, `flow://`, `prompt://`, `generatePromptResponse://`, `complex_data_type_name`, named-credential, object, field, and permission dependency is included when used.
- [ ] Test classes are included for production deploys.
- [ ] Real deploy to a fresh Developer sandbox with `RunLocalTests` succeeded before production. `--dry-run` is not rehearsal.
- [ ] Target agent user is active, licensed, and assigned `AgentforceServiceAgentBase`, `AgentforceServiceAgentUser`, and `EinsteinGPTPromptTemplateUser` (or the org's current equivalents).
- [ ] `access.default_agent_user` uses the target-org username.
- [ ] Custom permission set `AGENT_ACCESS_PERMISSION_SET_API_NAME` assigned to the agent user.
- [ ] Data 360 DevOps Data Kit completed before the agent package, if used.
- [ ] Live-action preview passes before publish.
- [ ] Active-agent smoke test passes after activation.
- [ ] Go-live proof saved for this target org: deploy job ID or Deployment Status screenshot, Apex test summary when Apex was included, live-preview `sessionId`, and published-agent smoke-test `sessionId`. See [Capture go-live proof](deployment-workflow.md#5-capture-go-live-proof).
- [ ] If a step fails, use [Troubleshooting](03-troubleshooting.md).

## Sources

- Retrieve and deploy Agentforce metadata: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-deploy-metadata.html
- Agentforce metadata types: https://developer.salesforce.com/docs/ai/agentforce/references/agents-metadata-tooling/agents-metadata.html
- Agent Script Blocks (`access.default_agent_user`): https://developer.salesforce.com/docs/ai/agentforce/guide/ascript-blocks.html
- Set Up Your DX Environment (Data 360 provision timing, preview/publish permissions, `sf org create agent-user` permission sets): https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-set-up-env.html
