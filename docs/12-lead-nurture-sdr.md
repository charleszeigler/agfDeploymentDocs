# Deploy Lead Nurturing Dependencies

Use this guide to move customer-specific dependencies for Agentforce Lead Nurturing, formerly Agentforce SDR.

> **Required before deploy:** This guide is dependencies-only for the managed Lead Nurturing template. Configure and activate the managed agent in the target org after deploying dependencies.

## Confirm the agent type

| If the source has | Use |
|---|---|
| Managed Lead Nurturing template from Salesforce setup | This guide |
| Custom `aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent` source | [Service Agent](10-service-agent.md) or [Employee Agent](11-employee-agent.md) by agent type |
| Custom compiled agent version metadata | Package-specific compiled-agent instructions after source-org retrieve |

> **Do not package:** Do not list `Bot`, `BotVersion`, `GenAiPlannerBundle`, `GenAiPlugin`, or `GenAiFunction` for the managed-template handoff unless Salesforce confirms a metadata path for that exact org and release.

## Prepare the dependency package

Start from `manifests/lead-nurture-sdr-agent-package.xml`, then replace XML-safe placeholders with real API names.

```bash
cp manifests/lead-nurture-sdr-agent-package.xml manifest/package.xml
```

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

Generic Lead, email, or SDR-named flows in the source org are not automatically Lead Nurturing runtime. Include only flows, prompt templates, Apex actions, and email templates that the implementation owner confirms are customer-owned dependencies.

Salesforce-provided or OOTB Lead Nurturing email templates, including templates in folders such as `Email Templates from Salesforce`, are managed setup artifacts. Do not package those templates. Package only customer-owned templates or customer-owned copies that the implementation owner confirms are part of the deployment.

Prompt templates can reference target-org fields, data providers, and output schemas that are not obvious from `package.xml`. Review each included prompt for `{!$Input:...}` merge fields, `{!$Flow:...}` data providers, `templateDataProviders`, `outputSchema`, and `SOBJECT://...` inputs. Include the required fields, features, provider flows or actions, and `LightningTypeBundle` schemas, or update the prompt before handoff.

> **Stop if:** A prompt template validation fails with an invalid merge field, missing data provider, or missing output schema. Fix the target prerequisite, include the dependency, or remove that prompt from the package before deploy.

Deploy the dependency package with [Deploy a Package](01-deploy-package.md).

> **Do not package:** Do not package Salesforce-provided Lead Nurturing templates, generated emails, draft emails, sent-email history, mailbox connections, EAC auth, cadence runtime state, or Builder activation state. Package only customer-owned metadata such as fields, prompt overrides, custom actions, and separate email templates.

## Complete target setup

> **Manual after deploy:** Lead Nurturing email, agent user, Einstein Activity Capture, data library, cadence, and activation are target-org setup, not package metadata.

In the target org, an admin completes the current Salesforce setup flow for Agentforce Lead Nurturing:

1. Turn on Lead Nurturing and supporting features.
2. Assign manager and sales-user permissions.
3. Create or select the Lead Nurturing agent user.
4. Connect the agent user's email account.
5. Confirm Einstein Activity Capture uses user-level authentication for the agent user.
6. Configure the Lead Nurturing data library.
7. Configure behavior, cadence, language, tone, assignment, and activation in Builder.

Sales users who need to see, edit, reschedule, or cancel agent emails must connect their own email accounts to Einstein Activity Capture in the target org.

## Validate email setup

Lead Nurturing emails are target-org runtime setup. The dependency package can include customer-owned email templates, prompt overrides, fields, actions, and permissions, but it does not connect mailboxes or create Builder activation state.

1. Use a test lead or a customer-approved lead record.
2. Confirm the Lead Nurturing agent user has an active email account connection.
3. Confirm Einstein Activity Capture is active for the agent user and any sales users who manage agent emails.
4. Confirm sender address, cadence, send caps, meeting-booking source, opt-out handling, and assignment rules.
5. Preview the managed agent in Builder and confirm the generated email uses the expected prompt templates and source values.
6. Do not enable automatic sending until the customer approves the previewed email behavior.

## Fill the implementation worksheet

Capture these source-org values before handoff:

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

- Set Up Agentforce Lead Nurturing: https://help.salesforce.com/s/articleView?id=sales.einstein_sdr_setup.htm&type=5
- Retrieve and deploy Agentforce metadata: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-deploy-metadata.html
