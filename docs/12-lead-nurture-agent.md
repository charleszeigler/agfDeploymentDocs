# Deploy Lead Nurture Agent Dependencies

Move customer-specific dependencies for the Agentforce Lead Nurture Agent.

> **Required before deploy:** This guide is dependencies-only for the managed Lead Nurturing template. Configure and activate the managed agent in the target org after deploying dependencies.
> **Stop if:** The plan is to move the managed Lead Nurturing agent itself, or managed Lead Nurturing agent changes, by change set, Metadata API, or Salesforce CLI. Salesforce documents that this path is not supported. Create and configure the managed agent directly in the target org.

Salesforce previously used a sales-development name for this managed agent. Treat the managed Lead Nurturing sales engagement template as covered by this deployment limitation unless Salesforce Support confirms otherwise for the customer's exact org and release.

## Confirm the agent type

| If the source has | Use |
|---|---|
| Managed Lead Nurturing template from Salesforce setup | This guide |
| Custom `aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent` source | [Service Agent](10-service-agent.md) or [Employee Agent](11-employee-agent.md) by agent type |
| Custom compiled agent version metadata | Package-specific compiled-agent instructions after source-org retrieve |

> **Do not package:** Do not list `Bot`, `BotVersion`, `GenAiPlannerBundle`, `GenAiPlugin`, or `GenAiFunction` for the managed Lead Nurturing template. Even if metadata deployment appears to succeed in one org, Salesforce does not support this deployment path for the packaged Lead Nurturing agent.

## What can be deployed

| Can move with metadata | Must be configured in the target org |
|---|---|
| Customer-owned fields, objects, permission sets, Apex, tests, Flows, prompt template overrides, CLTs, LWC renderers, and separate customer-owned email templates | Managed Lead Nurturing agent, agent user, mailbox, Einstein Activity Capture, sender behavior, cadence, data library, Builder preview, activation, generated emails, and runtime state |

## Values needed

| Value | Use |
|---|---|
| `<TARGET_ORG_ALIAS>` | Target org for dependency deploy and setup validation |
| `<PACKAGE_XML_PATH>` | Lead Nurture dependency package manifest |
| `<SOURCE_ORG_ALIAS>` | Only when retrieving dependency metadata from the source sandbox |

The email sender, EAC status, cadence, data library, meeting source, prompt overrides, and opt-out process are captured in the worksheet below, not in the general setup guide.

## Prepare the dependency package

Copy `manifests/lead-nurture-agent-package.xml` to `manifest/package.xml`, then replace XML-safe placeholders with real API names.

Common dependencies:

| Dependency | Metadata type |
|---|---|
| Custom Lead, Contact, or Account fields | `CustomField` |
| Custom nurture tracking objects | `CustomObject` |
| Customer-owned prompt template overrides | `GenAiPromptTemplate` |
| Custom invocable actions and tests | `ApexClass`, `Flow` |
| Structured custom action schemas | `LightningTypeBundle` |
| Custom CLT editor or renderer components | `LightningComponentBundle` |
| Customer-owned email templates or customer-owned copies, if separate from managed setup | `EmailTemplate` |
| Data access and setup permissions | `PermissionSet` |
| Data 360 dependencies | Separate Data Kit package |

Generic Lead, email, or nurture-related flows are not automatically Lead Nurturing runtime. Include only confirmed customer-owned flows, prompts, Apex actions, and email templates.

Salesforce-provided Lead Nurturing email templates, including templates in folders such as `Email Templates from Salesforce`, are managed setup artifacts. Package only confirmed customer-owned templates or copies.

Prompt templates can hide target dependencies. Review each included prompt for `{!$Input:...}` fields, `{!$Flow:...}` providers, `templateDataProviders`, `outputSchema`, and `SOBJECT://...` inputs. Include required fields, features, provider flows/actions, and `LightningTypeBundle` schemas, or update the prompt before handoff.

> **Stop if:** A prompt template validation fails with an invalid merge field, missing data provider, or missing output schema. Fix the target prerequisite, include the dependency, or remove that prompt from the package before deploy.

Deploy the dependency package with [Deploy a Package](01-deploy-package.md).

