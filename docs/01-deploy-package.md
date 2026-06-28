# Deploy a Package

Use this guide to validate and deploy a `package.xml` package into a sandbox or production org.

> **Required before deploy:** Complete [Before You Start](00-before-you-start.md), confirm the target org, and confirm the package has no unreplaced placeholders.

## What the package contains

A deployment package is a Salesforce DX project:

```text
deploy-package/
├── sfdx-project.json
├── manifest/
│   └── package.xml
└── force-app/main/default/
    ├── aiAuthoringBundles/
    ├── classes/
    ├── flows/
    ├── genAiPromptTemplates/
    ├── lightningTypes/
    ├── lwc/
    ├── objects/
    └── permissionsets/
```

`package.xml` is the typed component list. It can include agent source and dependencies such as Apex, Flows, prompt templates, Custom Lightning Types, LWC editor/renderer components, objects, fields, permission sets, Named Credentials, and External Credentials.

> **Do not package:** Do not merge Data 360 metadata into the agent package. Use [Deploy a Data Cloud Data Kit](20-data-cloud-data-kit.md). Do not add Lead Nurturing managed-template runtime metadata to the dependencies package.

## What to hand off

Give the deployment owner the whole `deploy-package` folder, not only `package.xml`. The manifest lists components, but Salesforce CLI deploys the files under `force-app/main/default`.

Before handoff, confirm:

- `sfdx-project.json` is at the package folder root.
- `manifest/package.xml` is the final manifest.
- Every listed component exists under `force-app/main/default`.
- No source-org usernames, domains, credential secrets, or connector auth values remain in the package.
- The deployment owner knows to start with [Agentforce Deployment Guides](index.md).
- Package-specific manual steps are linked or named in the handoff notes.
- Source worksheets are complete for package-specific values such as agent users, Data Kit names, Lead Nurturing email setup, and Web Chat domains.
- Any prior validation output or job IDs are included with the handoff notes.

## Validate and deploy to production

> **Production path:** Production deploys that include Apex run tests. Include the matching test classes in the package.

Validate first:

```bash
sf project deploy validate --json --manifest <PACKAGE_XML_PATH> --target-org <TARGET_ORG_ALIAS> --test-level RunLocalTests --wait 30
```

If validation succeeds, copy the job ID from `result.id` and quick deploy it:

```bash
sf project deploy quick --json --job-id <JOB_ID_FROM_VALIDATE> --target-org <TARGET_ORG_ALIAS> --wait 30
```

> **Stop if:** You do not have the job ID from a successful `sf project deploy validate` command. Do not quick deploy a sandbox dry-run job ID.

You can also quick deploy the most recent successful validation:

```bash
sf project deploy quick --json --use-most-recent --target-org <TARGET_ORG_ALIAS> --wait 30
```

> **Stop if:** The validation output includes Apex but reports zero tests run. Send the JSON output to the deployment owner before deploying.

After each validation or deploy command, check both values in the JSON output:

- Top-level `"status": 0`
- `result.status` is `Succeeded`

Copy `result.id` as `<JOB_ID_FROM_VALIDATE>` for production validation, or `<JOB_ID>` for sandbox dry runs and deployed packages.

## Validate and deploy to a sandbox

> **Sandbox path:** Use a sandbox dry run first. If your sandbox release policy requires tests, replace `NoTestRun` with `RunLocalTests`.

```bash
sf project deploy start --json --dry-run --manifest <PACKAGE_XML_PATH> --target-org <TARGET_ORG_ALIAS> --test-level NoTestRun --wait 30
```

If the dry run succeeds, deploy:

```bash
sf project deploy start --json --manifest <PACKAGE_XML_PATH> --target-org <TARGET_ORG_ALIAS> --test-level NoTestRun --wait 30
```

## Check deploy status

Use the job ID from `result.id`:

```bash
sf project deploy report --json --job-id <JOB_ID> --target-org <TARGET_ORG_ALIAS> --wait 30
```

If you no longer have the job ID, check the most recent deploy:

```bash
sf project deploy report --json --use-most-recent --target-org <TARGET_ORG_ALIAS> --wait 30
```

## Retrieve from a source sandbox

Use retrieve when preparing the customer package from the source sandbox:

```bash
sf project retrieve start --json --manifest <PACKAGE_XML_PATH> --target-org <SOURCE_ORG_ALIAS>
```

> **Customer-specific value:** After retrieve, replace only documented target-org values in editable source or config files. Service Agent `default_agent_user`, credential secrets, connector auth, domains, CORS entries, and Web Chat publish state are target-org values.
> **Stop if:** The value is inside committed agent version metadata, generated planner/plugin/function metadata, or generated Data Kit member metadata. Do not edit generated metadata unless Salesforce documentation or Salesforce Support confirms the exact change.

## Continue after deploy

| Package type | Next step |
|---|---|
| Service Agent | [Deploy and Activate a Service Agent](10-service-agent.md) |
| Employee Agent | [Deploy and Activate an Employee Agent](11-employee-agent.md) |
| Lead Nurturing | [Deploy Lead Nurturing Dependencies](12-lead-nurture-sdr.md) |
| Data Kit | [Deploy a Data Cloud Data Kit](20-data-cloud-data-kit.md) |
| Enhanced Web Chat | [Migrate Enhanced Web Chat](21-enhanced-web-chat.md) |
