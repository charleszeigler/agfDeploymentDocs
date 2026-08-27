# Troubleshooting

Use this when package deployment, agent publish or activation, Data 360, Lead Nurture Agent email, or web messaging validation fails.

## Package deployment

| Symptom | What to do |
|---|---|
| `Required scope (--manifest / --metadata / --source-dir) is required` | Run from the DX project folder and include `--manifest <PACKAGE_XML_PATH>`. |
| Retrieve says a package member does not exist | Check the member format in `package.xml`: fields must be `Object.Field`, reports and email templates must be `Folder/DeveloperName`, and most other members use API name without a file extension. |
| Quick deploy cannot find the job | Quick deploy promotes a successful `sf project deploy validate` job, not a sandbox `--dry-run` job. Do not run `validate` / `quick` on a sandbox. |
| `--dry-run` succeeded, real deploy failed | Expected. `--dry-run` does not save components and is not dress rehearsal. Deploy for real to a fresh Developer sandbox with `RunLocalTests` before production. |
| Dress rehearsal skipped because the sandbox already has the package | Use a Developer sandbox that does not already contain this package, agent, prompt templates, or Data Kit. Warm orgs hide first-install failures. |
| Apex coverage fails in production | Include matching test classes and use `RunLocalTests` on the Developer-sandbox dress rehearsal and on production `validate`, or fix org-wide coverage before deploy. |
| Deploy succeeds but expected components are missing | Confirm the component is listed in `package.xml` and was retrieved into `force-app/main/default`. |
| CLI `--wait` times out | Timeout is not a deploy failure. Default `--wait` is 33 minutes. Resume with `sf project deploy resume` or check `sf project deploy report`. Never use `--ignore-errors` on production. |
| `fetch failed` / socket closed | CLI or network. Retry the same command. Not necessarily a bad Apex compile or test. |

## Service and Employee Agents

