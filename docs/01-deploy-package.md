# Deploy a Package

Validate and deploy a `package.xml` package to a sandbox or production org.

**Required before deploy:** Complete [Before You Start](00-before-you-start.md), confirm the target org, and confirm the package has no unreplaced placeholders.

## Values needed

| Value | Use |
|---|---|
| `<TARGET_ORG_ALIAS>` | Org you deploy into |
| `<PACKAGE_XML_PATH>` | Final package manifest |
| `<JOB_ID_FROM_VALIDATE>` | Successful production validation job ID |
| `<JOB_ID>` | Sandbox dry-run, deploy, or report job ID |

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

`package.xml` lists only the typed components for the package being moved.

**Do not package:** Do not merge Data 360 metadata into the agent package. Use [Deploy a Data Cloud Data Kit](20-data-cloud-data-kit.md). Do not add Lead Nurturing managed-template runtime metadata to the dependencies package.

## What to hand off

Hand off the whole `deploy-package` folder. Salesforce CLI deploys files under `force-app/main/default`; `package.xml` alone is not enough.

Before handoff, confirm:

- `sfdx-project.json` is at the package folder root.
- `manifest/package.xml` is the final manifest.
- Every listed component exists under `force-app/main/default`.
- No source-org usernames, domains, credential secrets, or connector auth values remain in the package.
- The deployment owner starts with [Agentforce Deployment Guides](index.md).
- Package-specific manual steps are linked or named in the handoff notes.
- Any package-specific worksheet values are complete for the guides in scope.
- Any prior validation output or job IDs are included with the handoff notes.

## Validate and deploy to production

**Production path:** Production deploys with Apex run tests. Include matching test classes.

Validate first:

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

A package is ready to continue only after the deploy result is `Succeeded`. Use `result.id` as:

- `<JOB_ID_FROM_VALIDATE>` for production validation.
- `<JOB_ID>` for sandbox dry runs and deployed packages.

## Validate and deploy to a sandbox

**Sandbox path:** Use a sandbox dry run first. If your sandbox release policy requires tests, replace `NoTestRun` with `RunLocalTests`.

```bash
sf project deploy start --json --dry-run --manifest <PACKAGE_XML_PATH> --target-org <TARGET_ORG_ALIAS> --test-level NoTestRun --wait 30
```

If the dry run succeeds:

```bash
sf project deploy start --json --manifest <PACKAGE_XML_PATH> --target-org <TARGET_ORG_ALIAS> --test-level NoTestRun --wait 30
```

## Check deploy status

Use `result.id`:

```bash
sf project deploy report --json --job-id <JOB_ID> --target-org <TARGET_ORG_ALIAS> --wait 30
```

If you no longer have the job ID:

```bash
sf project deploy report --json --use-most-recent --target-org <TARGET_ORG_ALIAS> --wait 30
```

## Continue after deploy

**Manual after deploy:** A successful package deploy is not the finish line. Complete the package-specific post-deploy guide below before go-live.

| Package type | Next step |
|---|---|
| Service Agent | [Deploy and Activate a Service Agent](10-service-agent.md) |
| Employee Agent | [Deploy and Activate an Employee Agent](11-employee-agent.md) |
| Lead Nurture Agent | [Deploy Lead Nurture Agent Dependencies](12-lead-nurture-agent.md) |
| Reusable Agent Assets | [Move Reusable Agent Assets](13-reusable-agent-assets.md) |
| Data Kit | [Deploy a Data Cloud Data Kit](20-data-cloud-data-kit.md) |
| Enhanced Web Chat | [Migrate Enhanced Web Chat](21-enhanced-web-chat.md) |
