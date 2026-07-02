# Deploy a Package

Use this page for the common Salesforce CLI steps after choosing a package guide.

This page does not decide what belongs in `package.xml`. The Service Agent, Employee Agent, Lead Nurture Agent, Data Cloud Data Kit, Enhanced Web Chat, and Legacy Agent Actions guides define the package contents and target-org setup.

## Use This Page For

| Need | Where to go |
|---|---|
| Choose what kind of package you are moving | [Overview](index.md) |
| Build package-specific `package.xml` members | The selected package guide |
| Create the package folder, retrieve files, validate, and deploy | This page |
| Publish and activate Service or Employee Agents | This page |
| Data Kit component deployment, Web Chat setup, Lead Nurture Agent email setup, or legacy action wiring | The selected package guide |

## 1. Create the package folder

Create or open one Salesforce DX project folder per deployment package:

```text
deploy-package/
+-- sfdx-project.json
+-- manifest/
|   +-- package.xml
+-- force-app/main/default/
```

Use this minimal `sfdx-project.json`:

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
- Keep Lead Nurture Agent runtime metadata out of dependency packages.
- Remove source-org usernames, website domains, generated snippets, credential secrets, OAuth tokens, connector auth, and runtime state.

## 2. Retrieve source files when needed

Skip this section if the package folder already contains the reviewed source files.

Log in to the source sandbox and confirm the org:

```bash
sf org login web --json --alias <SOURCE_ORG_ALIAS> --instance-url https://test.salesforce.com
sf org display --json --target-org <SOURCE_ORG_ALIAS>
```

Use these checks when you need exact API names from the source sandbox:

```bash
sf org list metadata --json --metadata-type AiAuthoringBundle --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type GenAiPlugin --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type GenAiFunction --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type GenAiPromptTemplate --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type LightningTypeBundle --target-org <SOURCE_ORG_ALIAS>
```

For Data Kits, use the source Data Kit generated manifest. Do not hand-build the Data Kit manifest from this page.

Retrieve from the package folder:

```bash
sf project retrieve start --json --manifest <PACKAGE_XML_PATH> --target-org <SOURCE_ORG_ALIAS>
```

Confirm the retrieve result is `Succeeded`.

Use a two-pass retrieve for Service and Employee Agent source packages when backing dependencies are unknown:

1. Retrieve the agent source with the `AiAuthoringBundle` member first.
2. Open `force-app/main/default/aiAuthoringBundles/<AGENT_API_NAME>/<AGENT_API_NAME>.agent`.
3. Search for `apex://` and add each invocable Apex class and test class to `package.xml`.
4. Search for `flow://` and add each Flow to `package.xml`.
5. Add referenced prompt templates, objects, fields, permission sets, credentials, and Custom Lightning Types only when the Service or Employee Agent source uses them.
6. Run retrieve again with the completed manifest.

Review the package before deploy:

- Every `package.xml` member has a matching file under `force-app/main/default`.
- The package contains only the package type being moved.
- The package does not contain source-org usernames, website domains, generated Web Chat snippets, credential secrets, OAuth tokens, connector auth, or runtime state.
- The package-specific guide lists all manual target-org steps that remain after deploy.

## 3. Confirm the target org

Install and command checks:

```bash
sf --version
sf agent --help
```

For Data 360 / Data Cloud packages:

```bash
sf data360 --help
```

**Stop if:** A required command group is unavailable and the machine cannot install or load Salesforce CLI plugins.

Log in to the target org and confirm the org details.

Production:

```bash
sf org login web --json --alias <TARGET_ORG_ALIAS> --instance-url https://login.salesforce.com
sf org display --json --target-org <TARGET_ORG_ALIAS>
```

Sandbox:

```bash
sf org login web --json --alias <TARGET_ORG_ALIAS> --instance-url https://test.salesforce.com
sf org display --json --target-org <TARGET_ORG_ALIAS>
```

For Service or Employee Agent packages, confirm Agentforce metadata is available:

```bash
sf org list metadata --json --metadata-type AiAuthoringBundle --target-org <TARGET_ORG_ALIAS>
```

**Stop if:** The command returns `INVALID_TYPE` or `Not available for deploy for this organization`. Enable and provision Agentforce for the target org before continuing.

If the agent uses Data 360 / Data Cloud, complete [Deploy a Data Cloud Data Kit](20-data-cloud-data-kit.md) before publishing the agent.

```bash
sf api request rest "/services/data/v67.0/ssot/data-kits" --target-org <TARGET_ORG_ALIAS> --stream-to-file data-kits-check.json
```

Open `data-kits-check.json`. Stop on `FUNCTIONALITY_NOT_ENABLED`, `CdpDataKit`, or any `errorCode`.

## 4. Validate and deploy

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

## 5. Publish Service and Employee Agents

Use this section only for Service and Employee Agents. `sf project deploy` moves editable `AiAuthoringBundle` source. Publish creates a runnable version. Activate makes it available.

Complete target-org setup from the agent-type guide before publishing.

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

```bash
sf agent preview start --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
sf agent preview send --json --api-name <AGENT_API_NAME> --session-id <SESSION_ID> --utterance "Test the main happy path" --target-org <TARGET_ORG_ALIAS>
sf agent preview end --json --api-name <AGENT_API_NAME> --session-id <SESSION_ID> --target-org <TARGET_ORG_ALIAS>
```

**Stop if:** Live preview fails, returns no expected data, or reports missing agent-user permissions. Fix target-org access before publishing.

For clean-target Employee Agent deployments, deploy or update the permission set that contains `agentAccesses` only after publish and activation create the target `BotDefinition`.

To roll back a bad version, reactivate the prior known-good version:

```bash
sf agent activate --json --api-name <AGENT_API_NAME> --version <PRIOR_VERSION_NUMBER> --target-org <TARGET_ORG_ALIAS>
```

Capture the active version, prior version, preview or runtime session IDs, failing utterances, and deployment job ID for support. Deactivate the agent only when no version should be available to users.

## 6. Finish target setup and capture proof

Save these values or screenshots with the deployment handoff:

- Deployment job ID or Deployment Status screenshot.
- Apex test result summary when Apex was included.
- Active Service or Employee Agent version when an agent was published.
- Non-admin Employee Agent smoke test when employee access is in scope.
- Data Kit component deployment and refreshed target data when Data 360 / Data Cloud is in scope.
- Approved Lead Nurture Agent email preview and mailbox/EAC setup when Lead Nurture Agent is in scope.
- Website conversation test and `MessagingSession` ID when Enhanced Web Chat is in scope.

**Target-org evidence:** Screenshots and IDs prove readiness for one target org only. Do not reuse them for another org.
