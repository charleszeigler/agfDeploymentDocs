# Before You Start

Use this guide to prepare for a sandbox-to-production deployment with Salesforce CLI and `package.xml`.

> **Required before deploy:** Confirm the target org is ready before running deploy commands. Missing Agentforce, Data 360, Messaging, or permission prerequisites should be fixed first.

## Gather values

| Value | Use |
|---|---|
| `<SOURCE_ORG_ALIAS>` | Alias for the sandbox you retrieve from |
| `<TARGET_ORG_ALIAS>` | Alias for the org you deploy into |
| `<PACKAGE_XML_PATH>` | Manifest path, usually `manifest/package.xml` |
| `<AGENT_API_NAME>` | Service or Employee Agent API name |
| `<DATA_KIT_DEVELOPER_NAME>` | Data Kit developer name, if Data 360 is used |
| `<DATA_CLOUD_TABLE_NAME>` | Data Cloud DLO or DMO table name, if row-count validation is used |
| `<MESSAGING_CHANNEL_API_NAME>` | Enhanced Web Chat messaging channel API name, if Web Chat is used |
| `<MESSAGING_SESSION_ID>` | Messaging Session record ID created during an Enhanced Web Chat smoke test |
| `<AGENT_USER_USERNAME>` | Username of the Service Agent user in the target org |
| `<EMPLOYEE_USERNAME>` | Username of an employee who will use the Employee Agent |
| `<SESSION_ID>` | Session ID returned by an agent preview command |
| `<VERSION_NUMBER>` | Agent version number returned by publish or activation status |
| `<JOB_ID>` | Deploy or Data Kit job ID returned by Salesforce CLI or REST API |
| `<JOB_ID_FROM_VALIDATE>` | Job ID from a successful production validation command |

## Run command boxes

The gray command boxes in these guides are meant to be copied into Terminal one at a time.

1. Replace every placeholder before you run the command.
2. Do not include the angle brackets.
3. Press Return and wait for the command to finish.
4. If the command returns JSON, look for `"status": 0`.
5. For deploy commands, also confirm `result.status` is `Succeeded`.

If a command prints an error, stop on that step and use [Troubleshooting](03-troubleshooting.md). Do not continue to the next command until the error is resolved.

## Install Salesforce CLI

Install Salesforce CLI, then confirm it works:

```bash
sf --version
```

If `sf` is not found, install Salesforce CLI with the Salesforce installer or with npm:

```bash
npm install --global @salesforce/cli
```

## Open the package folder

Open Terminal and move to the deployment folder. This is the folder that contains `sfdx-project.json`.

```bash
cd /path/to/deploy-package
```

Confirm the expected files exist:

```bash
ls sfdx-project.json <PACKAGE_XML_PATH>
```

## Log in to the target org

> **Production path:** Use the production login URL only when deploying to production.

```bash
sf org login web --json --alias <TARGET_ORG_ALIAS> --instance-url https://login.salesforce.com
```

> **Sandbox path:** Use the sandbox login URL when deploying to a sandbox or testing the package before production.

```bash
sf org login web --json --alias <TARGET_ORG_ALIAS> --instance-url https://test.salesforce.com
```

Confirm the target org before you deploy:

```bash
sf org display --json --target-org <TARGET_ORG_ALIAS>
```

Check the `username`, `instanceUrl`, and org details. Stop if this is not the correct org.

## Check Agentforce readiness

Run these checks for Service or Employee Agent packages:

```bash
sf org list metadata --json --metadata-type AiAuthoringBundle --target-org <TARGET_ORG_ALIAS>
sf agent validate authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

> **Stop if:** The command returns `INVALID_TYPE`, `Not available for deploy for this organization`, or `AgentApiNotFound`. Enable and provision Agentforce for the target org before continuing.

If prompt templates are included, also check:

```bash
sf org list metadata --json --metadata-type GenAiPromptTemplate --target-org <TARGET_ORG_ALIAS>
```

## Check Data 360 readiness

> **Data 360 prerequisite:** If the agent uses Data 360 / Data Cloud, complete the Data Kit guide before publishing the agent.

```bash
sf api request rest "/services/data/v67.0/ssot/data-kits" --target-org <TARGET_ORG_ALIAS> --stream-to-file data-kits-check.json
```

Open `data-kits-check.json`. A success response lists Data Kits or returns an empty list. Stop if the response contains `FUNCTIONALITY_NOT_ENABLED`, `CdpDataKit`, or an `errorCode`.

## Command rules

- Run one command at a time.
- Replace every placeholder before running the command.
- Most commands return JSON. A top-level `"status": 0` means the command ran, but deploy commands also need `result.status` to be `Succeeded`.
- If a deploy is `InProgress` or `Pending`, do not run the deploy again. Use the deploy report command in [Deploy a Package](01-deploy-package.md).
- If a command fails, stop and use [Troubleshooting](03-troubleshooting.md).
