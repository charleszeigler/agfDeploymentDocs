# Deploy and Activate a Service Agent

Move a customer-facing Agentforce Service Agent from sandbox to production.

> **Required before deploy:** A Service Agent runs as a dedicated Einstein Agent User. The target-org agent username is a per-org value and must be set before publish.

## When this applies

| Check | Expected |
|---|---|
| Source metadata | `force-app/main/default/aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent` |
| Agent type | `AgentforceServiceAgent` |
| Running user | `default_agent_user` is required |
| Publish path | Deploy source, live preview, publish, activate |

## Values needed

| Value | Use |
|---|---|
| `<SOURCE_ORG_ALIAS>` | Source sandbox for validation or retrieve |
| `<TARGET_ORG_ALIAS>` | Target org for validation, deploy, user setup, and publish |
| `<PACKAGE_XML_PATH>` | Final package manifest |
| `<AGENT_API_NAME>` | Service Agent API name |
| `<AGENT_USER_USERNAME>` | Target-org Einstein Agent User username |

## Prepare the package

Copy `manifests/service-agent-package.xml` to `manifest/package.xml`; replace XML-safe placeholders with real API names.

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
| Agent user access | `PermissionSet` |
| Callout definitions | `NamedCredential`, `ExternalCredential` |

> **Do not package:** Do not include the `User` record for the agent user. Create or select the agent user in the target org.

Identify action targets in the source bundle:

1. Open `force-app/main/default/aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent`.
2. Search in the file for `apex://`.
3. Search in the file for `flow://`.
4. Add every referenced Apex class and Flow to the package manifest.

If source files are not already in the package folder, use [Prepare and Retrieve a Package](01-prepare-and-retrieve-package.md):

1. Retrieve the `AiAuthoringBundle`.
2. Inspect the `.agent` file for dependencies.
3. Update `package.xml`.
4. Retrieve again.

## Validate in the source sandbox

```bash
sf org list metadata --json --metadata-type AiAuthoringBundle --target-org <SOURCE_ORG_ALIAS>
sf agent validate authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <SOURCE_ORG_ALIAS>
```

Fix validation errors before handoff.

## Create the target agent user

Create a dedicated target-org agent user, unless one already exists:

```bash
sf org create agent-user --json --target-org <TARGET_ORG_ALIAS>
```

Copy `result.username`.

- The command creates an Einstein Agent User.
- It assigns Salesforce base Agentforce permissions.
- It does not assign customer-specific data access.

> **Customer-specific value:** Do not guess the agent username. Sandbox refreshes and production orgs use different usernames.
> **Do not package:** Do not move the source sandbox agent user. User records, user licenses, and the final target username are target-org setup.

## Set `default_agent_user`

In the target package copy of the `.agent` file, set the username in `config`:

```text
config:
    default_agent_user: "agent.user.example@customer.com"
```

Validate the local bundle against the target org:

```bash
sf agent validate authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

> **Required before deploy:** This edit applies to editable draft `AiAuthoringBundle` source. If the package uses committed agent version metadata such as `BotVersion`, do not edit the retrieved generated metadata. Create a new target version or set the agent user in Builder.
> **Stop if:** The package still contains a source-sandbox agent username. Replace it before deploy.

## Deploy the package

If source files are not retrieved yet, complete [Prepare and Retrieve a Package](01-prepare-and-retrieve-package.md). Then deploy with [Deploy a Package](01-deploy-package.md).

## Assign custom access to the agent user

Assign the custom access permission set shipped with the package:

```bash
sf org assign permset --json --name Service_Agent_Access --on-behalf-of <AGENT_USER_USERNAME> --target-org <TARGET_ORG_ALIAS>
```

The custom permission set must cover the agent's Apex, Flows, prompt templates, objects, fields, and callouts.

> **Manual after deploy:** Record sharing is not solved by metadata alone. If Apex uses sharing or user-mode access, confirm the agent user can see the target records.

## Preview, publish, activate

Run [Publish and Activate](02-publish-and-activate.md).

## Channel setup

If this Service Agent answers on a website, complete [Migrate Enhanced Web Chat](21-enhanced-web-chat.md) after the agent is active.

## Checklist

- [ ] `<AGENT_API_NAME>` replaced everywhere.
- [ ] Every `apex://`, `flow://`, prompt template, CLT, LWC renderer, object, field, and permission dependency is included.
- [ ] Test classes are included for production deploys.
- [ ] Target agent user is active, licensed, and assigned base Agentforce permissions.
- [ ] `default_agent_user` uses the target-org username.
- [ ] Custom permission set assigned to the agent user.
- [ ] Data 360 package completed first, if used.
- [ ] Live-action preview passes before publish.
- [ ] Active-agent smoke test passes after activation.

## Sources

- Retrieve and deploy Agentforce metadata: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-deploy-metadata.html
- Agentforce metadata types: https://developer.salesforce.com/docs/ai/agentforce/references/agents-metadata-tooling/agents-metadata.html
