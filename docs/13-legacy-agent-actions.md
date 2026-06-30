# Legacy Agent Actions

Move project-owned legacy Agentforce actions from sandbox to another org.

**Required before deploy:** Use this guide only for legacy Agent Builder or committed Builder actions the project controls. For draft Agent Script source, use the Service or Employee Agent guide. For the managed Lead Nurture Agent, create the agent in the target org and use this guide only for legacy actions that you add to it.

## Metadata model

Legacy action metadata:

- `GenAiFunction`: legacy action
- `GenAiPlugin`: legacy topic or plugin wrapper, only when the action requires it

Use this path for legacy Agent Builder and committed Builder actions. For draft Agent Script source, use the Service or Employee Agent guide.

## When this applies

| Source | Use this guide? |
|---|---|
| Legacy action already visible in Agentforce Builder | Yes |
| Local-only action inside a committed custom agent version | Yes, after making a deployable copy |
| Topic or plugin wrapper required by that action | Yes, as support metadata |
| Managed Lead Nurture Agent template or generated runtime | No |
| Draft Agent Script source in `.agent` files | No, use the Service or Employee Agent guide |

## Prepare the package

Copy `manifests/legacy-agent-actions-package.xml` to `manifest/package.xml`; replace XML-safe placeholders with real API names.

Common dependencies:

| Dependency | Metadata type |
|---|---|
| Legacy action | `GenAiFunction` |
| Topic or plugin wrapper required by the action | `GenAiPlugin` |
| Invocable Apex action and tests | `ApexClass` |
| Flow action | `Flow` |
| Prompt template action | `GenAiPromptTemplate` |
| Structured custom action schemas, if the legacy action uses Custom Lightning Types | `LightningTypeBundle` |
| Custom Lightning Type editor or renderer components, if used by those schemas | `LightningComponentBundle` |
| Objects and fields used by the action | `CustomObject`, `CustomField` |
| Runtime data access | `PermissionSet` |

## Path 1: retrieve legacy actions

Use when the source sandbox already shows the action as a legacy Agent Builder asset.

Confirm the asset names:

```bash
sf org list metadata --json --metadata-type GenAiPlugin --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type GenAiFunction --target-org <SOURCE_ORG_ALIAS>
```

Retrieve the package:

```bash
sf project retrieve start --json --manifest <PACKAGE_XML_PATH> --target-org <SOURCE_ORG_ALIAS>
```

After retrieve, deploy with [Deploy a Package](01-deploy-package.md).

## Path 2: make a local action deployable

Use when the source agent has a local-only action that does not appear in the Asset Library.

1. Retrieve the committed custom agent version into a sandbox working package.
2. Find the local topic wrapper under `genAiPlannerBundles/.../localPlugins/`, if the action uses one.
3. Find the local action under `genAiPlannerBundles/.../localActions/`.
4. Create a new standalone `GenAiPlugin` only when the action needs a topic or plugin wrapper.
5. Create a new standalone `GenAiFunction` with a legacy action API name.
6. Copy the local action `input/schema.json` and `output/schema.json` into the standalone function folder.
7. Point the standalone function to the same backing Apex, Flow, or prompt target.
8. If a standalone plugin is used, point it to the standalone function by API name.
9. Deploy the standalone action and support metadata to the source sandbox first.
10. Retrieve the standalone action by name.
11. Deploy the retrieved package to the target org.

**Stop if:** The local action belongs to the managed Lead Nurture Agent template or another Salesforce-managed package. Do not repackage managed runtime metadata.

**Do not package:** Do not edit generated planner, plugin, or action metadata for direct deployment. Use it only as the source for a new deployable legacy action.

## Verify the target org

Confirm metadata exists:

```bash
sf org list metadata --json --metadata-type GenAiPlugin --target-org <TARGET_ORG_ALIAS>
sf org list metadata --json --metadata-type GenAiFunction --target-org <TARGET_ORG_ALIAS>
```

Confirm deployed records are standalone action metadata:

```bash
sf data query --use-tooling-api --json --target-org <TARGET_ORG_ALIAS> --query "SELECT DeveloperName, IsLocal, ParentId, PlannerId FROM GenAiPluginDefinition WHERE DeveloperName = '<LEGACY_PLUGIN_API_NAME>'"
sf data query --use-tooling-api --json --target-org <TARGET_ORG_ALIAS> --query "SELECT DeveloperName, IsLocal, ParentId, PlannerId, PluginId FROM GenAiFunctionDefinition WHERE DeveloperName = '<LEGACY_ACTION_API_NAME>'"
```

Expected result:

| Field | Expected |
|---|---|
| `IsLocal` | `false` |
| `ParentId` | blank |
| `PlannerId` | blank |
| `PluginId` for standalone action | blank |

In Agentforce Builder, open a draft agent and select **Add Resource** > **Add from Asset Library**. The legacy action should appear there.

**Manual after deploy:** Add the legacy action to the target agent draft, preview with live actions, then publish and activate through the normal target-org process.

**Target-org value:** After a legacy action is added to an agent and customized, treat that agent copy as part of that agent draft. Updating the standalone action later does not prove the already-added agent copy is updated.

## Lead Nurture Agent use

For the managed Lead Nurture Agent:

1. Create and configure the managed agent in the target org.
2. Deploy legacy actions with this guide.
3. Add them from the target org Asset Library.

This can reduce rebuild work for custom actions. It does not make the managed Lead Nurture Agent itself deployable. The same pattern applies to other legacy action projects.

## Checklist

- [ ] Action is project-owned, not managed-template runtime metadata.
- [ ] Legacy `GenAiFunction` and required `GenAiPlugin` names are exact members in `package.xml`.
- [ ] Backing Apex, Flow, prompt template, object, field, permission, and applicable Custom Lightning Type dependencies are included when used.
- [ ] Converted local actions are first deployed and retrieved as standalone assets from the source sandbox.
- [ ] Target records show `IsLocal = false`.
- [ ] Action appears in **Add from Asset Library** in the target org.
- [ ] Target agent preview passes before publish.

## Sources

- Retrieve and deploy Agentforce metadata: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-deploy-metadata.html
- Agentforce metadata types: https://developer.salesforce.com/docs/ai/agentforce/references/agents-metadata-tooling/agents-metadata.html
