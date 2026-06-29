# Deploy and Activate an Employee Agent

Deploy an employee-facing Agentforce Employee Agent from sandbox to production.

> **Required before deploy:** Employee Agents run as the logged-in employee. Do not use `default_agent_user` for an Employee Agent.

## When this applies

| Check | Expected |
|---|---|
| Source metadata | `force-app/main/default/aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent` |
| Agent type | `AgentforceEmployeeAgent` |
| Running user | Logged-in user |
| Publish path | Deploy source, live preview, publish, activate |

## Values needed

| Value | Use |
|---|---|
| `<SOURCE_ORG_ALIAS>` | Source sandbox for validation or retrieve |
| `<TARGET_ORG_ALIAS>` | Target org for validation, deploy, access, and publish |
| `<PACKAGE_XML_PATH>` | Final source package manifest |
| `<AGENT_API_NAME>` | Employee Agent API name |
| `<EMPLOYEE_USERNAME>` | Target-org employee user for assignment and smoke test |

## Prepare the package

Copy `manifests/employee-agent-package.xml` to `manifest/package.xml` for the first source package, then replace XML-safe placeholders with real API names.

Include referenced dependencies:

| Dependency | Metadata type |
|---|---|
| Agent Script bundle | `AiAuthoringBundle` |
| Invocable Apex actions and tests | `ApexClass` |
| Flow actions | `Flow` |
| Prompt templates | `GenAiPromptTemplate` |
| Structured action schemas | `LightningTypeBundle` |
| Custom CLT editor or renderer components | `LightningComponentBundle` |
| Objects and fields | `CustomObject`, `CustomField` |
| Employee data and action access | `PermissionSet`, `PermissionSetGroup` |
| Employee Agent access after publish | `PermissionSet`, `PermissionSetGroup` with `agentAccesses` |
| Employee app surface, if included | `CustomApplication`, `CustomTab`, `FlexiPage` |
| Callout definitions | `NamedCredential`, `ExternalCredential` |

> **Do not package:** Do not create a Service Agent user and do not add `default_agent_user` to the Employee Agent source.
> **Do not package:** For a clean target org, do not include `agentAccesses` in the first source package. Deploy the `agentAccesses` permission set after the agent is published and activated.

## Clean target order

Use this order when the target org does not already have the Employee Agent:

| Step | Package or action | Includes |
|---|---|---|
| 1 | Source package | `AiAuthoringBundle`, actions, prompts, CLTs, objects, fields, data/action access |
| 2 | Publish and activate | Creates the target `BotDefinition` and active version |
| 3 | Access package | Permission set or group with `agentAccesses` |
| 4 | Assignment and smoke test | Assign users and test as a non-admin employee |

Identify action targets in the source bundle:

1. Open `force-app/main/default/aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent`.
2. Search in the file for `apex://`.
3. Search in the file for `flow://`.
4. Add every referenced Apex class and Flow to the source package manifest.

If the source files are not already in the package folder, use the two-pass retrieve flow in [Prepare and Retrieve a Package](01-prepare-and-retrieve-package.md): retrieve the `AiAuthoringBundle`, inspect the `.agent` file for dependencies, update `package.xml`, then retrieve again.

## Validate in the source sandbox

```bash
sf org list metadata --json --metadata-type AiAuthoringBundle --target-org <SOURCE_ORG_ALIAS>
sf agent validate authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <SOURCE_ORG_ALIAS>
```

Fix validation errors before handoff.

## Deploy the source package

If the source files have not been retrieved yet, complete [Prepare and Retrieve a Package](01-prepare-and-retrieve-package.md). Then deploy with [Deploy a Package](01-deploy-package.md). Stop if validation or deploy fails.

> **Stop if:** Deploy fails with `In field: botDefinition - no Bot named <AGENT_API_NAME> found`. The package included `agentAccesses` too early. Remove the `agentAccesses` permission set from the first package, deploy the agent source, publish and activate it, then deploy the access package.

## Publish and activate

Run [Publish and Activate](02-publish-and-activate.md).

## Deploy and assign employee access

Assign the shipped permission set or permission set group to agent users.

The permission set that grants Employee Agent access must include `agentAccesses` for the agent API name:

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

> **Manual after deploy:** Without `--on-behalf-of`, the command assigns access only to the running admin. For many users, use a permission set group or a customer-approved assignment process.

For the Lightning Agentforce panel, the employee can also need Salesforce-provided Agentforce user access in the target org. Confirm this in Setup for the customer SKU. In orgs using the default Agentforce panel, this often means:

```bash
sf org assign permsetlicense --json --name EinsteinGPTCopilotPsl --on-behalf-of <EMPLOYEE_USERNAME> --target-org <TARGET_ORG_ALIAS>
sf org assign permset --json --name CopilotSalesforceUser --on-behalf-of <EMPLOYEE_USERNAME> --target-org <TARGET_ORG_ALIAS>
```

In Setup, assign the equivalent Agentforce permission set license and permission set on the employee user record, then assign the package permission set or group.

> **Customer-specific value:** Salesforce-provided Agentforce permission set license and permission set names can vary by SKU. If the command says the license or permission set does not exist, assign the equivalent Agentforce user access from Setup.

Because Employee Agents run as the logged-in user, each employee needs the object, field, record, Apex, Flow, prompt template, and callout access required by the action path.

> **Manual after deploy:** If published-agent CLI preview returns `Invalid user ID provided on start session`, verify activation with `BotVersion`, confirm the employee has Agentforce user access and the permission set with `agentAccesses`, then test from the Lightning Agentforce panel as an assigned employee.

> **Stop if:** The only successful smoke test was run by an admin. Test as a real non-admin employee with the assigned access before go-live.

## Checklist

- [ ] `<AGENT_API_NAME>` replaced everywhere.
- [ ] `default_agent_user` omitted from the Employee Agent source.
- [ ] Every `apex://`, `flow://`, prompt template, CLT, LWC renderer, object, field, and permission dependency is included.
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
