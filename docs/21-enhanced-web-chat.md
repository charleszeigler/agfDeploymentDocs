# Migrate Enhanced Web Chat

Use this guide when a Service Agent is exposed through Enhanced Web Chat or Messaging for In-App and Web on a website.

> **Required before deploy:** This guide covers migration of an existing web messaging setup from sandbox to production. It does not cover designing a new channel from scratch.

## Read first

Salesforce's current public guidance makes Web Chat migration a high-risk area:

- Change sets do not carry Enhanced Chat Embedded Service Deployment.
- Salesforce Known Issue W-15932771 lists Messaging for Web deployment as not supported and shows deployment failures involving generated site metadata.
- The practical fallback is to rebuild and publish the Embedded Service Deployment in the target org, then reconnect it to the deployed agent and routing setup.

> **Stop if:** The deployment plan requires change sets to move the Enhanced Web Chat deployment. Use Metadata API validation in a sandbox or rebuild the deployment manually in the target org.

> **Production path:** A successful Metadata API dry run proves only that the selected package shape is accepted by that target org. It does not publish the deployment, install the website snippet, validate authenticated chat, or override Salesforce Known Issue W-15932771.

## Capture source values

Fill this worksheet from the source sandbox before handoff.

| Value | Source value |
|---|---|
| Embedded Service Deployment API name | `__________` |
| Messaging channel API name | `__________` |
| Website domain | `__________` |
| CORS origins | `__________` |
| Experience Builder site domain, if used | `__________` |
| Omni routing flow | `__________` |
| Queue and routing configuration | `__________` |
| Agent API name and active version | `__________` |
| Auth/User Verification setting, if used | `__________` |
| Snippet location or site page | `__________` |
| Generated site iframe allowed origins, if exposed | `__________` |
| Branding, pre-chat, labels, business hours | `__________` |

> **Customer-specific value:** Domains, CORS entries, snippets, generated site URLs, generated site frame settings, auth settings, and publish state are target-org values.

## Package candidate metadata

Use this list as a validation checklist, not a guarantee that the full Web Chat deployment will move cleanly.

| Area | Candidate metadata |
|---|---|
| Web Chat deployment | `EmbeddedServiceConfig` |
| Messaging channel | `MessagingChannel` |
| Generated site | `DigitalExperienceBundle`, `CustomSite`, `Network`, `StaticResource` |
| Routing | `Flow`, `Queue`, `QueueRoutingConfig` |
| Security and domains | `CorsWhitelistOrigin`, `CspTrustedSite`, generated site iframe allowed origins as applicable |
| Agent dependency | Service Agent package from [Deploy and Activate a Service Agent](10-service-agent.md) |

> **Do not package:** Do not include Aura `ExperienceBundle` for the generated site unless a project-specific sandbox validation proves it is required and deployable.
> **Do not package:** Do not reuse the source-org website snippet, generated iframe site URL, or CORS/domain values. Replace them with target-org values after the target deployment is published.

## Validate the metadata path in a sandbox

If the customer wants to attempt a metadata migration, validate it in a sandbox before production.

```bash
sf org list metadata --json --metadata-type EmbeddedServiceConfig --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type MessagingChannel --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type DigitalExperienceBundle --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type CustomSite --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type Network --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type Queue --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type QueueRoutingConfig --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type CorsWhitelistOrigin --target-org <SOURCE_ORG_ALIAS>
```

Retrieve the selected metadata into a DX project, review source-org references, and dry-run deploy to a target sandbox:

```bash
sf project retrieve start --json --manifest <PACKAGE_XML_PATH> --target-org <SOURCE_ORG_ALIAS>
sf project deploy start --json --dry-run --manifest <PACKAGE_XML_PATH> --target-org <TARGET_ORG_ALIAS> --test-level NoTestRun --wait 30
```

> **Stop if:** The dry run fails on generated site metadata, missing site references, label length, or `EmbeddedServiceConfig` site fields. Use the manual target rebuild path.

If the dry run succeeds, keep the manual after-deploy steps. Web Chat still needs target-org publish, CORS, domain, snippet or Embedded Messaging component, routing, and conversation smoke testing.

## Rebuild or finish setup in the target org

Use this path when the metadata path is not validated end to end.

1. Confirm the Service Agent package is deployed, live-previewed, published, and active.
2. Confirm the Omni routing flow, queue, and routing configuration exist in the target org.
3. Confirm at least one target Omni user belongs to the queue and can select a Messaging-available status in the service console.
4. In Setup, open Embedded Service Deployments.
5. Recreate or update the target Enhanced Chat Web deployment to match the source worksheet.
6. Select the target messaging channel.
7. Set the website domain.
8. Configure branding, pre-chat, custom labels, business hours, and auth settings.
9. Publish the deployment.
10. Add the customer website domain to CORS and generated site iframe allowed origins if the setup exposes that setting.
11. Install the target-org code snippet on the website, or use the Embedded Messaging component on the Experience Builder site.

