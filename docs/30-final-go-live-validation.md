# Final Go-Live Validation

Use after package validation, deploy, and package-specific setup.

**Required before deploy:** This page does not replace package validation. Start here only after the deployment owner confirms the package deploy succeeded.

**Manual after deploy:** These are target-org runtime checks. They do not add metadata to `package.xml`.

## How to use this checklist

Complete checks from Setup, Agentforce Builder, Data Cloud Setup, the service console, and the target website or Experience Builder site.

Record `Pass`, `Fail`, or `N/A`. Use `N/A` only when the feature is out of scope.

## Confirm the package deployed

1. In Setup, open Deployment Status.
2. Confirm the final deployment shows Succeeded.
3. Confirm there are no failed components.
4. If Apex was included, confirm tests ran and passed.
5. Save the deployment job ID or a Deployment Status screenshot for the handoff record.

**Stop if:** Apex is included but the validation output shows zero tests run. Do not quick deploy or go live until the deployment owner reviews the validation output.

## Service Agent

For Service Agents:

1. Confirm the target org has the correct Agentforce features enabled.
2. Confirm the target Service Agent user exists.
3. Confirm the Service Agent user has the required permission sets, object access, field access, record access, and credential access.
4. In Agentforce Builder, confirm the deployed agent opens without validation errors.
5. Run a live-action preview with a test record or an approved record.
6. Publish and activate the intended version.
7. Smoke test the active agent on the intended channel.

**Do not package:** Do not move the source sandbox agent user. Create or select the target org agent user during target setup.

**Stop if:** Preview succeeds only for an admin or returns missing-data errors for the agent user. Fix target access before go-live.

## Employee Agent

For employee-facing agents:

1. Confirm the agent package is deployed, published, and active.
2. Confirm the access package or permission set that contains agent access was deployed after activation.
3. Assign the access package or permission set to the intended employee users.
4. Test from Lightning as a non-admin employee.
5. Confirm the employee can start the agent and complete the main happy path.

**Stop if:** The only successful smoke test was run by an admin. Test as an assigned non-admin employee before go-live.

## Data 360 / Data Cloud

For Data 360 or Data Cloud:

1. In Data Cloud Setup, confirm the target data space is active.
2. Open Developer Tools -> Data Kits and confirm the deployed Data Kit is visible.
3. Deploy the Data Kit components to the target data space.
4. Reauthorize inactive connectors in the target org.
5. Refresh the required streams, mappings, identity rulesets, calculated insights, segments, search indexes, and data graphs.
6. Open Data Explorer or the relevant Data Cloud object page and confirm target data is visible.
7. Run the agent preview again after the data is refreshed.

**Data 360 prerequisite:** A successful `package.xml` deploy does not deploy Data Kit components, refresh data, or reauthorize connectors.

**Stop if:** The Data Kit is visible but components are not deployed, connectors are not authorized, or target row counts are zero for data the agent needs. Do not publish a Data 360-dependent agent yet.

## Lead Nurturing

For Agentforce Lead Nurturing dependencies:

1. Confirm the dependency package contains only project-owned dependencies.
2. Enable and complete the current Lead Nurturing setup flow in the target org.
3. Create or select the target Lead Nurturing agent user.
4. Connect the agent user's email account.
5. Confirm Einstein Activity Capture is active for the agent user.
6. Confirm required sales users connected their email accounts when they need to manage agent emails.
7. Confirm the connected email matches the Lead Nurturing agent user's Email field and is not connected to another user.
8. Confirm the data library, cadence, sender, assignment, meeting-booking source, and opt-out process.
9. Preview generated emails in Builder with a test lead or approved lead.
10. Activate automatic sending only after the previewed behavior is approved.

**Do not package:** Do not package Salesforce-provided Lead Nurturing templates, generated emails, sent-email history, mailbox connections, EAC auth, cadence runtime state, or Builder activation state.

**Stop if:** The sender mailbox, EAC connection, data library, or email preview is not approved. Keep automatic sending off.

## Enhanced Web Chat

For Service Agents exposed through Enhanced Web Chat or Messaging for In-App and Web:

1. Confirm the Service Agent is active.
2. Confirm the target Embedded Service Deployment is published.
3. Confirm the target messaging channel is active.
4. Confirm the target website or Experience Builder site uses the target-org snippet or Embedded Messaging component.
5. Confirm CORS, website domain, generated site iframe settings, and authentication settings match the target org.
6. In the service console, confirm an Omni user is online with a Messaging-available status, unless the design routes directly to an active agent.
7. Start a conversation from the actual website or Experience Builder site.
8. Confirm a new Messaging Session is created in Salesforce.
9. Confirm the session routes to the intended queue, Omni user, or active Service Agent.
10. Confirm business hours, branding, labels, pre-chat fields, and authenticated-chat behavior if used.

**Manual after deploy:** Always publish or republish the Embedded Service Deployment after target setup changes.

**Stop if:** There is no real target website or Experience Builder host page to test, no new Messaging Session appears, the session stays waiting, or no user or active agent handles the conversation. Fix host embedding, publish state, CORS/domain settings, service presence, queue membership, and routing before go-live.

## Handoff record

Save these values or screenshots with the deployment handoff:

- Final package deployment: deployment job ID or Deployment Status screenshot.
- Service Agent, if used: active version and successful smoke test.
- Employee Agent, if used: non-admin employee smoke test.
- Data 360 / Data Cloud, if used: Data Kit component deployment and refreshed target data.
- Lead Nurturing, if used: approved Builder email preview and mailbox/EAC setup.
- Enhanced Web Chat, if used: website conversation test and Messaging Session ID.

**Target-org evidence:** Screenshots and IDs prove readiness for one target org only. Do not reuse them for another org.
