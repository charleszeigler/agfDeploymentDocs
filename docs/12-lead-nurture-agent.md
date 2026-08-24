# Deploy Lead Nurture Agent Dependencies

Move custom dependencies for Lead Nurture Agent.

**Use this guide for custom dependencies only.** Do not move Lead Nurture Agent itself, or Lead Nurture Agent changes, by change set, Metadata API, or Salesforce CLI. Create and configure the agent directly in the target org after deploying dependencies.

## Deployment order

When Lead Nurture Agent also uses Data 360 or legacy actions, keep this order:

1. Data 360 provisioned and data spaces created.
2. DevOps Data Kit metadata package deploy.
3. Data Kit component deploy, connector reauthorization, and data refresh.
4. Lead Nurture custom dependency package deploy.
5. Configure Lead Nurture Agent in the target org.
6. Optional legacy agent actions, then Builder preview.

**Stop if:** The agent depends on Data 360 and the target data is not refreshed. Do not preview Lead Nurture Agent yet.

## What can be deployed

| Scope | Items |
|---|---|
| Moves with metadata | Custom fields, custom objects, permission sets, Apex, tests, Flows, prompt template overrides, callout configuration for custom actions, and separate custom email templates |
| Configure in the target org | Lead Nurture Agent, agent user, mailbox, Einstein Activity Capture, sender behavior, cadence, data library, Builder preview, activation, generated emails, and runtime state |

Legacy project actions can move separately with [Legacy Agent Actions](13-legacy-agent-actions.md). They can reduce manual rebuild work because the target agent can add them from the Asset Library.

## Prepare the dependency package

