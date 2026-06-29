# Before You Start

Prepare for sandbox-to-production deployment with Salesforce CLI and `package.xml`.

No CLI experience is required. Replace the documented placeholders, then copy each command box into Terminal.

> **Required before deploy:** Confirm the target org is ready before running deploy commands. Missing Agentforce, Data 360, Messaging, or permission prerequisites should be fixed first.

## Gather values

Gather only values used by your guide. Every path needs:

| Value | Use |
|---|---|
| `<TARGET_ORG_ALIAS>` | The production org or sandbox you deploy into |
| `<PACKAGE_XML_PATH>` | Package manifest path, usually `manifest/package.xml` |

Package-specific guides list the extra values they need, such as agent name, agent user, Data Kit name, Web Chat channel, or Lead Nurturing email settings.

## Run commands

Run command boxes one at a time:

1. Replace every placeholder before you run the command.
2. Do not include the angle brackets.
3. Press Return and wait for the command to finish.
4. If the command returns JSON, look for `"status": 0`.
5. For deploy commands, also confirm `result.status` is `Succeeded`.
6. If a deploy is `InProgress` or `Pending`, do not run the deploy again. Use the deploy report command in [Deploy a Package](01-deploy-package.md).

On error: stop, open [Troubleshooting](03-troubleshooting.md), and do not continue until the step is resolved.

## Install Salesforce CLI

Confirm Salesforce CLI works:

```bash
sf --version
```

If `sf` is not found, install Salesforce CLI with the Salesforce installer or npm:

```bash
npm install --global @salesforce/cli
```

## Open the package folder

Move to the folder that contains `sfdx-project.json`:

```bash
cd /path/to/deploy-package
```

Confirm required files exist:

```bash
ls sfdx-project.json <PACKAGE_XML_PATH>
```

Open `sfdx-project.json`. Confirm `sourceApiVersion` is `64.0` or later; older API versions can miss or fail Agentforce metadata such as `GenAiPlannerBundle`.

## Log in to the target org

> **Production path:** Use the production login URL only when deploying to production.

```bash
sf org login web --json --alias <TARGET_ORG_ALIAS> --instance-url https://login.salesforce.com
```

> **Sandbox path:** Use the sandbox login URL when deploying to a sandbox or testing the package before production.

```bash
sf org login web --json --alias <TARGET_ORG_ALIAS> --instance-url https://test.salesforce.com
```

Confirm the target org:

```bash
sf org display --json --target-org <TARGET_ORG_ALIAS>
```

Check `username`, `instanceUrl`, and org details. Stop if this is not the correct org.

## Check Agentforce readiness

For Service or Employee Agent packages:

```bash
sf org list metadata --json --metadata-type AiAuthoringBundle --target-org <TARGET_ORG_ALIAS>
sf agent validate authoring-bundle --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

> **Stop if:** The command returns `INVALID_TYPE`, `Not available for deploy for this organization`, or `AgentApiNotFound`. Enable and provision Agentforce for the target org before continuing.

If prompt templates are included:

```bash
sf org list metadata --json --metadata-type GenAiPromptTemplate --target-org <TARGET_ORG_ALIAS>
```

## Check Data 360 readiness

> **Data 360 prerequisite:** If the agent uses Data 360 / Data Cloud, complete the Data Kit guide before publishing the agent.

```bash
sf api request rest "/services/data/v67.0/ssot/data-kits" --target-org <TARGET_ORG_ALIAS> --stream-to-file data-kits-check.json
```

Open `data-kits-check.json`.

- Success: Data Kits list or an empty list.
- Stop: `FUNCTIONALITY_NOT_ENABLED`, `CdpDataKit`, or any `errorCode`.
