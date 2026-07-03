# Deploy Prospecting Agent Dependencies

Move custom dependencies for the Agentforce Prospecting Agent.

**Use this guide for custom dependencies only.** Do not move the Prospecting Agent itself, or Prospecting Agent changes, by change set, Metadata API, or Salesforce CLI. Create and configure the agent directly in the target org after deploying dependencies.

**Confidence note:** Salesforce documents this metadata deployment limitation explicitly for the Lead Nurture (SDR) and Sales Coach agents in knowledge article `005228853`. That article does **not** name the Prospecting Agent. The Prospecting Agent is a pre-built standard-template Sales agent from the same family, enabled per org through guided setup and Agentforce Builder — not an Agent Script (`AiAuthoringBundle`) agent — so the same rebuild-in-target behavior applies by architecture. Re-verify against a Prospecting-specific considerations page or release note if one appears.

## What the Prospecting Agent is

The Prospecting Agent (built on the acquired Bluebirds technology) researches and **ranks ICP-matched prospects**, then builds an always-refreshed prioritized prospect list in Sales Cloud and Slack. It **hands off** qualified prospects to a seller, a Sales Engagement cadence, or the Engagement Agent (the rebranded Lead Nurture / SDR agent) for outreach. It draws on CRM fields, call recordings (ECI / Gong), email activity (EAC), and third-party data vendors (ZoomInfo is the primary native connector; Gong is also native at GA).

**Scope caveat — confirm before you scope a project.** The Prospecting Agent works against a defined universe of **existing accounts** (the accounts in a configured Salesforce report). Within that scope it finds and ranks **net-new contacts/leads** at those accounts and can create those contact/lead records. Whether it autonomously pulls **net-new accounts** from a vendor like ZoomInfo by ICP criteria (versus enriching and prioritizing accounts already in the org) is easy to overstate and has caused scoping mismatches. Validate the exact net-new behavior against a live org and current release notes before committing a customer to it.

Extend its data sources two ways: push a vendor's data (Demandbase, 6sense, G2, etc.) into a Salesforce field the agent reads, or wrap the vendor API in a custom Agentforce action the agent calls during research.

It does **not** send email or run a cadence. Treat mailbox and Einstein Activity Capture (EAC) *sending* as out of scope for this agent — outreach belongs to the downstream Engagement Agent. (The agent can still read email activity via EAC as a research signal.)

## What can be deployed

| Scope | Items |
|---|---|
| Moves with metadata | Custom fields used as ICP/qualification criteria, custom objects, the Salesforce Accounts report that scopes the account universe, permission sets, Apex and tests, Flows, custom prompt template overrides, and callout configuration for custom actions |
| Configure in the target org | Prospecting Agent, agent user, ZoomInfo/vendor connection, ICP wizard, Account Research and Prospect Finder sub-agent instructions, account report scope, data library, handoff target, Builder preview, activation, and the generated prospect list |

The agent's runtime is backed by standard objects (`ProspectingAgentSpec`, `ProspectingAgentRcmdTarget`, and a `BotDefinition`) that are created and committed in the org, not authored as portable source. This is the practical reason the agent is treated as rebuild-in-target rather than a clean metadata unit.

A custom, developer-authored Agent Script agent is different: it moves through the normal Agent Script path. Deploy it like a Service or Employee Agent using [Deploy and Activate a Service Agent](10-service-agent.md) instead.

## Prepare the dependency package