> **Manual after deploy:** Always publish or republish the target Embedded Service Deployment after configuration changes.
> **Manual after deploy:** A real Omni user must sign in, accept any org notices themselves, select a Messaging-available status, and stay online during the smoke test.

## Run the built-in setup smoke

Before website testing, use the target org's built-in test page.

1. In Setup, open the target Embedded Service Deployment.
2. Click **Publish** after any configuration change.
3. Confirm the deployment is active and the generated site assets load.
4. Click **Test Enhanced Web Chat**.
5. Confirm the test page shows a chat launcher, not only setup instructions.
6. Send a test message and confirm a new Messaging Session appears in Salesforce.

> **Stop if:** The test page opens but no chat launcher appears. Fix publish state, generated site access, CORS/domain settings, and routing before continuing to website testing.

## External website setup

For an external website, copy the target-org code snippet from Embedded Service Deployment Settings and place it before the closing body tag on each page where the chat button appears. Add the website origin to CORS.

If the browser console reports a `frame-ancestors` or iframe-blocking error for the generated `ESW...` site, add the website origin to the generated site's iframe allowed origins or rebuild/publish the deployment with the correct website domain.

> **Stop if:** The page uses a referrer policy that prevents Enhanced Web Chat from loading. Adjust the website policy before troubleshooting Salesforce metadata.

## Experience Builder setup

For an Experience Builder site, use the Embedded Messaging component. Select the target Embedded Web Deployment, Enhanced Service URL, and Site Endpoint from the target org.

Add the Experience Builder site domain to CORS. If preview testing fails, also add the live-preview domain.

Do not reuse or manually modify the generated Enhanced Web Chat site that Salesforce creates for iframe isolation.

> **Stop if:** The only URL available for testing is the generated `ESW...` site. Test the actual customer website or Experience Builder site that hosts the snippet or Embedded Messaging component.

## Validate

Use the UI checks first. The CLI checks are optional verification for the deployment owner.

1. Open the target website or Experience Builder site.
2. Confirm the chat button loads.
3. In the service console, confirm an Omni user is online with a Messaging-available status.
4. Start a conversation.
5. In Salesforce, open Messaging Sessions and confirm a new `MessagingSession` was created.
6. Confirm the session routes through the intended Omni flow and queue.
7. Confirm the Omni user accepts the work item or the active Service Agent answers, depending on the routing design.
8. Confirm authenticated chat behavior if auth is used.
9. Confirm business hours, labels, branding, and pre-chat fields match the worksheet.

Optional CLI verification:

```bash
sf data query --json --query "SELECT Id, DeveloperName, MasterLabel, IsActive, MessageType, PlatformType, RoutingType, TargetQueueId, FallbackQueueId, RoutingConfigurationId FROM MessagingChannel WHERE DeveloperName = '<MESSAGING_CHANNEL_API_NAME>' LIMIT 1" --target-org <TARGET_ORG_ALIAS>
sf data query --json --query "SELECT Id, CreatedDate, StartTime, Status, MessagingChannelId, MessagingChannel.DeveloperName, ChannelName, ChannelType, AgentType FROM MessagingSession ORDER BY CreatedDate DESC LIMIT 5" --target-org <TARGET_ORG_ALIAS>
sf data query --json --query "SELECT Id, WorkItemId, RoutingType, IsReadyForRouting, RoutingModel, ServiceChannelId, QueueId FROM PendingServiceRouting WHERE WorkItemId = '<MESSAGING_SESSION_ID>' LIMIT 1" --target-org <TARGET_ORG_ALIAS>
sf data query --json --query "SELECT Id, WorkItemId, UserId, Status, ServiceChannelId, CreatedDate FROM AgentWork WHERE WorkItemId = '<MESSAGING_SESSION_ID>' ORDER BY CreatedDate DESC LIMIT 5" --target-org <TARGET_ORG_ALIAS>
```

The first query should show the target channel is active with `MessageType` `EmbeddedMessaging` and `PlatformType` `Enhanced`. After the website test, the second query should show a new session record whose `MessagingChannel.DeveloperName` matches `<MESSAGING_CHANNEL_API_NAME>`. If the session is waiting, the routing query should show the intended queue, and `AgentWork` should appear after an Omni user accepts the work item.

> **Stop if:** No new `MessagingSession` appears after the website test. Fix publish status, snippet or component selection, CORS/domain settings, and routing before declaring the channel ready.
> **Stop if:** The session stays `Waiting` and no `AgentWork` appears. Confirm queue membership, service presence configuration, Omni user availability, and routing before declaring the channel ready.

## Sources

- Components Available in Change Sets: https://help.salesforce.com/s/articleView?id=platform.changesets_about_components.htm&type=5
- Messaging For Web Deployment is Not Supported: https://help.salesforce.com/s/issue?id=a028c00000zLLiS
- Configure an Enhanced Web Chat Deployment: https://help.salesforce.com/s/articleView?id=service.miaw_configure_web_deployment_1.htm&type=5
- Configure an Enhanced Web Chat Deployment in an Experience Builder or Commerce Cloud site: https://help.salesforce.com/s/articleView?id=service.miaw_deployment_experience_builder.htm&type=5
