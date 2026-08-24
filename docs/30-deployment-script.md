# Build a staged Agentforce deploy script

Write a Node coordinator that runs this repo's packages in order from sandbox to production. Do not treat one `sf project deploy start --source-dir force-app` as an Agentforce handoff.

This page is for someone writing or running that coordinator. It is not a substitute for [Deploy and Activate a Service Agent](10-service-agent.md), [Deploy and Activate an Employee Agent](11-employee-agent.md), or [Deploy Lead Nurture Agent Dependencies](12-lead-nurture-agent.md). Follow those guides when you are stepping a single package by hand.

## When this applies

| Field | Value |
|---|---|
| Audience | Operator writing or running a staged CLI coordinator |
| Packages | Service Agent, Employee Agent, Lead Nurture dependencies, DevOps Data Kit, Enhanced Web Chat rebuild |
| Script | Starting template: [`templates/deploy.mjs`](../templates/deploy.mjs). Copy it next to retrieved packages and fill env/placeholders. Not a tested org deployer |
| Runtime | Node, built-in modules only, if any operator uses Windows |
| API version | `67.0` (Summer ’26) unless a generated manifest says otherwise |

**Stop if:** The plan is one Metadata API push of `force-app`. Split the work into the phases below.

**Stop if:** Agentforce, Einstein, Prompt Builder, or Data 360 is not licensed and provisioned in the target org. A coordinator does not create entitlements.

## What the script is

The script sequences Salesforce CLI commands, human checkpoints, and this repo's package order. It is a coordinator.

It is not:

- a replacement for `sf project deploy start --source-dir force-app`
- a substitute for licenses, Einstein, Prompt Builder, or Data 360 entitlements
- a way to deploy Lead Nurture Agent itself
- a way to move an Enhanced Web Chat deployment by Metadata API

Lead Nurture Agent is configured in the target org after its custom dependencies deploy. Enhanced Web Chat is rebuilt and published in the target org. See [Deploy Lead Nurture Agent Dependencies](12-lead-nurture-agent.md) and [Migrate Enhanced Web Chat](21-enhanced-web-chat.md).

## Prefer Node when Windows operators exist

Use Node (`deploy.mjs`) and Node built-ins only (`child_process`, `fs`, `path`, `os`, `readline`) if any operator runs on Windows.

| Reason | Detail |
|---|---|
| No bash | Stock Windows has no bash. Do not ship a `.sh` coordinator |
| `sf.cmd` | On Windows the CLI is `sf.cmd`. Resolve `sf` through `PATHEXT` or call `sf.cmd` explicitly |
| Long Data 360 paths | Retrieved DevOps Data Kit trees and publish-retrieved bot/planner snapshots can exceed Windows path limits |
| `--json` prefix | `sf --json` can print warnings before the object. Parse from the first `{` |
| stdin | Child `sf` must not inherit stdin. Later checkpoints need the operator's keyboard |
| Logs | Write `~/.agf-deployment/<alias>/<timestamp>/deploy.log`. Never write logs under `force-app` or `/tmp` |

`force-app` is retrieve and deploy source. `/tmp` is shared and ephemeral. Home-dir logs stay off both.

Always pass `--json`. Confirm the target with `sf org display`. Do not write access tokens from `--json` output into the log.

**Stop if:** A child `sf` process is attached to the operator's stdin. Spawn with stdin ignored.

## Inventory: what is not a normal MDAPI deploy

| Item | What it is | Coordinator rule |
|---|---|---|
| `AiAuthoringBundle` | Editable Agent Script source | Deploy this. This repo's recommended path is bundle-only, then publish in the target org |
| `default_agent_user` | Service Agent run-as username | Required for Service Agent. Put it under `access:`, not `config:`. Official CLI help that says `config:` is stale. Omit it for Employee Agent |
| Published `Bot`, `BotVersion`, planner snapshots | Created when you publish | Add them to `.forceignore`. Publish with `sf agent publish authoring-bundle --skip-retrieve`. Do not MDAPI-deploy the snapshot as if it were source |
| `GenAiPromptTemplate` | Prompt template definition | Deploy, then confirm published/active in Prompt Builder. Deploy is not activate |
| DevOps Data Kit metadata | Kit definition from the generated manifest | Keep it in its own package (packaging rule). Then UI or reviewed API component Deploy to the **same** data space |
| Search indexes | Data 360 metadata | Move through the DevOps Data Kit when the generated manifest includes them. `Ready` is not rows |
| Retrievers | Data 360 metadata | Official Extensibility matrix: no-code retrievers move in Standard and DevOps kits. Pro-code/ADL retrievers do **not** (No/No). Ensemble retrievers do **not**. Recreate Pro-code/ADL and ensemble retrievers in the target org. Do not plan a kit move for them |
| `ssot__` / `KQ_` | Data 360 and key-qualifier artifacts | Leave confirmed `KQ_` files out of the handoff package. Do not treat leftover `ssot__` / `KQ_` files as normal platform metadata. See [Deploy a Data 360 DevOps Data Kit](20-data-360-data-kit.md) |
| Customer Admin profiles | Org-specific profile | Do not deploy |
| Hardcoded org IDs | Org-specific IDs in retrieved source | Blank them in the handoff package. Fill only after target publish creates the target IDs |