> **Do not package:** Do not package Salesforce-provided Lead Nurturing templates, generated emails, draft emails, sent-email history, mailbox connections, EAC auth, cadence runtime state, or Builder activation state. Package only customer-owned metadata such as fields, prompt overrides, custom actions, and separate email templates.

## Complete target setup

> **Manual after deploy:** Lead Nurturing email, agent user, Einstein Activity Capture, data library, cadence, and activation are target-org setup, not package metadata.

In the target org, complete the current Salesforce setup flow:

1. Turn on Lead Nurturing and supporting features.
2. Assign manager and sales-user permissions.
3. Create or select the Lead Nurturing agent user.
4. Connect the agent user's email account.
5. Confirm Einstein Activity Capture uses user-level authentication for the agent user.
6. Confirm the connected email address matches the Email field on the Lead Nurturing agent user record and is not connected to another user.
7. Configure the Lead Nurturing data library.
8. Configure behavior, cadence, language, tone, assignment, meeting scheduling, opt-out handling, and activation in Builder.

Sales users who need to see, edit, reschedule, or cancel agent emails must connect their own email accounts to Einstein Activity Capture in the target org.

## Validate email setup

Lead Nurturing email is target-org runtime setup. The dependency package can include customer-owned email templates, prompt overrides, fields, actions, and permissions; it does not connect mailboxes or create Builder activation state.

1. Use a test lead or a customer-approved lead record.
2. Confirm the Lead Nurturing agent user has an active email account connection.
3. Confirm Einstein Activity Capture is active for the agent user and any sales users who manage agent emails.
4. Confirm sender address, cadence, send caps, meeting-booking source, opt-out handling, and assignment rules.
5. If Send as Seller is on, confirm record owners have Inbox and Einstein Activity Capture access.
6. Preview the managed agent in Builder and confirm the generated email uses the expected prompt templates and source values.
7. Do not enable automatic sending until the customer approves the previewed email behavior.

## Fill the implementation worksheet

Capture these values before handoff:

| Setting | Source value |
|---|---|
| Company or product context | `__________` |
| Tone and persona | `__________` |
| Email send caps and cadence | `__________` |
| Agent sender mailbox | `__________` |
| Agent user EAC status | `__________` |
| Sales-user EAC requirement | `__________` |
| Meeting booking source | `__________` |
| Lead assignment rules | `__________` |
| Opt-out process | `__________` |
| Customer prompt template overrides | `__________` |
| Data library or knowledge source | `__________` |
| Data 360 dependency, if any | `__________` |

> **Customer-specific value:** Email sender, EAC auth, meeting links, cadence, opt-out behavior, and data-library choices are target-org values. Package only customer-owned metadata dependencies.

## Validate

- Confirm the dependency deploy succeeded.
- Confirm Lead Nurturing is enabled in the target org.
- Confirm the agent user email and EAC connection are active.
- Confirm required sales users connected email to EAC.
- Preview the managed agent in Builder with a test lead or customer-approved lead.
- Confirm generated emails use the expected prompt templates and source values.
- Confirm opt-out, assignment, and meeting-booking behavior.

## Checklist

- [ ] Dependency package contains no managed-template runtime metadata.
- [ ] Custom fields, objects, prompt templates, actions, CLTs, LWC components, and permission sets are included when used.
- [ ] Data 360 package prepared separately when used.
- [ ] Agent user, email connection, EAC, data library, cadence, assignment, and activation are documented as target manual steps, not `package.xml` members.
- [ ] Worksheet completed from the source org.
- [ ] Builder preview and email validation completed in the target org.

## Sources

- Considerations for Using Agentforce Lead Nurturing: https://help.salesforce.com/s/articleView?id=sales.sales_agent_sdr_considerations.htm&type=5
- Agentforce metadata deployment and retrieval limitations knowledge article: https://help.salesforce.com/s/articleView?id=005228853&type=1
- Set Up Agentforce Lead Nurturing: https://help.salesforce.com/s/articleView?id=sales.einstein_sdr_setup.htm&type=5
- Retrieve and deploy Agentforce metadata: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-deploy-metadata.html