Copy `manifests/lead-nurture-agent-package.xml` to `manifest/package.xml`; replace XML-safe placeholders with real API names and remove unused blocks. The template is not retrieve-ready or deploy-ready if copied blindly. Use [Build package.xml from exact source names](deployment-workflow.md#2-build-packagexml-from-exact-source-names) for member-name formats. Use API `66.0` unless Salesforce examples change. The live permission-set member is project-owned data access only. Do not package Salesforce-provided Lead Nurture Agent setup permission sets.

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
| Data 360 dependencies | Separate DevOps Data Kit package |
| Custom legacy agent actions | Separate legacy agent actions package |

Package rules:

- Include only confirmed custom flows, prompts, Apex actions, and email templates.
- Do not assume generic Lead, email, or nurture-related flows belong to Lead Nurture Agent.
- Package only confirmed custom email templates or custom copies.
- Treat Salesforce-provided templates, including `Email Templates from Salesforce`, as Salesforce setup artifacts.
- Leave Salesforce-provided Lead Nurture Agent templates, generated emails, draft emails, sent-email history, mailbox connections, EAC auth, cadence runtime state, and Builder activation state out of the package.
- Review prompt templates for `{!$Input:...}`, `{!$Flow:...}`, `templateDataProviders`, and `SOBJECT://...`.
- Include required fields, features, provider flows/actions, permissions, and callout configuration, or update the prompt before handoff.

**Stop if:** A prompt template validation fails with an invalid merge field, missing data provider, or missing output schema. Fix the target prerequisite, include the dependency, or remove that prompt from the package before deploy.

## Data 360 DevOps Data Kit

If Lead Nurture Agent or its custom dependencies use Data 360 data, complete [Deploy a Data 360 DevOps Data Kit](20-data-360-data-kit.md) before deploying this dependency package and before configuring Lead Nurture Agent in the target org.

Keep the DevOps Data Kit package separate from the Lead Nurture Agent dependency package. Confirm the target Data 360 components are deployed, connector access is reauthorized, required data is refreshed, and the Lead Nurture Agent users have the required Data 360 access.

**Stop if:** The agent depends on Data 360 and the target data space does not match the source, or target data is not refreshed.

## Retrieve and deploy dependencies

If the alias is not already authenticated, log in to the source sandbox. Then display the alias and confirm it is the expected org before retrieving the dependency package:

Authenticate the source alias if needed:

```bash
sf org login web --json --alias <SOURCE_ORG_ALIAS> --instance-url https://test.salesforce.com
```

Confirm the alias points to the expected source sandbox:

```bash
sf org display --json --target-org <SOURCE_ORG_ALIAS>
```

Retrieve the dependency package:

```bash
sf project retrieve start --json --manifest manifest/package.xml --target-org <SOURCE_ORG_ALIAS>
```

Confirm the retrieve result is `Succeeded`.

Review the package before deploy:

- Every `package.xml` member has a matching file under `force-app/main/default`.
- The package contains only custom dependencies.
- The package does not include Lead Nurture Agent itself.
- The package does not contain mailbox connections, EAC auth, generated emails, sent-email history, credential secrets, OAuth tokens, connector auth, or runtime state.

If the alias is not already authenticated, log in to the target org. Then display the alias and confirm it is the expected org before validating or deploying. Use `https://login.salesforce.com` for production or `https://test.salesforce.com` for a sandbox.

Authenticate the target alias if needed:

```bash
sf org login web --json --alias <TARGET_ORG_ALIAS> --instance-url https://login.salesforce.com
```

Confirm the alias points to the expected target org:

```bash
sf org display --json --target-org <TARGET_ORG_ALIAS>
```

Production deploys must run Apex tests. Validate first:

```bash
sf project deploy validate --json --manifest manifest/package.xml --target-org <TARGET_ORG_ALIAS> --test-level RunLocalTests --wait 30
```

If validation succeeds, copy `result.id` and quick deploy:

```bash
sf project deploy quick --json --job-id <JOB_ID_FROM_VALIDATE> --target-org <TARGET_ORG_ALIAS> --wait 30
```

For sandbox validation, run a dry run first. If your sandbox release policy requires tests, replace `NoTestRun` with `RunLocalTests`.

```bash
sf project deploy start --json --dry-run --manifest manifest/package.xml --target-org <TARGET_ORG_ALIAS> --test-level NoTestRun --wait 30
```

If the dry run succeeds:

```bash
sf project deploy start --json --manifest manifest/package.xml --target-org <TARGET_ORG_ALIAS> --test-level NoTestRun --wait 30
```

Continue only after the deploy result is `Succeeded`.

## Optional legacy agent actions

Use only for custom legacy agent actions.

- Does not move or update Lead Nurture Agent itself.
- Uses the `GenAiPlugin` and `GenAiFunction` path for legacy Agent Builder and saved Builder assets.
- Also applies to other Agentforce projects that use Asset Library assets.

1. Prepare Lead Nurture Agent in the target org.
2. Deploy the legacy agent actions with [Legacy Agent Actions](13-legacy-agent-actions.md).
3. Open the target agent draft in Agentforce Builder.
4. Select **Add Resource** > **Add from Asset Library**.
5. Add the legacy project action.
6. Preview generated email behavior and action behavior before activation.

Adding a legacy action to the target agent is a Builder step. The package only makes the action available.

## Configure Lead Nurture Agent

Lead Nurture Agent email, agent user, Einstein Activity Capture, data library, cadence, and activation are target-org configuration, not package metadata.

The Agentforce Data Library is recreated in the target org, not deployed. Same-data-space is the intended path. Re-point a prompt template only if a retriever API name changed during recovery. See [Deploy a Data 360 DevOps Data Kit](20-data-360-data-kit.md#what-does-not-move-the-agentforce-data-library).

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

Lead Nurture Agent email is target-org runtime configuration.

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

## Confirm target Lead Nurture setup

Use the source org to understand the intended behavior, then configure the target org deliberately. Email sender, EAC auth, meeting links, cadence, opt-out behavior, and data-library choices are target-org setup, not package metadata.

Before enabling automatic sending, confirm:

- Voice and content: configure company context, product context, tone, persona, approved prompts, and brand notes; preview an email and confirm it uses approved language.
- Send behavior: set send caps, cadence, and automatic-send controls; get business approval before enabling automated sends.
- Sender mailbox: connect the target mailbox, confirm the agent user email connection is active, and confirm EAC is working for that mailbox.
- Sales-user access: confirm participating sellers have the required Inbox and EAC access when Send as Seller is used.
- Meeting booking: configure the target booking source and confirm previewed emails contain the correct meeting path.
- Assignment and opt-out: configure target assignment rules and opt-out handling, then test with an approved lead record.
- Prompt overrides: deploy project-owned prompt templates and confirm Builder preview uses the target templates.
- Data sources: connect the target data library, knowledge sources, or Data 360 dependencies, then confirm previewed output uses target-org data.

## Checklist

- [ ] Dependency package does not include Lead Nurture Agent itself.
- [ ] Custom fields, objects, prompt templates, actions, email templates, callout configuration, and project-owned permission sets are included when used.
- [ ] Legacy project actions are packaged separately when used.
- [ ] Data 360 DevOps Data Kit completed before the dependency package, if used.
- [ ] Agent user, email connection, EAC, data library, cadence, assignment, and activation are documented as target-org steps, not `package.xml` members.
- [ ] Target Lead Nurture configuration reviewed against the source-org behavior.
- [ ] Dependency deploy succeeded.
- [ ] Lead Nurture Agent is enabled in the target org.
- [ ] Agent user email and EAC connection are active.
- [ ] Required sales users connected email to EAC.
- [ ] Builder preview completed with a test lead or approved lead.
- [ ] Generated emails use the expected prompt templates and source values.
- [ ] Opt-out, assignment, and meeting-booking behavior confirmed.
- [ ] Go-live proof saved for this target org: dependency deploy job ID or Deployment Status screenshot, Apex test summary when Apex was included, and Builder preview evidence for the approved lead. See [Capture go-live proof](deployment-workflow.md#5-capture-go-live-proof).
- [ ] If a step fails, use [Troubleshooting](03-troubleshooting.md).

## Sources

- Salesforce Help: Lead Nurture Agent considerations: https://help.salesforce.com/s/articleView?id=sales.sales_agent_sdr_considerations.htm&type=5
- Agentforce metadata deployment and retrieval limitations knowledge article: https://help.salesforce.com/s/articleView?id=005228853&type=1
- Salesforce Help: Set up Lead Nurture Agent: https://help.salesforce.com/s/articleView?id=sales.einstein_sdr_setup.htm&type=5
- Retrieve and deploy Agentforce metadata: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-deploy-metadata.html
