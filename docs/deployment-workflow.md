# Deploy a Package

Use this page as a general Salesforce CLI reference for package folder setup, retrieve, validate, deploy, publish, activate, rollback, and go-live proof. The agent guides include these steps in context for each primary path.

## Use This Page For

| Need | Where to go |
|---|---|
| Choose what kind of package you are moving | [Overview](index.md) |
| Build exact `package.xml` members | This page, then the selected package guide |
| Look up shared retrieve, validate, and deploy commands | This page |
| Look up Service or Employee Agent publish and activate commands | This page |
| Data Kit component deployment, web messaging channel, Lead Nurture Agent email, or Legacy Agent Actions | The selected package guide |

## 1. Create the package folder

Create or open one Salesforce DX project folder per deployment package:

Generate the staging project:

```bash
sf template generate project --name deploy-package --template empty --default-package-dir force-app --api-version 66.0
```

Create the manifest folder:

```bash
mkdir -p deploy-package/manifest
```

```text
deploy-package/
+-- sfdx-project.json
+-- manifest/
|   +-- package.xml
+-- force-app/main/default/
```

The generated `sfdx-project.json` makes the Salesforce CLI treat the folder as a Salesforce DX project. This file is local project configuration; it is not deployed. The `packageDirectories.path` value tells the CLI to put retrieved metadata under `force-app/main/default`, `name` is only the local project name, and `sourceApiVersion` controls the Metadata API version. If you are working in an existing Salesforce DX project, keep the existing `sfdx-project.json` and use its package directory instead of replacing it.

```json
{
  "packageDirectories": [
    {
      "path": "force-app",
      "default": true
    }
  ],
  "name": "agentforce-deploy-package",
  "sourceApiVersion": "66.0"
}
```

Save the package-specific manifest as `manifest/package.xml`, or use the path you will pass to `--manifest`.

Before retrieving or deploying:

- Replace all manifest placeholders with exact API names.
- Remove unused template blocks.
- Keep only one package type in the folder.
- Keep Data 360 metadata out of agent packages.
- Keep Lead Nurture Agent itself out of dependency packages.
- Remove source-org usernames, website domains, generated snippets, credential secrets, OAuth tokens, connector auth, and runtime state.

## 2. Build package.xml from exact source names

Do not start by filling every template block. Start with the smallest proven member for the package, retrieve it, inspect the retrieved source, then add dependencies and retrieve again.

| Package path | Start with |
|---|---|
| Service Agent | `AiAuthoringBundle:<AGENT_API_NAME>` only, then inspect the `.agent` file for action targets and dependencies |
| Employee Agent | `AiAuthoringBundle:<AGENT_API_NAME>` only, then inspect the `.agent` file; keep `agentAccesses` in the post-publish package |
| Lead Nurture Agent | Confirmed custom dependencies only; do not include the Lead Nurture Agent itself |
| Legacy Agent Actions | The `GenAiFunction` member and required `GenAiPlugin`, then backing Apex, Flow, prompt, schema, and access dependencies |
| Data 360 | The source Data Kit generated manifest; do not hand-build it unless repairing a generated manifest |
| Enhanced Web Chat | Only candidate metadata validated in a sandbox; target-org rebuild is usually safer |

Use exact API names or Developer Names, not labels. If a name comes from Setup UI, confirm the API name in the source org before placing it in XML.

| Metadata type | `package.xml` member format |
|---|---|
| `AiAuthoringBundle` | Agent API name, for example `Service_Agent` |
| `ApexClass` | Class name only, for example `CaseLookupAction`; do not include `.cls` |
| `Flow` | Flow API name only; do not include `.flow-meta.xml` or a version number |
| `GenAiPromptTemplate` | Prompt template API name |
| `GenAiPlugin`, `GenAiFunction` | Legacy plugin or action API name from metadata listing / Asset Library |
| `LightningTypeBundle`, `LightningComponentBundle` | Bundle API name |
| `CustomObject` | Object API name, for example `Customer_Profile__c` |
| `CustomField` | Object-qualified field API name, for example `Account.Intent_Score__c` or `Customer_Profile__c.Score__c` |
| `Report` | Folder-qualified report Developer Name, for example `Sales_Reports/Account_Scope` |
| `EmailTemplate` | Folder-qualified template Developer Name, for example `Sales_Templates/Follow_Up` |
| `PermissionSet`, `PermissionSetGroup` | API name, not label |
| `NamedCredential`, `ExternalCredential` | API name; never include secrets or authenticated connection state |
| `CustomApplication`, `CustomTab`, `FlexiPage`, `Queue`, `QueueRoutingConfig` | API name |

Formatting rules:

- In Markdown, placeholders appear as `<AGENT_API_NAME>`; in XML, use XML-safe values such as `AGENT_API_NAME` or the real API name. Do not put angle-bracket placeholders in `package.xml`.
- Remove an unused `<types>` block entirely. Do not leave placeholder `<members>` values in a handoff package.
- Each `<types>` block contains one metadata `<name>` and one or more `<members>` values for that metadata type.
- Do not put the pseudo metadata type `Agent` in `package.xml`. Use `AiAuthoringBundle` for editable Service or Employee Agent source, or explicit runtime metadata only when a guide says to.

Use these checks when you need exact API names from the source sandbox. Treat this as a menu, not a script: run only the commands for metadata types you plan to package.

```bash
sf org list metadata --json --metadata-type AiAuthoringBundle --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type ApexClass --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type Flow --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type GenAiPlugin --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type GenAiFunction --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type GenAiPromptTemplate --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type LightningTypeBundle --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type PermissionSet --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type NamedCredential --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type ExternalCredential --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type Report --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type EmailTemplate --target-org <SOURCE_ORG_ALIAS>
```

Use a retrieve-inspect-repeat loop:

1. Copy the selected manifest template to `manifest/package.xml`.
2. Keep only members you can name exactly.
3. Retrieve with the current manifest.
4. If retrieve says a member does not exist, fix the member format or remove it.
5. Inspect retrieved files for references such as `apex://`, `flow://`, prompt templates, objects, fields, permission sets, Custom Lightning Types, and credentials.
6. Add the confirmed dependencies to `package.xml` and retrieve again.
7. Stop when every `package.xml` member has a matching file under `force-app/main/default` or is an intentionally package-only reference called out by the guide.

## 3. Retrieve source files when needed

Skip this section if the package folder already contains the reviewed source files.

If the alias is not already authenticated, log in to the source sandbox. Then display the alias and confirm it is the expected org before retrieving:

Authenticate the source alias if needed:

```bash
sf org login web --json --alias <SOURCE_ORG_ALIAS> --instance-url https://test.salesforce.com
```

Confirm the alias points to the expected source sandbox:

```bash
sf org display --json --target-org <SOURCE_ORG_ALIAS>
```

For Data Kits, use the source Data Kit generated manifest. Do not hand-build the Data Kit manifest from this page.

Retrieve from the package folder:

```bash
sf project retrieve start --json --manifest <PACKAGE_XML_PATH> --target-org <SOURCE_ORG_ALIAS>
```

Confirm the retrieve result is `Succeeded`.

Review the package before deploy:

- Every `package.xml` member has a matching file under `force-app/main/default`.
- The package contains only the package type being moved.
- The package does not contain source-org usernames, website domains, generated Web Chat snippets, credential secrets, OAuth tokens, connector auth, or runtime state.
- The package guide lists the target-org steps that remain after deploy.

## 4. Confirm the target org

Install and command checks:

Check the Salesforce CLI version:

```bash
sf --version
```

Confirm Agentforce CLI commands are available when deploying Service or Employee Agents:

```bash
sf agent --help
```

For Data 360 packages:

```bash
sf data360 --help
```

**Stop if:** A required command group is unavailable and the machine cannot install or load Salesforce CLI plugins.

Authenticate the target alias if needed, then display the alias and confirm the org details before validating or deploying.

Production:

Authenticate the production alias if needed:

```bash
sf org login web --json --alias <TARGET_ORG_ALIAS> --instance-url https://login.salesforce.com
```

Confirm the alias points to the expected production org:

```bash
sf org display --json --target-org <TARGET_ORG_ALIAS>
```

Sandbox:

Authenticate the sandbox alias if needed:

```bash
sf org login web --json --alias <TARGET_ORG_ALIAS> --instance-url https://test.salesforce.com
```

Confirm the alias points to the expected target sandbox:

```bash
sf org display --json --target-org <TARGET_ORG_ALIAS>
```

For Service or Employee Agent packages, confirm Agentforce metadata is available:

```bash
sf org list metadata --json --metadata-type AiAuthoringBundle --target-org <TARGET_ORG_ALIAS>
```

**Stop if:** The command returns `INVALID_TYPE` or `Not available for deploy for this organization`. Enable and provision Agentforce for the target org before continuing.

If the agent uses Data 360, complete [Deploy a Data 360 Data Kit](20-data-360-data-kit.md) before publishing the agent.

```bash
sf api request rest "/services/data/v67.0/ssot/data-kits" --target-org <TARGET_ORG_ALIAS> --stream-to-file data-kits-check.json
```

Open `data-kits-check.json`. Stop on `FUNCTIONALITY_NOT_ENABLED`, `CdpDataKit`, or any `errorCode`.

## 5. Validate and deploy

Production deploys must run Apex tests. Validate first:

```bash
sf project deploy validate --json --manifest <PACKAGE_XML_PATH> --target-org <TARGET_ORG_ALIAS> --test-level RunLocalTests --wait 30
```

If validation succeeds, copy `result.id` and quick deploy:

