# Deploy Lead Nurture Agent Dependencies

Move project-owned dependencies for the Agentforce Lead Nurture Agent.

**Required before deploy:** This guide is dependencies-only for the managed Lead Nurturing template. Configure and activate the managed agent in the target org after deploying dependencies.

**Stop if:** The plan is to move the managed Lead Nurturing agent itself, or managed Lead Nurturing agent changes, by change set, Metadata API, or Salesforce CLI. Salesforce documents that this path is not supported. Create and configure the managed agent directly in the target org.

Treat the managed Lead Nurturing sales engagement template as covered by this limitation unless Salesforce Support confirms otherwise for the target org and release.

## Confirm the agent type

| Source has | Use |
|---|---|
| Managed Lead Nurturing template from Salesforce setup | This guide |
| Custom `aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent` source | [Service Agent](10-service-agent.md) or [Employee Agent](11-employee-agent.md) by agent type |
| Custom compiled agent version metadata | Package-specific compiled-agent instructions after source-org retrieve |

**Do not package:** Do not list managed Lead Nurturing runtime metadata. Even if metadata deployment appears to succeed in one org, Salesforce does not support this deployment path for the packaged Lead Nurturing agent.

## What can be deployed

| Scope | Items |
|---|---|
| Moves with metadata | Project-owned fields, objects, permission sets, Apex, tests, Flows, prompt template overrides, callout configuration for custom actions, and separate project-owned email templates |
| Target-org setup | Managed Lead Nurturing agent, agent user, mailbox, Einstein Activity Capture, sender behavior, cadence, data library, Builder preview, activation, generated emails, and runtime state |

Legacy project actions can move separately with [Legacy Agent Actions](13-legacy-agent-actions.md). They can reduce manual rebuild work because the target agent can add them from the Asset Library.

## Prepare the dependency package

Copy `manifests/lead-nurture-agent-package.xml` to `manifest/package.xml`; replace XML-safe placeholders with real API names.

Common dependencies:

| Dependency | Metadata type |
|---|---|
| Custom Lead, Contact, or Account fields | `CustomField` |
| Custom nurture tracking objects | `CustomObject` |
| Project-owned prompt template overrides | `GenAiPromptTemplate` |
| Custom invocable actions and tests | `ApexClass`, `Flow` |
| Project-owned email templates or project-owned copies, if separate from managed setup | `EmailTemplate` |
| Callout configuration for custom enrichment or outbound actions | `NamedCredential`, `ExternalCredential` |
| Data access and setup permissions | `PermissionSet` |
| Data 360 dependencies | Separate Data Kit package |
| Project-owned legacy agent actions | Separate legacy agent actions package |

Package rules:

- Include only confirmed project-owned flows, prompts, Apex actions, and email templates.
- Do not assume generic Lead, email, or nurture-related flows are Lead Nurturing runtime.
- Package only confirmed project-owned email templates or project-owned copies.
- Treat Salesforce-provided templates, including `Email Templates from Salesforce`, as managed setup artifacts.
- Review prompt templates for `{!$Input:...}`, `{!$Flow:...}`, `templateDataProviders`, and `SOBJECT://...`.
- Include required fields, features, provider flows/actions, permissions, and callout configuration, or update the prompt before handoff.

**Stop if:** A prompt template validation fails with an invalid merge field, missing data provider, or missing output schema. Fix the target prerequisite, include the dependency, or remove that prompt from the package before deploy.

Next:

1. Retrieve project-owned dependency files with [Prepare and Retrieve a Package](01-prepare-and-retrieve-package.md).
2. Deploy the dependency package with [Deploy a Package](01-deploy-package.md).

**Do not package:** Do not package Salesforce-provided Lead Nurturing templates, generated emails, draft emails, sent-email history, mailbox connections, EAC auth, cadence runtime state, or Builder activation state. Package only project-owned metadata.

## Optional legacy agent actions

Use only for project-owned legacy agent actions.

- Does not move or update the managed Lead Nurture Agent itself.
- Uses the `GenAiPlugin` and `GenAiFunction` path for legacy Agent Builder and committed Builder assets.
- Also applies to other Agentforce projects that use Asset Library assets.

