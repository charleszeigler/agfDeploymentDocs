# Deploy Lead Nurture Agent Dependencies

Move custom dependencies for Lead Nurture Agent.

**Required before deploy:** This guide is dependencies-only for Lead Nurture Agent. Configure and activate the agent in the target org after deploying dependencies.

**Stop if:** The plan is to move Lead Nurture Agent itself, or Lead Nurture Agent changes, by change set, Metadata API, or Salesforce CLI. Salesforce documents that this path is not supported. Create and configure the agent directly in the target org.

Treat the Lead Nurture Agent sales engagement template as covered by this limitation unless Salesforce Support confirms otherwise for the target org and release.

## Confirm the agent type

| Source has | Use |
|---|---|
| Lead Nurture Agent from Salesforce setup | This guide |
| Agent Script in `aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent` | [Service Agent](10-service-agent.md) or [Employee Agent](11-employee-agent.md) by agent type |
| Custom compiled agent version metadata | Package-specific compiled-agent instructions after source-org retrieve |

Keep Lead Nurture Agent runtime metadata out of the package. Even if metadata deployment appears to succeed in one org, Salesforce does not support this deployment path for the packaged Lead Nurture Agent.

## What can be deployed

| Scope | Items |
|---|---|
| Moves with metadata | Custom fields, custom objects, permission sets, Apex, tests, Flows, prompt template overrides, callout configuration for custom actions, and separate custom email templates |
| Target-org setup | Lead Nurture Agent, agent user, mailbox, Einstein Activity Capture, sender behavior, cadence, data library, Builder preview, activation, generated emails, and runtime state |

Legacy project actions can move separately with [Legacy Agent Actions](13-legacy-agent-actions.md). They can reduce manual rebuild work because the target agent can add them from the Asset Library.

## Prepare the dependency package

Copy `manifests/lead-nurture-agent-package.xml` to `manifest/package.xml`; replace XML-safe placeholders with real API names.

Common dependencies:

| Dependency | Metadata type |
|---|---|
| Custom Lead, Contact, or Account fields | `CustomField` |
| Custom nurture tracking objects | `CustomObject` |
| Custom prompt template overrides | `GenAiPromptTemplate` |
| Custom invocable actions and tests | `ApexClass`, `Flow` |
| Custom email templates or custom copies, if separate from Salesforce setup | `EmailTemplate` |
| Callout configuration for custom enrichment or outbound actions | `NamedCredential`, `ExternalCredential` |
| Data access and setup permissions | `PermissionSet` |
| Data 360 dependencies | Separate Data Kit package |
| Custom legacy agent actions | Separate legacy agent actions package |

Package rules:

- Include only confirmed custom flows, prompts, Apex actions, and email templates.
- Do not assume generic Lead, email, or nurture-related flows are Lead Nurture Agent runtime.
- Package only confirmed custom email templates or custom copies.
- Treat Salesforce-provided templates, including `Email Templates from Salesforce`, as Salesforce setup artifacts.
- Leave Salesforce-provided Lead Nurture Agent templates, generated emails, draft emails, sent-email history, mailbox connections, EAC auth, cadence runtime state, and Builder activation state out of the package.
- Review prompt templates for `{!$Input:...}`, `{!$Flow:...}`, `templateDataProviders`, and `SOBJECT://...`.
- Include required fields, features, provider flows/actions, permissions, and callout configuration, or update the prompt before handoff.

**Stop if:** A prompt template validation fails with an invalid merge field, missing data provider, or missing output schema. Fix the target prerequisite, include the dependency, or remove that prompt from the package before deploy.

Next:

1. Retrieve custom dependency files with [Deploy a Package](deployment-workflow.md#2-retrieve-source-files-when-needed).
2. Deploy the dependency package with [Deploy a Package](deployment-workflow.md#4-validate-and-deploy).

## Optional legacy agent actions

Use only for custom legacy agent actions.

- Does not move or update Lead Nurture Agent itself.
- Uses the `GenAiPlugin` and `GenAiFunction` path for legacy Agent Builder and committed Builder assets.
- Also applies to other Agentforce projects that use Asset Library assets.

1. Prepare Lead Nurture Agent in the target org.
2. Deploy the legacy agent actions with [Legacy Agent Actions](13-legacy-agent-actions.md).
3. Open the target agent draft in Agentforce Builder.
4. Select **Add Resource** > **Add from Asset Library**.
5. Add the legacy project action.
6. Preview generated email behavior and action behavior before activation.

Adding a legacy action to the target agent is a Builder step. The package only makes the action available.

## Complete target setup

Lead Nurture Agent email, agent user, Einstein Activity Capture, data library, cadence, and activation are target-org setup, not package metadata.

In the target org:

1. Turn on Lead Nurture Agent and supporting features.
2. Assign manager and sales-user permissions.
3. Create or select the Lead Nurture Agent user.
4. Connect the agent user's email account.
5. Confirm Einstein Activity Capture uses user-level authentication for the agent user.
6. Confirm the connected email address matches the Email field on the Lead Nurture Agent user record and is not connected to another user.
7. Configure the Lead Nurture Agent data library.
8. Configure behavior, cadence, language, tone, assignment, meeting scheduling, opt-out handling, and activation in Builder.

Sales users must connect their own email accounts to EAC if they need to see, edit, reschedule, or cancel agent emails.

## Validate email setup

Lead Nurture Agent email is target-org runtime setup.

Package can include:

- Custom email templates
- Prompt overrides
- Fields
- Actions
- Permissions

Package does not connect mailboxes or create Builder activation state.

1. Use a test lead or an approved lead record.
2. Confirm the Lead Nurture Agent user has an active email account connection.
3. Confirm Einstein Activity Capture is active for the agent user and any sales users who manage agent emails.
4. Confirm sender address, cadence, send caps, meeting-booking source, opt-out handling, and assignment rules.
5. If Send as Seller is on, confirm record owners have Inbox and Einstein Activity Capture access.
6. Preview Lead Nurture Agent in Builder and confirm the generated email uses the expected prompt templates and source values.
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

Email sender, EAC auth, meeting links, cadence, opt-out behavior, and data-library choices are target-org values. Package only custom dependencies.

## Checklist

- [ ] Dependency package contains no Lead Nurture Agent runtime metadata.
- [ ] Custom fields, objects, prompt templates, actions, email templates, callout configuration, and permission sets are included when used.
- [ ] Legacy project actions are packaged separately when used.
- [ ] Data 360 package prepared separately when used.
- [ ] Agent user, email connection, EAC, data library, cadence, assignment, and activation are documented as target manual steps, not `package.xml` members.
- [ ] Worksheet completed from the source org.
- [ ] Dependency deploy succeeded.
- [ ] Lead Nurture Agent is enabled in the target org.
- [ ] Agent user email and EAC connection are active.
- [ ] Required sales users connected email to EAC.
- [ ] Builder preview completed with a test lead or approved lead.
- [ ] Generated emails use the expected prompt templates and source values.
- [ ] Opt-out, assignment, and meeting-booking behavior confirmed.

## Sources

- Salesforce Help: Lead Nurture Agent considerations: https://help.salesforce.com/s/articleView?id=sales.sales_agent_sdr_considerations.htm&type=5
- Agentforce metadata deployment and retrieval limitations knowledge article: https://help.salesforce.com/s/articleView?id=005228853&type=1
- Salesforce Help: Set up Lead Nurture Agent: https://help.salesforce.com/s/articleView?id=sales.einstein_sdr_setup.htm&type=5
- Retrieve and deploy Agentforce metadata: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-deploy-metadata.html