Winter ’25 "do not mix Data 360 and platform metadata" is a **packaging** rule: keep kit metadata out of the agent/platform package. It is not a CLI law that forbids one `sf project deploy` from seeing both kinds of files. The coordinator still deploys them as separate packages.

**Stop if:** The package includes customer Admin profiles, source-org usernames, website domains, generated Web Chat snippets, credential secrets, OAuth tokens, connector auth, or runtime state.

**Stop if:** The Service Agent `.agent` file sets `default_agent_user` under `config:`. Move it under `access:`.

```text
access:
    default_agent_user: "agent.user@example.com"
```

## Phase spine

Align the coordinator with this repo's order. Stop on the first real failure. A watch timeout is not a failure; resume or report the job.

| Order | Phase | What runs |
|---|---|---|
| 1 | Preflight / org confirm | Authenticate. `sf org display`. Confirm username, org Id, and instance URL. Do not log tokens |
| 2 | Data 360 provision + DevOps kit metadata | Confirm Data 360 and the same data space. Deploy the generated DevOps Data Kit metadata package |
| 3 | Kit component deploy / reauth / refresh | Human deploys kit components, reauthorizes connectors, and refreshes data. Operator types `DONE` |
| 4 | Platform dependencies | Objects, fields, Flows, permission sets without `agentAccesses`, named/external credentials, Custom Lightning Types |
| 5 | Prompt templates + activate | Deploy `GenAiPromptTemplate`. Confirm published/active in Prompt Builder **before** Apex |
| 6 | Apex + tests | Deploy project Apex and its tests only after prompts are active. The coordinator recognizes test classes by a `Test` / `Tests` suffix; declare any other naming convention in `APEX_TESTS` so it is not coverage-gated as a unit class |
| 7 | Agent package | Deploy `AiAuthoringBundle` (Service or Employee source). Service Agent: `default_agent_user` under `access:` uses the target-org username. Lead Nurture: dependencies only; do not deploy the agent |
| 8 | Preview | Live-action preview. Fix access before publish |
| 9 | Publish / activate | `sf agent publish authoring-bundle --skip-retrieve`, then `sf agent activate`. Lead Nurture: configure in Builder instead |
| 10 | Employee access | After publish and activation, deploy the `agentAccesses` package. Skip for Service Agent |
| 11 | Web chat rebuild | Rebuild and publish Enhanced Web Chat in the target org. No package template |

**Stop if:** Data 360 is required and the target data space does not match the source, or target data is not refreshed. Do not deploy or preview the agent yet.

**Stop if:** Prompt templates used by Apex are not published/active. Do not start the Apex phase.

**Stop if:** Employee `agentAccesses` is in the first source package. Remove it, publish the agent, then deploy the access package.

When following [Deploy and Activate a Service Agent](10-service-agent.md) or [Deploy and Activate an Employee Agent](11-employee-agent.md) by hand, prompts, Apex, and the bundle may travel in one package. A coordinator splits them so first-install Apex tests do not run against missing templates.

## Critical production lesson

Do not run Apex tests that create live `AiJobRun` records or call live prompt targets before those templates exist and are activated.

Warm orgs hide first-install failures. Templates already present in a reused sandbox or production org make a combined package look safe. A fresh org fails the same tests during validate.

Fix:

1. Deploy prompt templates and activate them before Apex.
2. Tests mock Einstein, `ConnectApi`, and Data 360. Do not enqueue live prompt jobs from a deploy test.

**Stop if:** A test class creates a live prompt job or calls a prompt template that is not yet in the target org.

## Test levels

Official Metadata API / CLI rules:

| Test level | What Salesforce enforces |
|---|---|
| `RunSpecifiedTests` | Only the tests you list. Each Apex class and trigger **in the deployment package** needs 75% coverage from those tests, computed per class, not org-wide |
| `RunLocalTests` | All local tests in the org except managed/unlocked package tests. Default for production deploys that include Apex |
| Sandbox | Does not enforce production coverage. Default sandbox deploy is `NoTestRun` |

Use two different jobs. Do not collapse them.

**(a) Shipping your own packaged Apex** in a coordinator: run the project's tests. Use `RunSpecifiedTests` and list those classes. Meet 75% per deployed class.

**(b) This repo's Agentforce metadata packages that include Apex:** keep production `sf project deploy validate` + `--test-level RunLocalTests`, then `sf project deploy quick --job-id`, as [Deploy and Activate a Service Agent](10-service-agent.md), [Deploy and Activate an Employee Agent](11-employee-agent.md), [Deploy Lead Nurture Agent Dependencies](12-lead-nurture-agent.md), and [Package CLI Reference](deployment-workflow.md) already say.

Never make `RunLocalTests` the default for (a) on a customer org. Their unrelated failing tests will fail your Apex package.

If (b) is aimed at a messy customer org whose local tests are already broken, `RunLocalTests` can fail a valid Agentforce package. That is the risk of following the existing guides in that org. Call it. Do not silently switch (b) to `RunSpecifiedTests` and pretend the Service or Employee Agent guides changed. If the operator still switches, they accept the `RunSpecifiedTests` per-class 75% rule and a deviation from those guides.

Encode production coverage gates in the script. Sandboxes will not do it for you.

## Official CLI mapping

Cite these commands. Do not invent substitutes.

| Job | Command | Do not |
|---|---|---|
| Production dry-run | `sf project deploy validate` then `sf project deploy quick --job-id <ID>` | Do not run validate/quick on a sandbox. Salesforce documents this command as intended for production orgs |
| Sandbox dry-run | `sf project deploy start --dry-run` then `sf project deploy start` | Do not pass a dry-run job Id to `quick` |
| Watch | Default wait is 33 minutes | Do not treat a wait timeout as deploy failure. Use `sf project deploy resume` or `sf project deploy report` |
| Job Id lifetime | Job Ids last 10 days from start | Prefer an explicit `--job-id`. `--use-most-recent` only sees about 3 days |
| Errors | Omit `--ignore-errors` | Never `--ignore-errors` on production. Successful components would save and failed ones would skip |
| Org confirm | `sf org display` | Do not log tokens from `--json` |
| API version | Prefer `--api-version 67.0` (Summer ’26) | Do not keep `66.0` as the coordinator default. Use another version only when a generated manifest says otherwise |

Existing guides pass `--wait 30`. That is an explicit watch window, not a different CLI contract. Timeout still returns a job Id.

Publish after a successful preview:

```bash
sf agent publish authoring-bundle --json --api-name <AGENT_API_NAME> --skip-retrieve --target-org <TARGET_ORG_ALIAS>
sf agent activate --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

`--skip-retrieve` keeps published `Bot` / `BotVersion` / planner files out of the local project. That is the Windows-safe publish path.

## Operator surface

| Flag | Required behavior |
|---|---|
| `--validate-only` | Run preflight and dry-run/validate phases. Do not save to the org past a dry-run or validate job |
| `--deploy` | Run the real deploy path after successful validation |
| `--target-org` | Alias passed to every `sf` command |
| `--operator` | Optional username for permset assign after Employee access deploy. Also recorded in the log header |
| `--start-at` | Resume at a named phase from [`templates/deploy.mjs`](../templates/deploy.mjs) only after earlier phases really completed. Do not replay succeeded phases |
| `--non-interactive` | Fail at any human checkpoint. Do not skip the checkpoint |

Production confirmation: the operator types exactly `DEPLOY`. Any other string aborts.

UI checkpoints (Data Kit component deploy, connector reauth, data refresh, Prompt Builder activate, web chat rebuild): the operator types exactly `DONE`.

**Stop if:** `--non-interactive` is set and a phase requires `DEPLOY` or `DONE`. Exit non-zero. Do not skip.

## Rehearse before production

1. Rehearse the coordinator on a **fresh** Developer sandbox before production.
2. Sandboxes do not enforce production coverage. Encode `RunLocalTests` / `RunSpecifiedTests` gates in the script.
3. Use a full sandbox for data-shaped smoke (Data 360 rows, search, web chat).
4. Do not treat a warm sandbox as first-install proof.

**Stop if:** The only rehearsal org already has the prompt templates, Data Kit components, or agent from a prior attempt.

## Trap catalog

| Trap | What to do |
|---|---|
| Prompt access during Apex tests | Activate templates first. Mock Einstein / `ConnectApi` / Data 360 in tests |
| `default_agent_user` under `config:` | Official Agent Script puts it under `access:`. CLI help that says `config:` is stale. Fix the `.agent` file before deploy |
| Pro-code/ADL or ensemble retriever in a Data Kit | Extensibility matrix is No/No for both kit types. Recreate in the target org. Only no-code retrievers are kit-supported |
| Mixed Data 360 + platform files in one package | Packaging rule, not a CLI prohibition. Split into a kit package and a platform package |
| `DEPLOY` confirmation | Comparison is case-sensitive. Accept only `DEPLOY` |
| CMDT enqueue is async | Custom metadata written through Apex `Metadata.Operations.enqueueDeployment` is not immediately queryable. Wait for the deploy callback or a later phase |
| `UNKNOWN_EXCEPTION` on `ssot__` / `KQ_` | Leftover Data 360 or key-qualifier files are in a platform package. Remove confirmed `KQ_` files per [Deploy a Data 360 DevOps Data Kit](20-data-360-data-kit.md) and retry in a sandbox |
| Windows long path / `--skip-retrieve` | Do not retrieve published bot/planner snapshots. Publish with `--skip-retrieve` |
| Search index Ready but no rows | A DevOps Data Kit moves metadata, not data. Refresh, confirm rows, rebuild the index. See [Deploy a Data 360 DevOps Data Kit](20-data-360-data-kit.md) |
| Data Kit metadata ≠ data | Metadata deploy does not run streams or reauthorize connectors. Wait for the human `DONE` checkpoint |
| `agentAccesses` too early | Employee access package deploys only after publish and activation. See [Deploy and Activate an Employee Agent](11-employee-agent.md) |
| Coverage missing after a green deploy | Do not read coverage until the Apex test run is terminal |

If retrieve, deploy, preview, publish, Data 360, or web messaging fails, use [Troubleshooting](03-troubleshooting.md).

## Procedure to write a new script

1. Confirm the path: Service Agent ([Deploy and Activate a Service Agent](10-service-agent.md)), Employee Agent ([Deploy and Activate an Employee Agent](11-employee-agent.md)), and/or Lead Nurture dependencies ([Deploy Lead Nurture Agent Dependencies](12-lead-nurture-agent.md)).
2. List only the packages this handoff includes. Add [Deploy a Data 360 DevOps Data Kit](20-data-360-data-kit.md) and [Migrate Enhanced Web Chat](21-enhanced-web-chat.md) only when used.
3. Copy `templates/deploy.mjs` next to the DX project, not inside `force-app`. Fill env and placeholders. Use Node built-ins only if Windows operators exist. Prefer API `67.0` unless a generated manifest says otherwise.
4. Resolve `sf` / `sf.cmd`. Spawn every child with stdin ignored and `--json`. Parse stdout from the first `{`.
5. Open `~/.agf-deployment/<alias>/<timestamp>/deploy.log` before the first `sf` call.
6. Implement `--validate-only`, `--deploy`, `--target-org`, `--operator`, `--start-at`, and `--non-interactive`.
7. Implement the phase spine. Fail on the first real error. Resume or report on wait timeout.
8. For production, call `validate` then `quick --job-id`. For sandbox, call `start --dry-run` then `start`. Never `--ignore-errors` on production.
9. Gate production with a `DEPLOY` prompt. Gate Data Kit, Prompt Builder, and web chat with `DONE`. `--non-interactive` fails those gates.
10. Split prompt-template deploy and activate from Apex. Mock Einstein / `ConnectApi` / Data 360 in tests.
11. For your Apex package use `RunSpecifiedTests`. For this repo's Agentforce packages keep `RunLocalTests` on production validate unless the operator is targeting a messy customer org and has accepted that risk.
12. Follow [Inventory: what is not a normal MDAPI deploy](#inventory-what-is-not-a-normal-mdapi-deploy) and [Trap catalog](#trap-catalog).
13. Rehearse on a fresh Developer sandbox. Encode coverage gates. Use a full sandbox for data-shaped smoke.
14. Capture go-live proof for that target org only. See [Capture go-live proof](deployment-workflow.md#5-capture-go-live-proof).

## Operator cheat sheet

| Need | Do this |
|---|---|
| See the path | Start at [docs/index.md](index.md) |
| Starting template | Copy [`templates/deploy.mjs`](../templates/deploy.mjs) next to the retrieved DX project and fill env/placeholders |
| Hand-run one agent package | Use [Deploy and Activate a Service Agent](10-service-agent.md) or [Deploy and Activate an Employee Agent](11-employee-agent.md), not this page |
| CLI verbs only | [Package CLI Reference](deployment-workflow.md) |
| Dry-run production | `--validate-only --target-org <ALIAS>` |
| Deploy production | `--deploy --target-org <ALIAS>`, then type `DEPLOY` |
| Resume | `--start-at <PHASE> --target-org <ALIAS>` |
| CI / no keyboard | `--non-interactive` fails at `DEPLOY` / `DONE`; do not skip |
| Data 360 | [Deploy a Data 360 DevOps Data Kit](20-data-360-data-kit.md), then type `DONE` after component deploy, reauth, and refresh |
| Service Agent user | See [Inventory](#inventory-what-is-not-a-normal-mdapi-deploy) for `access.default_agent_user` |
| Employee access | After publish, deploy `manifests/employee-agent-access-package.xml` |
| Web chat | [Migrate Enhanced Web Chat](21-enhanced-web-chat.md) after the Service Agent is active |
| Failure | [Troubleshooting](03-troubleshooting.md). Do not publish after a failed validate |

## Summary

Start from [`templates/deploy.mjs`](../templates/deploy.mjs). A staged coordinator confirms the org, sequences this repo's Data 360 → platform → prompts → Apex → agent → publish → Employee access → web chat order, and stops on the first real failure. [Inventory](#inventory-what-is-not-a-normal-mdapi-deploy) and [Trap catalog](#trap-catalog) are the source for those rules.

## Related guides

- [docs/index.md](index.md)
- [Deploy and Activate a Service Agent](10-service-agent.md)
- [Deploy and Activate an Employee Agent](11-employee-agent.md)
- [Deploy Lead Nurture Agent Dependencies](12-lead-nurture-agent.md)
- [Deploy a Data 360 DevOps Data Kit](20-data-360-data-kit.md)
- [Migrate Enhanced Web Chat](21-enhanced-web-chat.md)
- [Package CLI Reference](deployment-workflow.md)
- [Troubleshooting](03-troubleshooting.md)

## Sources

- Retrieve and deploy Agentforce metadata: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-dx-deploy-metadata.html
- Publish an authoring bundle (`--skip-retrieve`): https://developer.salesforce.com/docs/platform/salesforce-cli-reference/guide/cli_reference_agent_publish_authoring-bundle.html
- `sf project deploy validate` (production; not sandboxes; default wait 33 minutes): https://developer.salesforce.com/docs/platform/salesforce-cli-reference/guide/cli_reference_project_deploy_validate.html
- `sf project deploy quick` (job Id 10 days; `--use-most-recent` 3 days): https://developer.salesforce.com/docs/platform/salesforce-cli-reference/guide/cli_reference_project_deploy_quick.html
- `sf project deploy start` (`--dry-run`; never `--ignore-errors` on production): https://developer.salesforce.com/docs/platform/salesforce-cli-reference/guide/cli_reference_project_deploy_start.html
- `sf project deploy resume` / `report` (timeout is not failure): https://developer.salesforce.com/docs/platform/salesforce-cli-reference/guide/cli_reference_project_deploy_resume.html
- Running tests / `RunSpecifiedTests` 75% per class: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_deploy_running_tests.htm
- `GenAiPromptTemplate` status (Published vs Draft): https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_genaiprompttemplate.htm
- Apex `Metadata.Operations.enqueueDeployment` is async: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/enqueued-apex-deployments.htm
- Agent Script blocks (`default_agent_user` in the Access block): https://developer.salesforce.com/docs/ai/agentforce/guide/ascript-blocks.html
- Data 360 Extensibility Readiness Matrix (retrievers: no-code Yes/Yes; Pro-code/ADL No/No; ensemble No/No): https://developer.salesforce.com/docs/data/data-cloud-dmo-mapping/guide/c360a-api-isv-readiness-data.html
- DevOps Data Kits: https://developer.salesforce.com/docs/data/data-cloud-dev/guide/packages-data-kits.html
