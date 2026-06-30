# Move Reusable Agent Assets

Move project-owned reusable Agentforce subagents and actions from sandbox to another org.

**Required before deploy:** Use this guide only for reusable assets that the implementation team controls. For a full Service or Employee Agent, use the agent guide. For the managed Lead Nurture Agent, create the agent in the target org and use this guide only for reusable assets that you add to it.

## Metadata model

Reusable asset metadata:

- `GenAiPlugin`: reusable subagent/topic
- `GenAiFunction`: reusable action

Use this path for legacy Agent Builder and committed Builder assets. For draft Agent Script source, use the Service or Employee Agent guide unless you are deliberately packaging Asset Library assets.

## When this applies

Use this guide for:

- Reusable subagents already visible in Agentforce Builder.
- Reusable actions already visible in Agentforce Builder.
- Local-only topics or actions inside a committed custom agent version, after making a reusable copy.

Do not use this guide for:

- Managed Lead Nurture Agent templates or generated runtime.
- Draft Agent Script source in `.agent` files. Use the Service or Employee Agent guide.

## Prepare the package

Copy `manifests/reusable-agent-assets-package.xml` to `manifest/package.xml`; replace XML-safe placeholders with real API names.

Common dependencies:

| Dependency | Metadata type |
|---|---|
| Reusable subagent or topic | `GenAiPlugin` |
| Reusable action | `GenAiFunction` |
| Invocable Apex action and tests | `ApexClass` |
| Flow action | `Flow` |
| Prompt template action | `GenAiPromptTemplate` |
| Structured custom action schemas, if the reusable action uses Custom Lightning Types | `LightningTypeBundle` |
| Custom Lightning Type editor or renderer components, if used by those schemas | `LightningComponentBundle` |
| Objects and fields used by the action | `CustomObject`, `CustomField` |
| Runtime data access | `PermissionSet` |

## Path 1: retrieve reusable assets

Use when the source sandbox already shows the subagent or action as a reusable asset.

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

## Path 2: make local assets reusable

Use when the source agent has local-only topics or actions that do not appear in the Asset Library.

1. Retrieve the committed custom agent version into a sandbox working package.
2. Find the local topic under `genAiPlannerBundles/.../localPlugins/`.
3. Find the local action under `genAiPlannerBundles/.../localActions/`.
4. Create a new standalone `GenAiPlugin` with a reusable asset API name.
5. Create a new standalone `GenAiFunction` with a reusable asset API name.
6. Copy the local action `input/schema.json` and `output/schema.json` into the standalone function folder.
7. Point the standalone function to the same backing Apex, Flow, or prompt target.
8. Point the standalone plugin to the standalone function by API name.
9. Deploy the standalone assets to the source sandbox first.
10. Retrieve the standalone assets by name.
11. Deploy the retrieved package to the target org.

**Stop if:** The local asset belongs to the managed Lead Nurture Agent template or another Salesforce-managed package. Do not repackage managed runtime metadata.

**Do not package:** Do not edit generated planner, plugin, or action metadata for direct deployment. Use it only as the source for a new deployable reusable asset.

## Verify the target org

Confirm metadata exists:

```bash
sf org list metadata --json --metadata-type GenAiPlugin --target-org <TARGET_ORG_ALIAS>
sf org list metadata --json --metadata-type GenAiFunction --target-org <TARGET_ORG_ALIAS>
```

Confirm deployed records are standalone assets:

```bash
sf data query --use-tooling-api --json --target-org <TARGET_ORG_ALIAS> --query "SELECT DeveloperName, IsLocal, ParentId, PlannerId FROM GenAiPluginDefinition WHERE DeveloperName = '<REUSABLE_SUBAGENT_API_NAME>'"
sf data query --use-tooling-api --json --target-org <TARGET_ORG_ALIAS> --query "SELECT DeveloperName, IsLocal, ParentId, PlannerId, PluginId FROM GenAiFunctionDefinition WHERE DeveloperName = '<REUSABLE_ACTION_API_NAME>'"
```

Expected result:

| Field | Expected |
|---|---|
| `IsLocal` | `false` |
| `ParentId` | blank |
| `PlannerId` | blank |
| `PluginId` for standalone action | blank |

In Agentforce Builder, open a draft agent and select **Add Resource** > **Add from Asset Library**. The reusable subagent should appear there.

**Manual after deploy:** Add the reusable asset to the target agent draft, preview with live actions, then publish and activate through the normal target-org process.

**Target-org value:** After a reusable asset is added to an agent and customized, treat that agent copy as part of that agent draft. Updating the standalone asset later does not prove the already-added agent copy is updated.

## Lead Nurture Agent use

For the managed Lead Nurture Agent:

1. Create and configure the managed agent in the target org.
2. Deploy reusable assets with this guide.
3. Add them from the target org Asset Library.

This can reduce rebuild work for custom topics or actions. It does not make the managed Lead Nurture Agent itself deployable. The same pattern applies to other Asset Library projects.

## Checklist

- [ ] Asset is project-owned, not managed-template runtime metadata.
- [ ] Reusable `GenAiPlugin` and `GenAiFunction` names are exact members in `package.xml`.
- [ ] Backing Apex, Flow, prompt template, object, field, permission, and applicable Custom Lightning Type dependencies are included when used.
- [ ] Converted local assets are first deployed and retrieved as standalone assets from the source sandbox.
- [ ] Target records show `IsLocal = false`.
- [ ] Asset appears in **Add from Asset Library** in the target org.
- [ ] Target agent preview passes before publish.

## Sources

- Retrieve and deploy Agentforce metadata: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-deploy-metadata.html
- Agentforce metadata types: https://developer.salesforce.com/docs/ai/agentforce/references/agents-metadata-tooling/agents-metadata.html