1. Prepare the managed Lead Nurture Agent in the target org.
2. Deploy the legacy agent actions with [Legacy Agent Actions](13-legacy-agent-actions.md).
3. Open the target agent draft in Agentforce Builder.
4. Select **Add Resource** > **Add from Asset Library**.
5. Add the legacy project action.
6. Preview generated email behavior and action behavior before activation.

**Manual after deploy:** Adding a legacy action to the managed target agent is a Builder step. The package only makes the action available.

## Complete target setup

**Manual after deploy:** Lead Nurturing email, agent user, Einstein Activity Capture, data library, cadence, and activation are target-org setup, not package metadata.

In the target org:

1. Turn on Lead Nurturing and supporting features.
2. Assign manager and sales-user permissions.
3. Create or select the Lead Nurturing agent user.
4. Connect the agent user's email account.
5. Confirm Einstein Activity Capture uses user-level authentication for the agent user.
6. Confirm the connected email address matches the Email field on the Lead Nurturing agent user record and is not connected to another user.
7. Configure the Lead Nurturing data library.
8. Configure behavior, cadence, language, tone, assignment, meeting scheduling, opt-out handling, and activation in Builder.

Sales users must connect their own email accounts to EAC if they need to see, edit, reschedule, or cancel agent emails.

## Validate email setup

Lead Nurturing email is target-org runtime setup.

Package can include:

- Project-owned email templates
- Prompt overrides
- Fields
- Actions
- Permissions

Package does not connect mailboxes or create Builder activation state.

1. Use a test lead or an approved lead record.
2. Confirm the Lead Nurturing agent user has an active email account connection.
3. Confirm Einstein Activity Capture is active for the agent user and any sales users who manage agent emails.
4. Confirm sender address, cadence, send caps, meeting-booking source, opt-out handling, and assignment rules.
5. If Send as Seller is on, confirm record owners have Inbox and Einstein Activity Capture access.
6. Preview the managed agent in Builder and confirm the generated email uses the expected prompt templates and source values.
7. Do not enable automatic sending until the previewed email behavior is approved.

## Fill the implementation worksheet

Capture before handoff:

| Setting | Value |
|---|---|
| Company or product context | |
| Tone and persona | |
| Email send caps and cadence | |
| Agent sender mailbox | |
| Agent user EAC status | |
| Sales-user EAC requirement | |
| Meeting booking source | |
| Lead assignment rules | |
| Opt-out process | |
| Project prompt template overrides | |
| Data library or knowledge source | |
| Data 360 dependency, if any | |

**Target-org value:** Email sender, EAC auth, meeting links, cadence, opt-out behavior, and data-library choices are target-org values. Package only project-owned metadata dependencies.

## Validate

- Confirm the dependency deploy succeeded.
- Confirm Lead Nurturing is enabled in the target org.
- Confirm the agent user email and EAC connection are active.
- Confirm required sales users connected email to EAC.
- Preview the managed agent in Builder with a test lead or approved lead.
- Confirm generated emails use the expected prompt templates and source values.
- Confirm opt-out, assignment, and meeting-booking behavior.

## Checklist

- [ ] Dependency package contains no managed-template runtime metadata.
- [ ] Custom fields, objects, prompt templates, actions, email templates, callout configuration, and permission sets are included when used.
- [ ] Legacy project actions are packaged separately when used.
- [ ] Data 360 package prepared separately when used.
- [ ] Agent user, email connection, EAC, data library, cadence, assignment, and activation are documented as target manual steps, not `package.xml` members.
- [ ] Worksheet completed from the source org.
- [ ] Builder preview and email validation completed in the target org.

## Sources

- Considerations for Using Agentforce Lead Nurturing: https://help.salesforce.com/s/articleView?id=sales.sales_agent_sdr_considerations.htm&type=5
- Agentforce metadata deployment and retrieval limitations knowledge article: https://help.salesforce.com/s/articleView?id=005228853&type=1
- Set Up Agentforce Lead Nurturing: https://help.salesforce.com/s/articleView?id=sales.einstein_sdr_setup.htm&type=5
- Retrieve and deploy Agentforce metadata: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-deploy-metadata.html
