# Deploy and Activate an Employee Agent

Move an employee-facing Agentforce Employee Agent from sandbox to production.

## When this applies

| Field | Value |
|---|---|
| Source metadata | `force-app/main/default/aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent` |
| Agent type | `AgentforceEmployeeAgent` |
| Running user | Logged-in employee |
| Agent access | Omit `default_agent_user` from `access:` and `config:` |
| Publish path | Deploy source, live preview, publish, activate |

## Deployment order

When this Employee Agent also uses Data 360, keep this order:

1. Data 360 provisioned and data spaces created. Provision can take up to 60 minutes; finish it before Agentforce enablement.
2. DevOps Data Kit metadata package deploy.
3. Data Kit component deploy, connector reauthorization, and data refresh.
4. Employee Agent source package deploy.
5. Assign `EMPLOYEE_DATA_ACCESS_PERMISSION_SET_API_NAME`.
6. Live preview.
7. Publish and activate.
8. Employee access package deploy.
9. Assign `EMPLOYEE_AGENT_ACCESS_PERMISSION_SET_API_NAME` and smoke test.

**Stop if:** The agent depends on Data 360 and the target data is not refreshed. Do not deploy or preview the agent yet.

## Authoring bundle states

Salesforce documents draft, committed, and versioned representations in [Retrieve and deploy Agentforce metadata](https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-deploy-metadata.html):

| State | Metadata | Editable |
|---|---|---|
| Draft (uncommitted) | `AiAuthoringBundle` | Yes |
| Committed | `AiAuthoringBundle`, `Bot`, `BotVersion` | No. Create a new version |
| Legacy agent | `Bot`, `BotVersion` | n/a |

This guide deploys `AiAuthoringBundle` only, then publishes and activates in the target org. That remains the recommended path. Do not add `Bot` or `BotVersion` to the package unless that is the actual retrieved state you intend to deploy. If you saved more bundle versions than you committed, the `AiAuthoringBundle` version can differ from `Bot`/`BotVersion`.

## Create the package folder

Create or open one Salesforce DX project folder for this package:

Generate the staging project:

```bash
sf template generate project --name deploy-employee-agent --template empty --default-package-dir force-app --api-version 67.0
```

Create the manifest folder:

```bash
mkdir -p deploy-employee-agent/manifest
```

```text
deploy-employee-agent/
+-- sfdx-project.json
+-- manifest/
|   +-- package.xml
+-- force-app/main/default/
```

Generated `sfdx-project.json` is local CLI config (not deployed). Keep an existing project’s file. `sourceApiVersion` should be `67.0` unless a generated Data Kit manifest says otherwise.

