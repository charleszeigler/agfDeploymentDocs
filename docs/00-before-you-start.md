# Before You Start

Prepare for sandbox-to-production deployment with Salesforce CLI and `package.xml`.

**Required before deploy:** Confirm the target org is ready before running deploy commands. Missing Agentforce, Data 360, Messaging, or permission prerequisites should be fixed first.

## Required values

Every path needs:

| Value | Use |
|---|---|
| `<TARGET_ORG_ALIAS>` | The production org or sandbox you deploy into |
| `<PACKAGE_XML_PATH>` | Package manifest path, usually `manifest/package.xml` |

Package-specific guides list the extra values they need.

## Package preflight

Before deploy, confirm:

- Salesforce CLI is installed and available as `sf`.
- The package root contains `sfdx-project.json`.
- `sfdx-project.json` uses `sourceApiVersion` `64.0` or later; older API versions can miss or fail Agentforce metadata.
- `<PACKAGE_XML_PATH>` points to the final manifest.
- The package has no unreplaced placeholders, source-org usernames, website domains, credential secrets, OAuth tokens, connector auth, or runtime state.

Confirm the CLI version:

```bash
sf --version
```

## Log in to the target org

**Production path:** Use the production login URL only when deploying to production.

```bash
sf org login web --json --alias <TARGET_ORG_ALIAS> --instance-url https://login.salesforce.com
```

**Sandbox path:** Use the sandbox login URL when deploying to a sandbox or testing the package before production.

```bash
sf org login web --json --alias <TARGET_ORG_ALIAS> --instance-url https://test.salesforce.com
```

Confirm the target org:

```bash
sf org display --json --target-org <TARGET_ORG_ALIAS>
```

Confirm `username`, `instanceUrl`, and org details match the intended target. Stop if this is not the correct org.

## Check Agentforce readiness

For Service or Employee Agent packages:

```bash
sf org list metadata --json --metadata-type AiAuthoringBundle --target-org <TARGET_ORG_ALIAS>
sf agent validate authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

**Stop if:** The command returns `INVALID_TYPE`, `Not available for deploy for this organization`, or `AgentApiNotFound`. Enable and provision Agentforce for the target org before continuing.

If prompt templates are included:

```bash
sf org list metadata --json --metadata-type GenAiPromptTemplate --target-org <TARGET_ORG_ALIAS>
```

## Check Data 360 readiness

**Data 360 prerequisite:** If the agent uses Data 360 / Data Cloud, complete the Data Kit guide before publishing the agent.

```bash
sf api request rest "/services/data/v67.0/ssot/data-kits" --target-org <TARGET_ORG_ALIAS> --stream-to-file data-kits-check.json
```

Open `data-kits-check.json`.

- Success: Data Kits list or an empty list.
- Stop: `FUNCTIONALITY_NOT_ENABLED`, `CdpDataKit`, or any `errorCode`.
