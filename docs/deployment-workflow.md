# Package CLI Reference

Use this page as a shared Salesforce CLI reference when a deployment guide tells you to create, retrieve, validate, or deploy a metadata package. It is not a substitute for [Deploy and Activate a Service Agent](10-service-agent.md), [Deploy and Activate an Employee Agent](11-employee-agent.md), or [Deploy Lead Nurture Agent Dependencies](12-lead-nurture-agent.md).

## Use this page for

| Need | Use |
|---|---|
| Start a clean package folder | [Create the package folder](#1-create-the-package-folder) |
| Confirm `package.xml` member syntax | [Build package.xml from exact source names](#2-build-packagexml-from-exact-source-names) |
| Retrieve source metadata | [Retrieve source files when needed](#3-retrieve-source-files-when-needed) |
| Validate or deploy a reviewed package | [Validate and deploy](#4-validate-and-deploy) |

Do not use this page as a substitute for a primary deployment guide. Agent publish, activation, channel setup, Data 360 readiness, and feature-specific validation belong in the guide for that deployment path. Service Agent is one primary path, not the only one.

## 1. Create the package folder

Use one Salesforce DX project folder per deployment package, or use an existing project if it already has the right package directory.

```bash
sf template generate project --name deploy-package --template empty --default-package-dir force-app --api-version 66.0
mkdir -p deploy-package/manifest
```

API version policy: use `66.0` for Agent Script packages unless Salesforce examples change. Use `67.0` for Data Kit REST calls and generated DevOps Data Kit or legacy action manifests unless the generated file says otherwise.

Expected shape:

```text
deploy-package/
+-- sfdx-project.json
+-- manifest/
|   +-- package.xml
+-- force-app/main/default/
```

Save the manifest as `manifest/package.xml`, or use the path you will pass to `--manifest`.

Before retrieve or deploy:

- Replace placeholders with exact API names.
- Remove unused `<types>` blocks.
- Keep only one package concern in the folder.
- Keep Data 360 metadata out of agent packages unless the Data 360 guide says otherwise.
- Remove usernames, website domains, generated snippets, credential secrets, OAuth tokens, connector auth, and runtime state.

## 2. Build package.xml from exact source names

Start with the smallest known member, retrieve it, inspect the source, then add confirmed dependencies. Do not fill every template block preemptively.

Use exact API names or Developer Names, not labels. If a name comes from Setup UI, confirm the API name in the source org before placing it in XML.

| Metadata type | `package.xml` member format |
|---|---|
| `AiAuthoringBundle` | Agent API name, for example `Service_Agent` |
| `ApexClass` | Class name only, for example `CaseLookupAction`; do not include `.cls` |
| `Flow` | Flow API name only; do not include `.flow-meta.xml` or a version number |
| `GenAiPromptTemplate` | Prompt template API name |
| `LightningTypeBundle`, `LightningComponentBundle` | Bundle API name |
| `CustomObject` | Object API name, for example `Customer_Profile__c` |
| `CustomField` | Object-qualified field API name, for example `Account.Intent_Score__c` |
| `Report` | Folder-qualified report Developer Name, for example `Sales_Reports/Account_Scope` |
| `EmailTemplate` | Folder-qualified template Developer Name, for example `Sales_Templates/Follow_Up` |
| `PermissionSet`, `PermissionSetGroup` | API name, not label |
| `NamedCredential`, `ExternalCredential` | API name; never include secrets or authenticated connection state |
| `CustomApplication`, `CustomTab`, `FlexiPage`, `Queue`, `QueueRoutingConfig` | API name |

Formatting rules:

- In Markdown, placeholders appear as `<AGENT_API_NAME>`; in XML, use XML-safe values such as `AGENT_API_NAME` or the real API name.
- Remove unused `<types>` blocks entirely.
- Each `<types>` block contains one metadata `<name>` and one or more `<members>` values for that metadata type.
- Do not use a pseudo metadata type named `Agent`; use `AiAuthoringBundle` when the guide tells you to deploy editable agent source.

Useful source-org lookups:

```bash
sf org list metadata --json --metadata-type AiAuthoringBundle --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type ApexClass --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type Flow --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type GenAiPromptTemplate --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type PermissionSet --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type NamedCredential --target-org <SOURCE_ORG_ALIAS>
sf org list metadata --json --metadata-type ExternalCredential --target-org <SOURCE_ORG_ALIAS>
```

Retrieve-inspect-repeat loop:

1. Copy the selected manifest template to `manifest/package.xml`.
2. Keep only members you can name exactly.
3. Retrieve with the current manifest.
4. Fix or remove any member that does not exist.
5. Inspect retrieved files for references to Apex, flows, prompt templates, objects, fields, permission sets, Custom Lightning Types, and named or external credentials. In `.agent` source, search `apex://`, `flow://`, `prompt://`, `generatePromptResponse://`, `complex_data_type_name`, and named-credential names when used.
6. Add only confirmed dependencies.
7. Stop when each manifest member has a matching file under `force-app/main/default`, unless the guide explicitly calls out a package-only reference.

## 3. Retrieve source files when needed

Authenticate and confirm the source org:

```bash
sf org login web --json --alias <SOURCE_ORG_ALIAS> --instance-url https://test.salesforce.com
sf org display --json --target-org <SOURCE_ORG_ALIAS>
```

Retrieve from the package folder:

```bash
sf project retrieve start --json --manifest <PACKAGE_XML_PATH> --target-org <SOURCE_ORG_ALIAS>
```

After retrieve, confirm:

- The retrieve result is `Succeeded`.
- Expected files are under `force-app/main/default`.
- The package contains only the metadata needed for this package.
- The package does not include secrets, runtime state, generated channel snippets, or source-org-specific URLs.

## 4. Validate and deploy

Confirm the target org before validating:

```bash
sf org login web --json --alias <TARGET_ORG_ALIAS> --instance-url https://login.salesforce.com
sf org display --json --target-org <TARGET_ORG_ALIAS>
```

Use `https://test.salesforce.com` instead of `https://login.salesforce.com` for a sandbox target.

Production deploys should validate first and run Apex tests:

```bash
sf project deploy validate --json --manifest <PACKAGE_XML_PATH> --target-org <TARGET_ORG_ALIAS> --test-level RunLocalTests --wait 30
sf project deploy quick --json --job-id <JOB_ID_FROM_VALIDATE> --target-org <TARGET_ORG_ALIAS> --wait 30
```

Sandbox dry run:

```bash
sf project deploy start --json --dry-run --manifest <PACKAGE_XML_PATH> --target-org <TARGET_ORG_ALIAS> --test-level NoTestRun --wait 30
```

Sandbox deploy after a successful dry run:

```bash
sf project deploy start --json --manifest <PACKAGE_XML_PATH> --target-org <TARGET_ORG_ALIAS> --test-level NoTestRun --wait 30
```

Check deploy status:

```bash
sf project deploy report --json --job-id <JOB_ID> --target-org <TARGET_ORG_ALIAS> --wait 30
```

Stop if validation fails, zero Apex tests run when Apex is included, the target org is wrong, or the deployment guide lists target-org setup that has not been completed.

## 5. Capture go-live proof

Save only evidence for the target org you deployed to:

- Deployment job ID or Deployment Status screenshot.
- Apex test result summary when Apex was included.
- Target-org setup or validation proof required by the deployment guide.
- Smoke test result, including record IDs or session IDs when the guide requires them.

Do not reuse evidence from another org.