Copy `manifests/employee-agent-package.xml` to `manifest/package.xml` for the first source package; replace XML-safe placeholders with real API names and remove unused blocks. The template is not retrieve-ready or deploy-ready if copied blindly. Use [Build package.xml from exact source names](deployment-workflow.md#2-build-packagexml-from-exact-source-names) for member-name formats. Summer ’26 Metadata API is 67.0. Use 67.0 unless a generated Data Kit manifest or current Agentforce DX example says otherwise.

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
| Employee data and action access | `PermissionSet`, `PermissionSetGroup` |
| Employee Agent access after publish | `PermissionSet`, `PermissionSetGroup` with `agentAccesses` |
| Employee app surface, if included | `CustomApplication`, `CustomTab`, `FlexiPage` |
| Callout definitions | `NamedCredential`, `ExternalCredential` |

Employee Agents run as the logged-in employee. Do not package a Service Agent user, and do not add `default_agent_user` under `access:` or `config:` in the `.agent` source.

For a clean target org, keep `agentAccesses` out of the first source package. Deploy the `agentAccesses` permission set after the agent is published and activated.

Start with only the `AiAuthoringBundle` member if the agent's dependencies are not known. Retrieve the agent source first, inspect the `.agent` file for `apex://`, `flow://`, `prompt://`, `generatePromptResponse://`, `complex_data_type_name`, and named-credential names when used, then add only confirmed dependencies to `package.xml`.

## Clean target order

For a clean target org, follow [Deployment order](#deployment-order) and deploy the `agentAccesses` access package only after publish and activation.

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

Also add referenced objects, fields, permission sets, and app surfaces only when the source uses them.

Retrieve again after updating `package.xml`:

```bash
sf project retrieve start --json --manifest manifest/package.xml --target-org <SOURCE_ORG_ALIAS>
```

Review the package before deploy:

- Every `package.xml` member has a matching file under `force-app/main/default`.
- The package contains only the Employee Agent source and its first-pass dependencies.
- The `.agent` source does not contain `default_agent_user` under `access:` or `config:`.
- The first package does not contain a permission set or group with `agentAccesses`.
- The package does not contain source-org usernames, credential secrets, OAuth tokens, connector auth, or runtime state.

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

Validate the local bundle against the target org:

```bash
sf agent validate authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

## Data 360 DevOps Data Kit

If this Employee Agent uses Data 360 data, complete [Deploy a Data 360 DevOps Data Kit](20-data-360-data-kit.md) before deploying the agent source package.

Confirm the target Data 360 components are deployed, connector access is reauthorized, required data is refreshed, and assigned employees have the Data 360 access required by the agent.

If the agent grounds on an Agentforce Data Library, recreate it in the target org — it is not deployed. Recreating it provisions a new search index and retriever in that org. Do not expect a Data Kit to move the library’s generated Pro-code/ADL retriever. Same-data-space is the intended path. Re-point a prompt template only if a no-code retriever API name changed during recovery. See [Deploy a Data 360 DevOps Data Kit](20-data-360-data-kit.md#what-does-not-move-the-agentforce-data-library).

**Stop if:** The agent depends on Data 360 and the target data space does not match the source, or target data is not refreshed.

## Deploy the source package

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

**Stop if:** The access permission set deploys before the agent is published and active. Remove the `agentAccesses` permission set from the first package, deploy the agent source, publish and activate it, then deploy the access package.

## Assign data access and publish

Assign the project-owned data access permission set before live preview:

```bash
sf org assign permset --json --name EMPLOYEE_DATA_ACCESS_PERMISSION_SET_API_NAME --on-behalf-of <EMPLOYEE_USERNAME> --target-org <TARGET_ORG_ALIAS>
```

Without `--on-behalf-of`, the command assigns access only to the running admin. Assign it to the user who will run live preview.

**Stop if:** Live preview starts before `EMPLOYEE_DATA_ACCESS_PERMISSION_SET_API_NAME` is assigned to the preview user.

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

**Stop if:** Live preview fails, returns no expected data, or reports missing employee permissions. Fix target-org access before publishing.

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

Deploy and assign employee access before the non-admin smoke test.

To roll back a bad version, reactivate the prior known-good version:

```bash
sf agent activate --json --api-name <AGENT_API_NAME> --version <PRIOR_VERSION_NUMBER> --target-org <TARGET_ORG_ALIAS>
```

`sf agent deactivate` exists when you need to take the current version offline before a swap:

```bash
sf agent deactivate --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

## Deploy and assign employee access

Assign the shipped permission set or permission set group to agent users.

The Employee Agent access permission set must include `agentAccesses`:

```xml
<agentAccesses>
    <agentName>AGENT_API_NAME</agentName>
    <enabled>true</enabled>
</agentAccesses>
```

For a clean target org, copy `manifests/employee-agent-access-package.xml` to `manifest/employee-agent-access-package.xml`, then deploy it after publish and activation.

Production deploys should validate first and run Apex tests:

```bash
sf project deploy validate --json --manifest manifest/employee-agent-access-package.xml --target-org <TARGET_ORG_ALIAS> --test-level RunLocalTests --wait 30
sf project deploy quick --json --job-id <JOB_ID_FROM_VALIDATE> --target-org <TARGET_ORG_ALIAS> --wait 30
```

Sandbox dry run, then deploy. If your sandbox release policy requires tests, replace `NoTestRun` with `RunLocalTests`.

```bash
sf project deploy start --json --dry-run --manifest manifest/employee-agent-access-package.xml --target-org <TARGET_ORG_ALIAS> --test-level NoTestRun --wait 30
sf project deploy start --json --manifest manifest/employee-agent-access-package.xml --target-org <TARGET_ORG_ALIAS> --test-level NoTestRun --wait 30
```

If the access package is permission-set-only and contains no Apex, confirm org policy before using `NoTestRun`. Do not use `NoTestRun` on the production alias unless that policy is explicit.

```bash
sf org assign permset --json --name EMPLOYEE_AGENT_ACCESS_PERMISSION_SET_API_NAME --on-behalf-of <EMPLOYEE_USERNAME> --target-org <TARGET_ORG_ALIAS>
```

Without `--on-behalf-of`, the command assigns access only to the running admin. For many users, use a permission set group or an approved assignment process.

For the Lightning Agentforce panel, employees can also need Salesforce-provided Agentforce user access. The package permission set with `agentAccesses` grants access to this agent; the Salesforce-provided access below surfaces the Agentforce panel itself.

Setup path, from [Give Users Access to Agentforce (Default)](https://help.salesforce.com/s/articleView?id=ai.copilot_setup_user_access.htm&type=5):

1. Open the employee's user record and edit **Permission Set Group Assignments**.
2. Add the `CopilotSalesforceUserPSG` permission set group, or assign the permission sets labeled **Access Agentforce Default Agent** and **Prompt Template User**.

The Einstein Copilot-era API names survived the Agentforce rename; only labels changed. The permission set license labeled **Agentforce (Default)** keeps API name `EinsteinGPTCopilotPsl`, and **Access Agentforce Default Agent** keeps `CopilotSalesforceUser`. Confirm they exist in the target org before scripting assignments:

```bash
sf data query --json --query "SELECT DeveloperName, MasterLabel, Status FROM PermissionSetLicense WHERE DeveloperName = 'EinsteinGPTCopilotPsl'" --target-org <TARGET_ORG_ALIAS>
```

If confirmed, assign the Salesforce-provided permission set license:

```bash
sf org assign permsetlicense --json --name EinsteinGPTCopilotPsl --on-behalf-of <EMPLOYEE_USERNAME> --target-org <TARGET_ORG_ALIAS>
```

Assign the Salesforce-provided permission set:

```bash
sf org assign permset --json --name CopilotSalesforceUser --on-behalf-of <EMPLOYEE_USERNAME> --target-org <TARGET_ORG_ALIAS>
```

Agentforce (Default) reached end of sale on June 17, 2025 and is not provisioned in new Salesforce environments. If the query returns no rows or an assignment says the license or permission set does not exist, assign the org's current Agentforce user access from Setup instead.

Because Employee Agents run as the logged-in user, each employee needs the object, field, record, Apex, Flow, prompt template, and callout access required by the action path.

If published-agent CLI preview returns `Invalid user ID provided on start session`, confirm the agent is active, confirm the employee has Agentforce user access and the permission set with `agentAccesses`, then test from the Lightning Agentforce panel as an assigned employee.

**Stop if:** The only successful smoke test was run by an admin. Test as a real non-admin employee with the assigned access before go-live.

Optional CLI smoke test after access is assigned:

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

## Checklist

- [ ] Agent API name replaced everywhere.
- [ ] `default_agent_user` omitted from `access:` and `config:` in the Employee Agent source.
- [ ] Every `apex://`, `flow://`, `prompt://`, `generatePromptResponse://`, `complex_data_type_name`, named-credential, object, field, and permission dependency is included when used.
- [ ] Test classes are included for production deploys.
- [ ] First clean-target package does not include `agentAccesses`.
- [ ] `EMPLOYEE_DATA_ACCESS_PERMISSION_SET_API_NAME` is assigned before live preview.
- [ ] Employee access package with `agentAccesses` is deployed after publish and activation.
- [ ] `EMPLOYEE_AGENT_ACCESS_PERMISSION_SET_API_NAME` or permission set group is assigned.
- [ ] Employees have the Salesforce-provided Agentforce user access required for the Lightning panel.
- [ ] Data 360 DevOps Data Kit completed before the agent source package, if used.
- [ ] Live-action preview passes before publish.
- [ ] Active-agent smoke test passes as a non-admin employee.
- [ ] Go-live proof saved for this target org: source-package deploy job ID, access-package deploy job ID, Apex test summary when Apex was included, live-preview `sessionId`, and non-admin smoke-test evidence. See [Capture go-live proof](deployment-workflow.md#5-capture-go-live-proof).
- [ ] If a step fails, use [Troubleshooting](03-troubleshooting.md).

## Sources

- Retrieve and deploy Agentforce metadata: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-deploy-metadata.html
- Agentforce metadata types: https://developer.salesforce.com/docs/ai/agentforce/references/agents-metadata-tooling/agents-metadata.html
- Agent Script Blocks (`access.default_agent_user`): https://developer.salesforce.com/docs/ai/agentforce/guide/ascript-blocks.html
- Set Up Your DX Environment (preview/publish permissions): https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-set-up-env.html
- Give Users Access to Agentforce (Default) (`CopilotSalesforceUserPSG`, panel access, end-of-sale note): https://help.salesforce.com/s/articleView?id=ai.copilot_setup_user_access.htm&type=5