Copy `manifests/prospecting-agent-package.xml` to `manifest/package.xml`; replace XML-safe placeholders with real API names. Use [Build package.xml from exact source names](deployment-workflow.md#2-build-packagexml-from-exact-source-names) for member-name formats.

Common dependencies:

| Dependency | Metadata type |
|---|---|
| Custom Account, Contact, or Lead fields used as ICP or qualification criteria | `CustomField` |
| Custom objects, if you added prospecting-tracking data | `CustomObject` |
| The Accounts report that defines the in-scope account universe | `Report` |
| Custom prompt template overrides | `GenAiPromptTemplate` |
| Custom invocable actions and tests | `ApexClass`, `Flow` |
| Callout configuration for custom enrichment or outbound actions | `NamedCredential`, `ExternalCredential` |
| Data access and setup permissions | `PermissionSet` |
| Data 360 dependencies | Separate Data Kit package |

Package rules:

- Include only confirmed custom fields, objects, reports, prompts, and Apex actions.
- Do not assume generic Account, Lead, or prospecting-related flows belong to the Prospecting Agent.
- The account report that scopes the agent moves as metadata, but the agent's *selection* of that report is a Builder step.
- Leave the Prospecting Agent, its ICP definition, sub-agent instruction edits, ZoomInfo connection, agent user, data library, and Builder activation state out of the package.
- The ZoomInfo managed package cannot move by change set or Metadata API. Install it independently in each org and re-authenticate the connection.
- Review prompt templates for `{!$Input:...}`, `{!$Flow:...}`, `templateDataProviders`, and `SOBJECT://...`.
- Include required fields, features, provider flows/actions, permissions, and callout configuration, or update the prompt before handoff.

**Stop if:** A prompt template validation fails with an invalid merge field, missing data provider, or missing output schema. Fix the target prerequisite, include the dependency, or remove that prompt from the package before deploy.

## Retrieve and deploy dependencies

If the alias is not already authenticated, log in to the source sandbox. Then display the alias and confirm it is the expected org before retrieving the dependency package:

```bash
sf org login web --json --alias <SOURCE_ORG_ALIAS> --instance-url https://test.salesforce.com
sf org display --json --target-org <SOURCE_ORG_ALIAS>
sf project retrieve start --json --manifest manifest/package.xml --target-org <SOURCE_ORG_ALIAS>
```

Confirm the retrieve result is `Succeeded`.

Review the package before deploy:

- Every `package.xml` member has a matching file under `force-app/main/default`.
- The package contains only custom dependencies.
- The package does not include the Prospecting Agent itself.
- The package does not contain the ZoomInfo managed package, ZoomInfo credentials, connector auth, OAuth tokens, credential secrets, or runtime state.

If the alias is not already authenticated, log in to the target org. Then display the alias and confirm it is the expected org before validating or deploying. Use `https://login.salesforce.com` for production or `https://test.salesforce.com` for a sandbox.

```bash
sf org login web --json --alias <TARGET_ORG_ALIAS> --instance-url https://login.salesforce.com
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

## Configure the Prospecting Agent

Prospecting Agent enablement, ZoomInfo connection, ICP, sub-agent instructions, account report scope, data library, and activation are target-org configuration, not package metadata.

Prerequisites in the target org:

1. A recently provisioned org on a post-GA release. The Prospecting toggle (generally available March 30, 2026) does not appear on older sandboxes or Developer orgs. If it is missing in a sandbox even though licensing looks correct, run **Match Production Licenses** in the sandbox first, then re-check.
2. Licensing: Agentforce for Sales add-on or Agentforce 1 Edition, which provisions the **`SalesAgenticProspectingAddOn`** permission set license. This grants the **Sales Agentic Prospecting** and **Sales Agentic Prospecting Manager** permission set licenses.
3. Agentforce turned on for Sales, and Data 360 (Data Cloud) enabled.
4. The ZoomInfo connection authenticated (primary native vendor). Gong and ECI (call recordings) and EAC (email activity) are also native research sources at GA. Plan a production data-vendor entitlement; a vendor trial tier may be enough for testing only.

Then, in the target org:

1. In Setup, open **Salesforce Go → Agentforce for Sales** and turn on **Prospecting**. Assign the configure (manager) and use permissions from the Sales Agentic Prospecting permission set group. Verify the exact permission set / group names in the target org's setup flow; do not assume they match the SDR names.
2. Create or select the Prospecting Agent user and assign the license and permission sets. The agent user needs Account, Contact, and Lead read access, write access for created records, and the Data 360 access it grounds on. Follow least privilege.
3. Create or confirm the Accounts report that defines the in-scope account universe. For broad coverage, use a fresh, unfiltered Accounts report; add filters only to deliberately narrow scope. An account not in this report is never processed (silent no-op).
4. Run the guided setup wizard: Getting Started, Add Sources (connect ZoomInfo and other data sources), Assign Prospects, and Tools.
5. In Agentforce Builder, rewrite the sub-agent instructions. Replace the default placeholder qualification criteria in the **Account Research** sub-agent and the placeholder persona in the **Prospect Finder** sub-agent with your real ICP. The wizard does not surface these inline; this step is mandatory or the agent runs against placeholder logic and returns wrong or zero prospects.
6. Confirm duplicate rules for Account, Contact, and Lead so net-new records do not create duplicates.
7. Configure the handoff so qualified prospects are assigned to a seller, a Sales Engagement cadence, or the Engagement Agent for outreach.
8. Preview results, then activate the agent.

## Validate

Prospecting Agent output is target-org runtime configuration.

Package can include:

- Custom fields and objects
- The account scoping report
- Prompt overrides
- Actions
- Permissions

Package does not connect ZoomInfo, define the ICP, or create Builder activation state.

1. Choose a test account where all three conditions are true: it is in the configured report, it passes the Account Research qualification criteria, and ZoomInfo has contacts matching the Prospect Finder persona. Use a real, well-covered Standard B2B customer account — not a Partner account or Person Account.
2. On the account record, use **Generate Prospects from Account**, pick the agent, assign an owner, and set a max prospect count. The run is asynchronous; allow 10–60 seconds and retry once if the queue does not populate.
3. Review the New Prospects queue and the "Why This Prospect?" reasoning panel. Confirm the logic and cited data sources match your ICP.
4. Confirm handoff: an approved prospect can be assigned to the Engagement Agent.
5. Confirm duplicate rules behave as expected before broad rollout.

## Fill the implementation worksheet

Capture before handoff:

| Setting | Value |
|---|---|
| Company or product context | |
| ICP required criteria | |
| ICP nice-to-have signals | |
| Account Research qualification criteria | |
| Prospect Finder target persona | |
| Account scoping report | |
| ZoomInfo entitlement and connection | |
| Prospect assignment rules | |
| Handoff target (Engagement Agent) | |
| Max prospects per run | |
| Project prompt template overrides | |
| Data library or knowledge source | |
| Data 360 dependency, if any | |

ICP, sub-agent instructions, ZoomInfo connection, account report selection, assignment, and data-library choices are target-org values. Package only custom dependencies.

## Checklist

- [ ] Dependency package does not include the Prospecting Agent itself.
- [ ] Custom fields, objects, account report, prompt templates, actions, callout configuration, and permission sets are included when used.
- [ ] ZoomInfo managed package and credentials are not in the package.
- [ ] Data 360 package prepared separately when used.
- [ ] Agent user, ZoomInfo connection, ICP, sub-agent instructions, report scope, data library, and activation are documented as target-org steps, not `package.xml` members.
- [ ] Worksheet completed from the source org.
- [ ] Dependency deploy succeeded.
- [ ] Prospecting Agent template is available and enabled in the target org.
- [ ] Account Research and Prospect Finder placeholder criteria rewritten to the real ICP.
- [ ] Account scoping report created in the target org.
- [ ] Preview and a **Generate Prospects from Account** test returned expected prospects.
- [ ] Handoff to the Engagement Agent confirmed.
- [ ] Duplicate rules confirmed for net-new records.

## Sources

- Salesforce Help: Prospecting Agents (parent): https://help.salesforce.com/s/articleView?id=sales.sales_agent_prospecting_parent.htm&type=5
- Salesforce Help: Set Up Prospecting Agents: https://help.salesforce.com/s/articleView?id=sales.sales_agent_prospecting_setup_parent.htm&type=5
- Salesforce: Prospecting Agent product page: https://www.salesforce.com/sales/prospecting/agent/
- Salesforce News: Agentforce Sales launch (Prospecting agent GA March 30, 2026): https://www.salesforce.com/news/stories/agentforce-sales-announcement/
- Agentforce metadata deployment and retrieval limitations knowledge article (SDR and Sales Coach; does not name Prospecting): https://help.salesforce.com/s/articleView?id=005228853&type=1
- Retrieve and deploy Agentforce metadata: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-deploy-metadata.html

Deployment stance, the `SalesAgenticProspectingAddOn` license and permission-set names, the Salesforce Go setup path, the `ProspectingAgentSpec` / `ProspectingAgentRcmdTarget` / `BotDefinition` runtime objects, the Match Production Licenses fix, and the net-new scope caveat were validated against internal Salesforce field and engineering discussions (Summer '26). Re-verify against the Help docs above before a customer handoff, since this product is changing rapidly.
