# Deploy and Activate a Service Agent

Move an Agentforce Service Agent from sandbox to production.

**Required before deploy:** A Service Agent runs as a dedicated Einstein Agent User. The target-org agent username is a per-org value and must be set before publish.

## When this applies

| Field | Value |
|---|---|
| Source metadata | `force-app/main/default/aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent` |
| Agent type | `AgentforceServiceAgent` |
| Running user | `default_agent_user` is required |
| Publish path | Deploy source, live preview, publish, activate |

## Create the package folder

Create or open one Salesforce DX project folder for this package:

```text
deploy-service-agent/
+-- sfdx-project.json
+-- manifest/
|   +-- package.xml
+-- force-app/main/default/
```

Use this minimal `sfdx-project.json`:

```json
{
  "packageDirectories": [
    {
      "path": "force-app",
      "default": true
    }
  ],
  "name": "service-agent-deploy-package",
  "sourceApiVersion": "66.0"
}
```

Copy `manifests/service-agent-package.xml` to `manifest/package.xml`; replace XML-safe placeholders with real API names and remove unused blocks.

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

Package the access metadata, not the `User` record. Create or select the agent user in the target org.

## Retrieve and complete the package

Log in to the source sandbox and confirm the org:

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
2. Search in the file for `apex://`.
3. Search in the file for `flow://`.
4. Add every referenced Apex class and Flow to the package manifest.

Also add referenced prompt templates, objects, fields, permission sets, credentials, and Custom Lightning Types only when the source uses them.

Retrieve again after updating `package.xml`:

```bash
sf project retrieve start --json --manifest manifest/package.xml --target-org <SOURCE_ORG_ALIAS>
```

Review the package before deploy:

- Every `package.xml` member has a matching file under `force-app/main/default`.
- The package contains only the Service Agent and its dependencies.
- The package does not contain source-org usernames, website domains, generated Web Chat snippets, credential secrets, OAuth tokens, connector auth, or runtime state.

## Validate in the source sandbox

```bash
sf org list metadata --json --metadata-type AiAuthoringBundle --target-org <SOURCE_ORG_ALIAS>
sf agent validate authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <SOURCE_ORG_ALIAS>
```

Fix validation errors before handoff.

## Set the target agent user

Log in to the target org and confirm the org. Use `https://login.salesforce.com` for production or `https://test.salesforce.com` for a sandbox.

```bash
sf org login web --json --alias <TARGET_ORG_ALIAS> --instance-url https://login.salesforce.com
sf org display --json --target-org <TARGET_ORG_ALIAS>
sf org list metadata --json --metadata-type AiAuthoringBundle --target-org <TARGET_ORG_ALIAS>
```

**Stop if:** The target org command returns `INVALID_TYPE` or `Not available for deploy for this organization`. Enable and provision Agentforce for the target org before continuing.

A Service Agent runs as a Salesforce user in the target org. Use an existing Einstein Agent User or create one.

Create one with CLI if needed:

```bash
sf org create agent-user --json --target-org <TARGET_ORG_ALIAS>
```

Copy the username from `result.username`. If you use an existing user instead, copy the `Username` value from that target-org user record.

In the `.agent` file you will deploy to the target org, set `default_agent_user` to that target-org username. Use the username, not the User record ID.

```text
config:
    default_agent_user: "agent.user@example.com"
```

Sandbox refreshes and production orgs use different usernames. Replace any source-sandbox username before deploy.

Validate the local bundle against the target org:

```bash
sf agent validate authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

**Stop if:** The package still contains a source-sandbox agent username. Replace it before deploy.

## Deploy the package

Production deploys must run Apex tests. Validate first:

```bash
sf project deploy validate --json --manifest manifest/package.xml --target-org <TARGET_ORG_ALIAS> --test-level RunLocalTests --wait 30
```

If validation succeeds, copy `result.id` and quick deploy:

```bash
sf project deploy quick --json --job-id <JOB_ID_FROM_VALIDATE> --target-org <TARGET_ORG_ALIAS> --wait 30
```

For sandbox validation, run a dry run first. If your sandbox release policy requires tests, replace `NoTestRun` with `RunLocalTests`.

```bash
sf project deploy start --json --dry-run --manifest manifest/package.xml --target-org <TARGET_ORG_ALIAS> --test-level NoTestRun --wait 30
```

If the dry run succeeds:

```bash
sf project deploy start --json --manifest manifest/package.xml --target-org <TARGET_ORG_ALIAS> --test-level NoTestRun --wait 30
```

Continue only after the deploy result is `Succeeded`.

## Assign custom access to the agent user

Assign the custom access permission set shipped with the package:

```bash
sf org assign permset --json --name Service_Agent_Access --on-behalf-of <AGENT_USER_USERNAME> --target-org <TARGET_ORG_ALIAS>
```

The custom permission set must cover the agent's Apex, Flows, prompt templates, objects, fields, and callouts.

After deploy, confirm record sharing. If Apex uses sharing or user-mode access, confirm the agent user can see the target records.

## Data 360 Data Kit

If this Service Agent uses Data 360 data, complete [Deploy a Data 360 Data Kit](20-data-360-data-kit.md) before live preview and publish.

Confirm the target Data 360 components are deployed, connector access is reauthorized, required data is refreshed, and the agent user has the Data 360 access required by the agent.

## Preview, publish, activate

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
sf agent publish authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

Activate:

```bash
sf agent activate --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

With `--json` and no `--version`, the CLI activates the latest published version automatically.

Smoke test the active agent:

```bash
sf agent preview start --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
sf agent preview send --json --api-name <AGENT_API_NAME> --session-id <SESSION_ID> --utterance "Test the main happy path" --target-org <TARGET_ORG_ALIAS>
sf agent preview end --json --api-name <AGENT_API_NAME> --session-id <SESSION_ID> --target-org <TARGET_ORG_ALIAS>
```

To roll back a bad version, reactivate the prior known-good version:

```bash
sf agent activate --json --api-name <AGENT_API_NAME> --version <PRIOR_VERSION_NUMBER> --target-org <TARGET_ORG_ALIAS>
```

## Web messaging channel

To deploy this Service Agent to a web messaging channel, complete [Migrate Enhanced Web Chat](21-enhanced-web-chat.md) after the agent is active.

## Checklist

- [ ] Agent API name replaced everywhere.
- [ ] Every `apex://`, `flow://`, prompt template, object, field, permission, and applicable Custom Lightning Type dependency is included.
- [ ] Test classes are included for production deploys.
- [ ] Target agent user is active, licensed, and assigned base Agentforce permissions.
- [ ] `default_agent_user` uses the target-org username.
- [ ] Custom permission set assigned to the agent user.
- [ ] Data 360 Data Kit completed before live preview and publish, if used.
- [ ] Live-action preview passes before publish.
- [ ] Active-agent smoke test passes after activation.

## Sources

- Retrieve and deploy Agentforce metadata: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-deploy-metadata.html
- Agentforce metadata types: https://developer.salesforce.com/docs/ai/agentforce/references/agents-metadata-tooling/agents-metadata.html
