# Move an Agent with AiAgentDefinition (API v68+)

Starting in API v68 (Winter '27), retrieve and deploy an Agentforce agent as two metadata types instead of hand-maintaining a `package.xml` dependency graph. This guide is additive. The [AiAuthoringBundle path](10-service-agent.md) remains the recommended default whenever any org in the path is still on API 67.

## When this applies

| Field | Value |
|---|---|
| Metadata types | `AiAgentDefinition` (the agent), `AiAgentDefinitionVersion` (a version of it) |
| Requires | Source AND target org both on API 68.0+ (Winter '27; preview sandboxes rolled out the week of August 24, 2026) |
| Replaces | Hand-listing `AiAuthoringBundle`, `Bot`, `GenAiPlannerBundle`, and every `ApexClass`, `Flow`, `GenAiPromptTemplate`, `GenAiFunction`, `GenAiPlugin` the agent depends on |
| Deploy path | Metadata API and change sets only. Not 1GP or 2GP/unlocked packaging |
| CLI | Update to the Agentforce DX CLI shipped with SDR 13.1.1 or later |

**Stop if:** the source or target org is still on API 67.0. Use [Deploy and Activate a Service Agent](10-service-agent.md) or [Deploy and Activate an Employee Agent](11-employee-agent.md) instead. Staying on the old types with `<version>67.0</version>` is fully supported; this is not a forced migration.

## Retrieve everything with one command

Name the agent's API name and the CLI resolves topic and action schemas, the agent graph, Agent Script source, and every Flow, Apex class, and Prompt Template an action invokes:

```bash
sf project retrieve start --metadata AiAgentDefinitionVersion --root-type-with-dependencies AiAgentDefinitionVersion --target-org <SOURCE_ORG_ALIAS>
```

## Build package.xml

Use [manifests/agent-definition-v68-package.xml](../manifests/agent-definition-v68-package.xml) as a starting point:

```xml
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>AGENT_API_NAME</members>
        <name>AiAgentDefinition</name>
    </types>
    <types>
        <members>AGENT_API_NAME#*</members>
        <name>AiAgentDefinitionVersion</name>
    </types>
    <version>68.0</version>
</Package>
```

`AiAgentDefinitionVersion` members use `#`, unlike any other metadata type in this repo:

| Member | Moves |
|---|---|
| `AGENT_API_NAME#1` | That one version only |
| `AGENT_API_NAME#*` | Every version of that agent |
| `*` | Every agent version in the org |

**Stop if:** the first deploy to a clean target org lists only `AiAgentDefinitionVersion`. A version with no parent `AiAgentDefinition` in the same deploy fails outright. Always include both types on the first deploy to a target org.

## Set the target agent user

Same rule as the [AiAuthoringBundle path](10-service-agent.md#set-the-target-agent-user): do not edit retrieved metadata, with one documented exception — the agent user for the target org.

## Keep versions matched across orgs

Deploy v1–v3 to production, then create v4 in production to fix the agent user? Create the matching v4 in the sandbox too. An unmatched version number blocks the next sandbox version from deploying.

## Do not mix old and new types

`Bot` / `GenAiPlannerBundle` alongside `AiAgentDefinition` / `AiAgentDefinitionVersion` in the same deploy is unsupported and is meant to fail validation. Pick one representation per deploy. If any org in the path is on API 67, use the old types everywhere in that deploy.

## Deploy, validate, publish, activate

Once retrieved, the [Validate and deploy](deployment-workflow.md#4-validate-and-deploy) commands and the [Preview, publish, activate](10-service-agent.md#preview-publish-activate) steps are unchanged. This guide only replaces how the package is retrieved and packaged, not how it is validated, previewed, published, or activated.

## Checklist

- [ ] Source and target org both confirmed on API 68.0+ before starting.
- [ ] CLI updated to the SDR 13.1.1+ Agentforce DX release.
- [ ] `package.xml` uses `<version>68.0</version>` and only `AiAgentDefinition` / `AiAgentDefinitionVersion` — no `Bot`, `BotVersion`, or `GenAiPlannerBundle` in the same deploy.
- [ ] First deploy to a clean target org includes the full `AiAgentDefinition`, not a version only.
- [ ] Target agent user set on the retrieved version; nothing else edited.
- [ ] Version numbers matched between source and target after any target-only version bump.
- [ ] Deploying via Metadata API or change set, not 1GP/2GP packaging.
- [ ] If a step fails, use [Troubleshooting](03-troubleshooting.md).

## Sources

- Retrieve and deploy Agentforce metadata: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-deploy-metadata.html
