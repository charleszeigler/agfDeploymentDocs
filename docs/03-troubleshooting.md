# Troubleshooting

Use this when deployment, publish, activation, or channel setup fails.

## Package deployment

| Symptom | What to do |
|---|---|
| `Required scope (--manifest / --metadata / --source-dir) is required` | Run from the DX project folder and include `--manifest <PACKAGE_XML_PATH>`. |
| Quick deploy cannot find the job | Quick deploy promotes a successful `sf project deploy validate` job, not a sandbox `--dry-run` job. |
| Apex coverage fails in production | Include matching test classes and use `RunLocalTests`, or fix org-wide coverage before deploy. |
| Deploy succeeds but expected components are missing | Confirm the component is listed in `package.xml` and was retrieved into `force-app/main/default`. |

## Agentforce

| Symptom | What to do |
|---|---|
| `INVALID_TYPE` for `AiAuthoringBundle` or `GenAiPromptTemplate` | Confirm Agentforce and Prompt Builder are enabled and provisioned in the target org. |
| `AgentApiNotFound` | Confirm the org and running admin user can access Agentforce APIs. |
| `Required fields are missing: [BundleType]` | The `.bundle-meta.xml` file is malformed. It must include `<bundleType>AGENT</bundleType>`. |
| `Unknown metadata type 'Agent'` | Do not put `Agent` in `package.xml`. Use explicit metadata types. |
| Live preview fails on `default_agent_user` | Fix the Service Agent user in the target org. Publishing will not fix it. |
| Live preview reaches the action but returns blank data | Check object, field, and record access for the running user. Service Agents run as the dedicated agent user. Employee Agents run as the logged-in employee. |
| Employee permission set deploy fails with `In field: botDefinition - no Bot named ... found` | The permission set includes `agentAccesses` before the target BotDefinition exists. Deploy the Employee Agent source first, publish and activate it, then deploy the access permission set. |
| Published Employee Agent preview fails with `Invalid user ID provided on start session` | Confirm the agent is active, the employee has Salesforce Agentforce user access, the package permission set includes `agentAccesses`, and the permission set is assigned. Then test from the Lightning Agentforce panel as the assigned user. |
| Prompt template deploys but preview fails on a provider | Confirm the prompt template provider exists and is active in the target org. Some provider setup is Builder-managed. |

## Lead Nurture Agent

| Symptom | What to do |
|---|---|
| Runtime metadata deploy fails for Lead Nurture Agent | Expected here. Deploy dependencies only, then configure Lead Nurture Agent in Builder. |
| Prompt template deploy fails with an invalid merge field, provider, or schema | Review the prompt for `{!$Input:...}` fields, `{!$Flow:...}` data providers, `templateDataProviders`, `outputSchema`, and `SOBJECT://...` inputs. Add the missing target field or feature, include the provider flow or applicable schema metadata, or remove/update the prompt. |
| Emails do not send | Confirm the Lead Nurture Agent user email account and Einstein Activity Capture connection are active in the target org. |
| Sales users cannot see or manage agent emails | Confirm each sales user connected email to Einstein Activity Capture in the target org. |

## Data 360

| Symptom | What to do |
|---|---|
| `FUNCTIONALITY_NOT_ENABLED ... [CdpDataKit]` | Complete Data 360 provisioning and Data Kit access before packaging or deploying. |
| Missing `FieldSrcTrgtRelationship` | Retrieve the exact missing relationship members from the source org, remove related key qualifier files, and redeploy in a sandbox first. |
| Connectors are inactive after deploy | Reauthorize connectors in the target org, then deploy Data Kit components again if needed. |
| Agent returns no Data 360 result | Confirm data streams, mappings, identity, calculated insights, search indexes, and data graphs have completed in the target org. |

## Enhanced Web Chat

| Symptom | What to do |
|---|---|
| Deployment plan expects change sets to move Enhanced Web Chat | Stop. Salesforce change sets list Embedded Service Deployment only for standard Chat, not Enhanced Chat. |
| `Label data too large:(max length:80)` during Web Chat metadata deploy | Stop and use the manual target-org rebuild path. Salesforce Known Issue W-15932771 lists Messaging for Web deployment as not supported. |
| Chat button does not load | Check the target org deployment is published, the website domain is in CORS, the snippet or Embedded Messaging component points at the target deployment, and the page referrer policy is compatible. |
| Experience Builder chat does not appear | Confirm the Embedded Messaging component is on the site, the correct deployment, service URL, and site endpoint are selected, and the site domain is allowed in CORS. |
| Authenticated chat opens as an unauthenticated session | Confirm User Verification or equivalent auth setup was configured in the target org. Treat auth settings as manual target setup unless validated as metadata for that org. |
| Conversation does not route | Check the Omni routing flow, queue, routing configuration, and agent/channel connection in the target org. |

## What to send for help

Send the command, full JSON output, package type, target org type, and failed step. Do not publish or activate after failed validation.
