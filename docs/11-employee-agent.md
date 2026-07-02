# Deploy and Activate an Employee Agent

Move an employee-facing Agentforce Employee Agent from sandbox to production.

**Required before deploy:** Employee Agents run as the logged-in employee. Do not use `default_agent_user` for an Employee Agent.

## When this applies

| Field | Value |
|---|---|
| Source metadata | `force-app/main/default/aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent` |
| Agent type | `AgentforceEmployeeAgent` |
| Running user | Logged-in user |
| Publish path | Deploy source, live preview, publish, activate |

## Create the package folder

Create or open one Salesforce DX project folder for this package:

```text
deploy-employee-agent/
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
  "name": "employee-agent-deploy-package",
  "sourceApiVersion": "66.0"
}
```

Copy `manifests/employee-agent-package.xml` to `manifest/package.xml` for the first source package; replace XML-safe placeholders with real API names and remove unused blocks.

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

Employee Agents do not use a Service Agent user or `default_agent_user`.

For a clean target org, keep `agentAccesses` out of the first source package. Deploy the `agentAccesses` permission set after the agent is published and activated.

## Clean target order

Use this order when the target org does not already have the Employee Agent:

| Order | Action |
|---|---|
| 1 | Deploy the source package: `AiAuthoringBundle`, actions, prompts, objects, fields, data/action access, and Custom Lightning Types only when used |
| 2 | Publish and activate the agent |
| 3 | Deploy the access package with the permission set or group that contains `agentAccesses` |
| 4 | Assign users and smoke test as a non-admin employee |

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
4. Add every referenced Apex class and Flow to the source package manifest.

Also add referenced prompt templates, objects, fields, permission sets, credentials, app surfaces, and Custom Lightning Types only when the source uses them.

Retrieve again after updating `package.xml`:

```bash
sf project retrieve start --json --manifest manifest/package.xml --target-org <SOURCE_ORG_ALIAS>
```

Review the package before deploy:

- Every `package.xml` member has a matching file under `force-app/main/default`.
- The package contains only the Employee Agent source and its first-pass dependencies.
- The first package does not contain a permission set or group with `agentAccesses`.
- The package does not contain source-org usernames, credential secrets, OAuth tokens, connector auth, or runtime state.

## Validate in the source sandbox

```bash
sf org list metadata --json --metadata-type AiAuthoringBundle --target-org <SOURCE_ORG_ALIAS>
sf agent validate authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <SOURCE_ORG_ALIAS>
```

Fix validation errors before handoff.

## Deploy the source package

Log in to the target org and confirm the org. Use `https://login.salesforce.com` for production or `https://test.salesforce.com` for a sandbox.

```bash
sf org login web --json --alias <TARGET_ORG_ALIAS> --instance-url https://login.salesforce.com
sf org display --json --target-org <TARGET_ORG_ALIAS>
sf org list metadata --json --metadata-type AiAuthoringBundle --target-org <TARGET_ORG_ALIAS>
```

**Stop if:** The target org command returns `INVALID_TYPE` or `Not available for deploy for this organization`. Enable and provision Agentforce for the target org before continuing.

Validate the local bundle against the target org:

```bash
sf agent validate authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

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

## Publish and activate

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
sf agent publish authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

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

## Deploy and assign employee access

Assign the shipped permission set or permission set group to agent users.

The Employee Agent access permission set must include `agentAccesses`:

```xml
<agentAccesses>
    <agentName>AGENT_API_NAME</agentName>
    <enabled>true</enabled>
</agentAccesses>
```

For a clean target org, copy `manifests/employee-agent-access-package.xml` to `manifest/employee-agent-access-package.xml`, then deploy it after publish and activation:

```bash
sf project deploy start --json --manifest manifest/employee-agent-access-package.xml --target-org <TARGET_ORG_ALIAS> --test-level NoTestRun --wait 30
```

```bash
sf org assign permset --json --name Employee_Agent_Access --on-behalf-of <EMPLOYEE_USERNAME> --target-org <TARGET_ORG_ALIAS>
```

Without `--on-behalf-of`, the command assigns access only to the running admin. For many users, use a permission set group or an approved assignment process.

For the Lightning Agentforce panel, employees can also need Salesforce-provided Agentforce user access. Confirm names in Setup for the target-org SKU. Common defaults:

```bash
sf org assign permsetlicense --json --name EinsteinGPTCopilotPsl --on-behalf-of <EMPLOYEE_USERNAME> --target-org <TARGET_ORG_ALIAS>
sf org assign permset --json --name CopilotSalesforceUser --on-behalf-of <EMPLOYEE_USERNAME> --target-org <TARGET_ORG_ALIAS>
```

In Setup: assign the equivalent Agentforce permission set license and permission set, then assign the package permission set or group.

Salesforce-provided Agentforce permission set license and permission set names can vary by SKU. If the command says the license or permission set does not exist, assign the equivalent Agentforce user access from Setup.

Because Employee Agents run as the logged-in user, each employee needs the object, field, record, Apex, Flow, prompt template, and callout access required by the action path.

If published-agent CLI preview returns `Invalid user ID provided on start session`, confirm the agent is active, confirm the employee has Agentforce user access and the permission set with `agentAccesses`, then test from the Lightning Agentforce panel as an assigned employee.

**Stop if:** The only successful smoke test was run by an admin. Test as a real non-admin employee with the assigned access before go-live.

Optional CLI smoke test after access is assigned:

```bash
sf agent preview start --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
sf agent preview send --json --api-name <AGENT_API_NAME> --session-id <SESSION_ID> --utterance "Test the main happy path" --target-org <TARGET_ORG_ALIAS>
sf agent preview end --json --api-name <AGENT_API_NAME> --session-id <SESSION_ID> --target-org <TARGET_ORG_ALIAS>
```

## Checklist

- [ ] Agent API name replaced everywhere.
- [ ] `default_agent_user` omitted from the Employee Agent source.
- [ ] Every `apex://`, `flow://`, prompt template, object, field, permission, and applicable Custom Lightning Type dependency is included.
- [ ] Test classes are included for production deploys.
- [ ] First clean-target package does not include `agentAccesses`.
- [ ] Employee access package with `agentAccesses` is deployed after publish and activation.
- [ ] Employee permission set or permission set group is assigned.
- [ ] Employees have the Salesforce-provided Agentforce user access required for the Lightning panel.
- [ ] Data 360 package completed first, if used.
- [ ] Live-action preview passes before publish.
- [ ] Active-agent smoke test passes as a non-admin employee.

## Sources

- Retrieve and deploy Agentforce metadata: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-deploy-metadata.html
- Agentforce metadata types: https://developer.salesforce.com/docs/ai/agentforce/references/agents-metadata-tooling/agents-metadata.html