| Symptom | What to do |
|---|---|
| `INVALID_TYPE` for `AiAuthoringBundle` or `GenAiPromptTemplate` | Confirm Agentforce and Prompt Builder are enabled and provisioned in the target org. |
| `AgentApiNotFound` | Confirm the org and running admin user can access Agentforce APIs. |
| `Required fields are missing: [BundleType]` | The `.bundle-meta.xml` file is malformed. It must include `<bundleType>AGENT</bundleType>`. |
| `Unknown metadata type 'Agent'` | Do not put `Agent` in `package.xml`. Use explicit metadata types. |
| Refreshed sandbox has an empty Agent Script: `AiAuthoringBundle` retrieve returns only `.bundle-meta.xml` with no `.agent` files, `GenAiPlannerBundle` is missing, or the retrieve throws `UNKNOWN_EXCEPTION` | Known post-refresh gap: Agent Script source does not always carry into a sandbox refreshed from another org. Retrieve the bundle from the org that still has it, or rebuild/re-import the agent in the refreshed org. Do not treat the empty `.agent` retrieve as the source of truth. Keep the retrieve `ErrorId` and open a Salesforce support case if it persists. |
| Live preview fails on `default_agent_user` | Official Agent Script puts the field under `access:`, not `config:`. Set `access.default_agent_user` to the target-org username and fix the Service Agent user in the target org. Publishing will not fix it. See [Agent Script Blocks](https://developer.salesforce.com/docs/ai/agentforce/guide/ascript-blocks.html). |
| Live preview reaches the action but returns blank data | Check object, field, and record access for the running user. Service Agents run as the dedicated agent user. Employee Agents run as the logged-in employee. |
| Apex action returns no rows for the agent user but works for an admin | Check the class API version in `.cls-meta.xml`. At 67.0 and later, Apex runs in user mode and defaults to `with sharing`. Grant the running user the object, field, and record access the action needs, or set the sharing and execution mode explicitly. |
| Employee access permission set deploy fails before publish | The permission set includes `agentAccesses` too early. Deploy the Employee Agent source first, publish and activate it, then deploy the access permission set. |
| Published Employee Agent preview fails with `Invalid user ID provided on start session` | Confirm the agent is active, the employee has Salesforce Agentforce user access, the package permission set includes `agentAccesses`, and the permission set is assigned. Then test from the Lightning Agentforce panel as the assigned user. |
| Prompt template deploys but preview fails on a provider | Confirm the prompt template provider exists and is active in the target org. Some provider setup is Builder-managed. |

## AiAgentDefinition (API v68+)

Use [Move an Agent with AiAgentDefinition](14-agent-dx-v68-metadata.md) for the happy path.

| Symptom | What to do |
|---|---|
| Deploy fails on a version with no parent definition | The first deploy to a clean target org must include the full `AiAgentDefinition`, not `AiAgentDefinitionVersion` alone. |
| Validation fails when the package mixes old and new agent types | `Bot`/`GenAiPlannerBundle` alongside `AiAgentDefinition`/`AiAgentDefinitionVersion` in one deploy is unsupported by design. Pick one representation per deploy. |
| Retrieve or deploy rejects `AiAgentDefinition`/`AiAgentDefinitionVersion` | Confirm both the source and target org are on API 68.0. A sandbox already on 68 with production still on 67 must stay on the old types until production catches up. |
| Next sandbox version is blocked after fixing the agent user in production | Version numbers must match between orgs. Create the same version number in the sandbox that you created in production. |
| Redeployed `AiAgentDefinitionVersion` behaves unexpectedly | Do not edit retrieved metadata. The one documented exception is the agent user for the target org. |

## Lead Nurture Agent

| Symptom | What to do |
|---|---|
| Runtime metadata deploy fails for Lead Nurture Agent | Expected here. Deploy dependencies only, then configure Lead Nurture Agent in Builder. |
| Prompt template deploy fails with an invalid merge field, provider, or schema | Review the prompt for `{!$Input:...}` fields, `{!$Flow:...}` data providers, `templateDataProviders`, `outputSchema`, and `SOBJECT://...` inputs. Add the missing target field or feature, include the provider flow or applicable schema metadata, or remove/update the prompt. |
| Emails do not send | Confirm the Lead Nurture Agent user email account and Einstein Activity Capture connection are active in the target org. |
| Sales users cannot see or manage agent emails | Confirm each sales user connected email to Einstein Activity Capture in the target org. |

## Data 360

Use [Deploy a Data 360 DevOps Data Kit](20-data-360-data-kit.md) for the happy path. Same-data-space is required.

| Symptom | What to do |
|---|---|
| `FUNCTIONALITY_NOT_ENABLED ... [CdpDataKit]` | Complete Data 360 provisioning and DevOps Data Kit access before packaging or deploying. Provision can take up to 60 minutes. |
| Missing `FieldSrcTrgtRelationship` | Retrieve the exact missing relationship members from the source org, remove related key qualifier files, and redeploy in a sandbox first. |
| Connectors are inactive after deploy | Reauthorize connectors in the target org, then deploy Data Kit components again if needed. |
| Agent returns no Data 360 result | Confirm data streams, mappings, identity, calculated insights, search indexes, and data graphs have completed in the target org. |
| Agent RAG or knowledge action returns nothing even though the search index shows Ready | A DevOps Data Kit moves metadata, not data. Refresh the data stream, confirm the DMO has rows in Data Explorer or Query Editor, then rebuild the search index until it is Ready and has rows. Rebuilding is a search index operation: a retriever holds no data, so there is nothing to rebuild on it. Separately, only no-code retrievers are kit-supported — if this agent grounds on a Pro-code/ADL retriever, recreate it with the Agentforce Data Library in the target org. |
| Retriever works in the prompt template tester but fails through the agent | The tester runs as your admin; the agent runs as the bot (Run-As) user. Grant the bot user Data Cloud access and the retriever's data space on the bot user's permission set. Granting the data space to the admin does not cover the bot user. |
| Retriever activation or deploy fails after the search index is Ready and references were removed | The retriever is referenced by an ensemble retriever version, active or inactive. Delete every retriever version that still references it. Editing the current ensemble is not enough, because prior versions are immutable and still hold the reference. |
| `Prepend fields to each chunk` is off in the target after deploying a search index | Known issue: the deploy can drop the chunking "prepend fields" setting, which orphans chunks and degrades retrieval. Re-enable the chunking configuration on the search index in the target org and rebuild. |

## Enhanced Web Chat

| Symptom | What to do |
|---|---|
| Deployment plan expects change sets to move Enhanced Web Chat | The [Components Available in Change Sets](https://help.salesforce.com/s/articleView?id=platform.changesets_about_components.htm&type=5) table lists Embedded Service Deployment as limited to standard Chat, not Enhanced Chat. Rebuild and publish the Embedded Service Deployment in the target org. |
| `Label data too large:(max length:80)` during Web Chat metadata deploy | Rebuild and publish the web deployment in the target org, then reconnect the agent and routing configuration. Salesforce documents this as a migration limitation for generated-site metadata scenarios. |
| Chat button does not load | Check the target org deployment is published, the website domain is in CORS, the snippet or Embedded Messaging component points at the target deployment, and the page referrer policy is compatible. |
| Experience Builder chat does not appear | Confirm the Embedded Messaging component is on the site, the correct deployment, service URL, and site endpoint are selected, and the site domain is allowed in CORS. |
| Authenticated chat opens as an unauthenticated session | Confirm User Verification or equivalent auth configuration was completed in the target org. Treat auth settings as target-org values unless validated as metadata for that org. |
| Conversation does not route | Check the Omni routing flow, queue, routing configuration, and agent/channel connection in the target org. |
| No new `MessagingSession` after website or test-page chat | Fix publish status, snippet or Embedded Messaging component selection, CORS/domain settings, and routing before declaring the channel ready. |
| Session stays `Waiting` and no `AgentWork` appears | Confirm queue membership, service presence configuration, Omni user availability, and routing. Presence alone is not a website smoke test. |

## What to send for help

Send the command, full JSON output, package type, target org type, and failed step. Do not publish or activate after failed validation.