```bash
sf project deploy quick --json --job-id <JOB_ID_FROM_VALIDATE> --target-org <TARGET_ORG_ALIAS> --wait 30
```

**Stop if:** You do not have the job ID from a successful `sf project deploy validate` command. Do not quick deploy a sandbox dry-run job ID.

Alternative: quick deploy the most recent successful validation:

```bash
sf project deploy quick --json --use-most-recent --target-org <TARGET_ORG_ALIAS> --wait 30
```

**Stop if:** The validation output includes Apex but reports zero tests run. Send the JSON output to the deployment owner before deploying.

For sandbox validation, run a dry run first. If your sandbox release policy requires tests, replace `NoTestRun` with `RunLocalTests`.

```bash
sf project deploy start --json --dry-run --manifest <PACKAGE_XML_PATH> --target-org <TARGET_ORG_ALIAS> --test-level NoTestRun --wait 30
```

If the dry run succeeds:

```bash
sf project deploy start --json --manifest <PACKAGE_XML_PATH> --target-org <TARGET_ORG_ALIAS> --test-level NoTestRun --wait 30
```

Check deploy status with `result.id`:

```bash
sf project deploy report --json --job-id <JOB_ID> --target-org <TARGET_ORG_ALIAS> --wait 30
```

If you no longer have the job ID:

```bash
sf project deploy report --json --use-most-recent --target-org <TARGET_ORG_ALIAS> --wait 30
```

Continue only after the deploy result is `Succeeded`.

## 6. Publish Service and Employee Agents

Use this section only for Service and Employee Agents. `sf project deploy` moves editable `AiAuthoringBundle` source. Publish creates a runnable version. Activate makes it available.

Complete the target-org steps from the agent guide before publishing.

Validate the deployed bundle:

```bash
sf agent validate authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

Start live preview before publishing:

```bash
sf agent preview start --json --authoring-bundle <AGENT_API_NAME> --use-live-actions --target-org <TARGET_ORG_ALIAS>
```

Use live preview for deployment readiness. Simulated preview can use mock data or relaxed checks; it does not prove target-org permissions, records, flows, prompts, callouts, or Data 360 access.

Send a representative message with the returned `result.sessionId`:

```bash
sf agent preview send --json --authoring-bundle <AGENT_API_NAME> --session-id <SESSION_ID> --utterance "Test the main happy path" --target-org <TARGET_ORG_ALIAS>
```

End the preview:

```bash
sf agent preview end --json --authoring-bundle <AGENT_API_NAME> --session-id <SESSION_ID> --target-org <TARGET_ORG_ALIAS>
```

Publish:

```bash
sf agent publish authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

Activate:

```bash
sf agent activate --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

With `--json` and no `--version`, the CLI activates the latest published version automatically.

For audited rollouts, activate an explicit version:

```bash
sf agent activate --json --api-name <AGENT_API_NAME> --version <VERSION_NUMBER> --target-org <TARGET_ORG_ALIAS>
```

Activating a new version sends new sessions to that version. Existing sessions can continue on the version that started them.

Smoke test the active agent:

Start a published-agent preview session:

```bash
sf agent preview start --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

Send a representative message with the returned `result.sessionId`:

```bash
sf agent preview send --json --api-name <AGENT_API_NAME> --session-id <SESSION_ID> --utterance "Test the main happy path" --target-org <TARGET_ORG_ALIAS>
```

End the preview session:

```bash
sf agent preview end --json --api-name <AGENT_API_NAME> --session-id <SESSION_ID> --target-org <TARGET_ORG_ALIAS>
```

**Stop if:** Live preview fails, returns no expected data, or reports missing agent-user permissions. Fix target-org access before publishing.

For clean-target Employee Agent deployments, deploy or update the permission set that contains `agentAccesses` only after the agent is published and active.

To roll back a bad version, reactivate the prior known-good version:

```bash
sf agent activate --json --api-name <AGENT_API_NAME> --version <PRIOR_VERSION_NUMBER> --target-org <TARGET_ORG_ALIAS>
```

Capture the current and prior agent version numbers, session IDs, failing utterances, and deployment job ID for support. Deactivate the agent only when no version should be available to users.

## 7. Capture go-live proof

Save these values or screenshots with the deployment handoff:

- Deployment job ID or Deployment Status screenshot.
- Apex test result summary when Apex was included.
- Active Service or Employee Agent version when an agent was published.
- Non-admin Employee Agent smoke test if employees will use the agent.
- Data Kit component deployment and refreshed target data if the agent uses Data 360.
- Approved Lead Nurture Agent email preview and mailbox/EAC setup if the deployment includes Lead Nurture Agent.
- Web messaging conversation test and `MessagingSession` ID if the agent is deployed to a web messaging channel.

**Target-org evidence:** Screenshots and IDs prove readiness for one target org only. Do not reuse them for another org.
