# Legacy Agent Actions

Move custom legacy Agentforce actions from sandbox to another org.

**Required before deploy:** Use this guide only for legacy Agent Builder or saved Builder actions your team controls. For draft Agent Script source, use the Service or Employee Agent guide. For Lead Nurture Agent, create the agent in the target org and use this guide only for legacy actions that you add to it.

## What moves

Legacy action metadata:

- `GenAiFunction`: legacy action
- `GenAiPlugin`: legacy topic or plugin wrapper, only when the action requires it

Use this path for legacy Agent Builder and saved Builder actions. For draft Agent Script source, use the Service or Employee Agent guide.

## When this applies

| Source | Use this guide? |
|---|---|
| Legacy action already visible in Agentforce Builder | Yes |
| Action that does not appear in the Asset Library | Rebuild it as a standalone custom action first |
| Topic or plugin wrapper required by that action | Yes, as supporting metadata |
| Lead Nurture Agent template or Salesforce-managed setup | No |
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

Confirm the retrieve result is `Succeeded`.

Log in to the target org and validate the package. Use `https://login.salesforce.com` for production or `https://test.salesforce.com` for a sandbox.

```bash
sf org login web --json --alias <TARGET_ORG_ALIAS> --instance-url https://login.salesforce.com
sf org display --json --target-org <TARGET_ORG_ALIAS>
```

Production deploys must run Apex tests if Apex is included. Validate first:

```bash
sf project deploy validate --json --manifest <PACKAGE_XML_PATH> --target-org <TARGET_ORG_ALIAS> --test-level RunLocalTests --wait 30
```

If validation succeeds, copy `result.id` and quick deploy:

```bash
sf project deploy quick --json --job-id <JOB_ID_FROM_VALIDATE> --target-org <TARGET_ORG_ALIAS> --wait 30
```

For sandbox validation, run a dry run first. If your sandbox release policy requires tests, replace `NoTestRun` with `RunLocalTests`.

```bash
sf project deploy start --json --dry-run --manifest <PACKAGE_XML_PATH> --target-org <TARGET_ORG_ALIAS> --test-level NoTestRun --wait 30
```

If the dry run succeeds:

```bash
sf project deploy start --json --manifest <PACKAGE_XML_PATH> --target-org <TARGET_ORG_ALIAS> --test-level NoTestRun --wait 30
```

Continue only after the deploy result is `Succeeded`.

## Path 2: rebuild a local-only action

Use when the source agent has a local-only action that does not appear in the Asset Library.

1. Create a new standalone `GenAiFunction` with a clear legacy action API name.
2. Create a standalone `GenAiPlugin` only when the action needs a topic or plugin wrapper.
3. Point the standalone action to the same backing Apex, Flow, or prompt target.
4. Include the backing Apex, Flow, prompt, object, field, permission, and schema dependencies.
5. Deploy the standalone action to the source sandbox first.
6. Confirm the action appears in the source Asset Library.
7. Retrieve the standalone action by name.
8. Deploy the retrieved package to the target org.

**Stop if:** The action belongs to Lead Nurture Agent setup or another Salesforce-managed package. Rebuild only custom actions your team controls.

Do not copy generated local action files directly into the target package.

## Verify the target org

Confirm metadata exists:

```bash
sf org list metadata --json --metadata-type GenAiPlugin --target-org <TARGET_ORG_ALIAS>
sf org list metadata --json --metadata-type GenAiFunction --target-org <TARGET_ORG_ALIAS>
```

In Agentforce Builder, open a draft agent and select **Add Resource** > **Add from Asset Library**. The legacy action should appear there.

After deploy, add the legacy action to the target agent draft, preview with live actions, then publish and activate through the normal target-org process.

After a legacy action is added to an agent and customized, treat that agent copy as part of that agent draft. Updating the standalone action later does not prove the already-added agent copy is updated.

## Lead Nurture Agent use

For Lead Nurture Agent:

1. Create and configure Lead Nurture Agent in the target org.
2. Deploy legacy actions with this guide.
3. Add them from the target org Asset Library.

This can reduce rebuild work for custom actions. It does not make Lead Nurture Agent itself deployable. The same pattern applies to other legacy action projects.

## Checklist

- [ ] Action is custom, not Salesforce-managed setup.
- [ ] Legacy `GenAiFunction` and required `GenAiPlugin` names are exact members in `package.xml`.
- [ ] Backing Apex, Flow, prompt template, object, field, permission, and applicable Custom Lightning Type dependencies are included when used.
- [ ] Rebuilt local-only actions are first deployed and retrieved as standalone assets from the source sandbox.
- [ ] Action appears in **Add from Asset Library** in the target org.
- [ ] Target agent preview passes before publish.

## Sources

- Retrieve and deploy Agentforce metadata: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-deploy-metadata.html
- Agentforce metadata types: https://developer.salesforce.com/docs/ai/agentforce/references/agents-metadata-tooling/agents-metadata.html
