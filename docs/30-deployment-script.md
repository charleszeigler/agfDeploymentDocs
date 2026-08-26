# Build a staged Agentforce deploy script

Write a Node coordinator that runs this repo's packages in order from a Full or Partial Copy work org to production. Do not treat one `sf project deploy start --source-dir force-app` as an Agentforce handoff.

Not a substitute for [Deploy and Activate a Service Agent](10-service-agent.md), [Deploy and Activate an Employee Agent](11-employee-agent.md), or [Deploy Lead Nurture Agent Dependencies](12-lead-nurture-agent.md). Follow those guides when stepping one package by hand.

## When this applies

| Field | Value |
|---|---|
| Audience | Operator writing or running a staged CLI coordinator |
| Packages | Service Agent, Employee Agent, Lead Nurture dependencies, DevOps Data Kit, Enhanced Web Chat rebuild |
| Script | Starting template: [`templates/deploy.mjs`](../templates/deploy.mjs). Copy it next to retrieved packages. Fill env and placeholders. Not a tested org deployer |
| Runtime | Node, built-in modules only, if any operator uses Windows |
| API version | `67.0` (Summer ’26) unless a generated manifest says otherwise |

**Stop if:** The plan is one Metadata API push of `force-app`. Split the work into the phases below.

**Stop if:** Agentforce, Einstein, Prompt Builder, or Data 360 is not licensed and provisioned in the target org. A coordinator does not create entitlements.

## What the script is

A coordinator. It sequences Salesforce CLI commands, human checkpoints, and this repo's package order.

It is not:

- a replacement for `sf project deploy start --source-dir force-app`
- a substitute for licenses, Einstein, Prompt Builder, or Data 360 entitlements
- a way to deploy Lead Nurture Agent itself
- a way to move Enhanced Web Chat by Metadata API

See [Lead Nurture](12-lead-nurture-agent.md) and [Enhanced Web Chat](21-enhanced-web-chat.md).

## Write the coordinator

1. Confirm the path: [Service Agent](10-service-agent.md), [Employee Agent](11-employee-agent.md), and/or [Lead Nurture dependencies](12-lead-nurture-agent.md).
2. List only the packages this handoff includes. Add [Deploy a Data 360 DevOps Data Kit](20-data-360-data-kit.md) and [Migrate Enhanced Web Chat](21-enhanced-web-chat.md) only when used. Legacy actions are a separate hand package, not a coordinator phase. See [Legacy Agent Actions](13-legacy-agent-actions.md).
3. Copy `templates/deploy.mjs` next to the DX project, not inside `force-app`. Fill env. Replace ALL_CAPS placeholders in copied manifests. The template refuses unfilled members.
4. Keep Node built-ins only (`child_process`, `fs`, `path`, `os`, `readline`) if any operator is on Windows. Do not ship a `.sh` coordinator.
5. Keep the flags, `--start-at` names, and CLI mapping below. Fail on the first real error. A wait timeout is not a failure; resume or report the job.
6. Split `PROMPTS_*` and `APEX_*` only when Apex tests would run against missing templates. If those env paths are unset, `platform-deps` deploys the combined shipped manifest.
7. Assign access the coordinator does not. See [Access the coordinator does not assign](#access-the-coordinator-does-not-assign).
8. Rehearse with `--deploy` on a **fresh** Developer sandbox before production. That saves components and runs `RunLocalTests`. `--validate-only` on a sandbox is only a dry-run and does not count as rehearsal. Encode coverage gates in the script. Use the Full or Partial Copy work org for data-shaped smoke (Data 360 rows, search, web chat).
9. Capture go-live proof for that target org only. See [Capture go-live proof](deployment-workflow.md#5-capture-go-live-proof).

**Stop if:** The only rehearsal org already has the prompt templates, Data Kit components, or agent from a prior attempt.

If you write from scratch instead of copying the template, keep the same flags, phase names, and CLI mapping. Also:

| Rule | Detail |
|---|---|
| No bash | Stock Windows has no bash |
| `sf.cmd` | On Windows the CLI is `sf.cmd`. Resolve `sf` through `PATHEXT` or call `sf.cmd` explicitly |
| Long Data 360 paths | Retrieved kit trees and publish-retrieved bot/planner snapshots can exceed Windows path limits |
| `--json` | Always pass `--json`. Parse from the first `{`. Warnings can print before the object |
| stdin | Spawn every child `sf` with stdin ignored. Later checkpoints need the keyboard |
| Logs | `~/.agf-deployment/<alias>/<timestamp>/deploy.log` before the first `sf` call. Not under `force-app` or `/tmp` |
| Tokens | `sf org display` to confirm the target. Do not log access tokens from `--json` output |

**Stop if:** A child `sf` process is attached to the operator's stdin. Spawn with stdin ignored.

## Env

All optional. A missing path skips that phase.

| Env | Use |
|---|---|
| `API_VERSION` | Default `67.0` |
| `WAIT_MINUTES` | Default `33` |
| `TEST_LEVEL` | Agentforce packages. Default `RunLocalTests` |
| `PLATFORM_PACKAGE` | Service, Employee, or Lead manifest. Else the template looks up the shipped name |
| `DATA360_KIT_MANIFEST` / `DATA360_PACKAGE` | Generated DevOps Data Kit manifest |
| `PROMPTS_MANIFEST` / `PROMPTS_PACKAGE` | Optional split prompt-template package |
| `APEX_MANIFEST` / `APEX_PACKAGE` / `APEX_SOURCE_DIR` | Optional split Apex package or class dir |
| `APEX_TESTS` | Extra test class names. Use when tests are not `*Test` / `*Tests` |
| `EMPLOYEE_ACCESS_MANIFEST` | `agentAccesses` package. After publish |
| `AGENT_API_NAME` | Required for preview and publish. Skip those phases if unset |
| `PERMSET_NAME` | Assigned to each `--operator` after `employee-access` |
| `PREVIEW_UTTERANCE` | Default `Test the main happy path` |
| `SKIP_WEB_CHAT=1` | Skip the web-chat `DONE` checkpoint |
| `REQUIRE_DATA360_UI` | Force the Data Kit `DONE` checkpoint even with no kit path |
| `REQUIRE_PROMPTS_ACTIVATE` | Force the Prompt Builder `DONE` checkpoint even with no prompts path |

## Operator flags

| Flag | Required behavior |
|---|---|
| `--validate-only` | Preflight only. Sandbox: dry-run. Production: `validate`. Does not save. Not a dress rehearsal |
| `--deploy` | Save after successful preflight. On a Developer sandbox this is the dress rehearsal. Choose this or `--validate-only`, not both |
| `--target-org` | Required. Alias passed to every `sf` command |
| `--operator` | Repeatable. Username for `PERMSET_NAME` assign. Also logged |
| `--start-at` | Resume at a named phase from [`templates/deploy.mjs`](../templates/deploy.mjs) only after earlier phases really completed. Do not replay succeeded phases |
| `--non-interactive` | Fail at any `DEPLOY` or `DONE` checkpoint. Do not skip |
| `--help` | Print usage |

Production confirmation: type exactly `DEPLOY`. Any other string aborts.

UI checkpoints (Data Kit component deploy, connector reauth, data refresh, Prompt Builder activate, web chat rebuild): type exactly `DONE`.

**Stop if:** `--non-interactive` is set and a phase requires `DEPLOY` or `DONE`. Exit non-zero. Do not skip.

## Phase spine

Align `--start-at` with the names in [`templates/deploy.mjs`](../templates/deploy.mjs). Stop on the first real failure. A watch timeout is not a failure; resume or report the job. There is no separate `agent-package` phase.

| Order | `--start-at` | What runs | Skip when |
|---|---|---|---|
| 1 | `preflight` | Authenticate. `sf org display`. Confirm username, org Id, and instance URL. Do not log tokens | Never. `--start-at` still re-runs org confirm |
| 2 | `data360-kit` | Confirm Data 360 and the same data space. Deploy the generated DevOps Data Kit metadata package | No kit manifest |
| 3 | `data360-ui` | Human deploys kit components, reauthorizes connectors, and refreshes data. Type `DONE` | `--validate-only`, or no kit path unless `REQUIRE_DATA360_UI` |
| 4 | `platform-deps` | Deploy the shipped Service, Employee, or Lead manifest. That file already includes `AiAuthoringBundle` (or Lead dependencies only) plus first-pass deps | No platform manifest |
| 5 | `prompts` | Optional split `GenAiPromptTemplate` package | No `PROMPTS_*` / `prompts-package.xml` |
| 6 | `prompts-activate` | Confirm published/active in Prompt Builder **before** Apex. Type `DONE` | `--validate-only`, or no prompts path unless `REQUIRE_PROMPTS_ACTIVATE` |
| 7 | `apex` | Optional split Apex package. Test classes are a `Test` / `Tests` suffix unless listed in `APEX_TESTS` | No `APEX_*` path and no Apex classes |
| 8 | `agent-preview` | Live-action preview. Service Agent: `default_agent_user` under `access:` uses the target-org username. Unsupported CLI is a log, not a fail | `--validate-only`, or no `AGENT_API_NAME` |
| 9 | `agent-publish` | `sf agent publish authoring-bundle --skip-retrieve`, then `sf agent activate`. Lead Nurture: configure in Builder instead | `--validate-only`, Lead path, or no `AGENT_API_NAME` |
| 10 | `employee-access` | After publish and activation, deploy the `agentAccesses` package | No access manifest, or Service Agent path |
| 11 | `permset-assign` | Assign `PERMSET_NAME` to each `--operator` username | `--validate-only`, or missing `PERMSET_NAME` / `--operator` |
| 12 | `web-chat` | Rebuild and publish Enhanced Web Chat in the target org. No package template | `--validate-only`, or `SKIP_WEB_CHAT=1` |

**Stop if:** Data 360 is required and the target data space does not match the source, or target data is not refreshed. Do not deploy or preview the agent yet.

**Stop if:** Prompt templates used by Apex are not published/active. Do not start the Apex phase.

**Stop if:** Employee `agentAccesses` is in the first source package. Remove it, publish the agent, then deploy the access package.

Hand-run of [Service Agent](10-service-agent.md) or [Employee Agent](11-employee-agent.md) may keep prompts, Apex, and the bundle in one package. A coordinator only splits them when `PROMPTS_*` and `APEX_*` point at separate packages, so first-install Apex tests do not run against missing templates.

`web-chat` still prompts `DONE` on Employee and Lead paths. Set `SKIP_WEB_CHAT=1` when that channel is not in the handoff.

## Access the coordinator does not assign

`permset-assign` runs after `employee-access` and only assigns `PERMSET_NAME` to each `--operator`. Do these by hand from the agent guide, or `--start-at` after they are done:

| Path | Assign before | Command lives in |
|---|---|---|
| Service Agent | `agent-preview` | `AGENT_ACCESS_PERMISSION_SET_API_NAME` to the agent user. [Deploy and Activate a Service Agent](10-service-agent.md) |
| Employee Agent | `agent-preview` | `EMPLOYEE_DATA_ACCESS_PERMISSION_SET_API_NAME` to the preview user. [Deploy and Activate an Employee Agent](11-employee-agent.md) |
| Employee Agent | After `employee-access` | `EMPLOYEE_AGENT_ACCESS_PERMISSION_SET_API_NAME` (or group) to employees. Set `PERMSET_NAME` + `--operator` for this one |

**Stop if:** Employee live preview starts before `EMPLOYEE_DATA_ACCESS_PERMISSION_SET_API_NAME` is assigned.

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

## Official CLI mapping

Cite these commands. Do not invent substitutes.

| Job | Command | Do not |
|---|---|---|
| Production | `sf project deploy validate` then `sf project deploy quick --job-id <ID>` | Do not run validate/quick on a sandbox. Salesforce documents this command as intended for production orgs |
| Dress rehearsal | `sf project deploy start --test-level RunLocalTests` to a fresh Developer sandbox | `--dry-run` does not count. Do not pass a dry-run job Id to `quick` |
| Optional sandbox check | `sf project deploy start --dry-run` | Syntax only. A green dry-run is not a pass to production |
| Watch | Default wait is 33 minutes | Do not treat a wait timeout as deploy failure. Use `sf project deploy resume` or `sf project deploy report` |
| Job Id lifetime | Job Ids last 10 days from start | Prefer an explicit `--job-id`. `--use-most-recent` only sees about 3 days |
| Errors | Omit `--ignore-errors` | Never `--ignore-errors` on production. Successful components would save and failed ones would skip |
| Org confirm | `sf org display` | Do not log tokens from `--json` |
| API version | Prefer `--api-version 67.0` (Summer ’26) | Do not keep `66.0` as the coordinator default. Use another version only when a generated manifest says otherwise |

Guides 10/11/12 pass `--wait 30`. Same CLI contract; timeout still returns a job Id.

Publish after a successful preview:

```bash
sf agent publish authoring-bundle --json --api-name <AGENT_API_NAME> --skip-retrieve --target-org <TARGET_ORG_ALIAS>
sf agent activate --json --api-name <AGENT_API_NAME> --target-org <TARGET_ORG_ALIAS>
```

`--skip-retrieve` keeps published `Bot` / `BotVersion` / planner files out of the local project. That is the Windows-safe publish path.

## Test levels

| Job | Test level | Why |
|---|---|---|
| Your Apex (`apex` phase) | `RunSpecifiedTests` | 75% per class in that package. Customer org local tests must not gate your Apex |
| This repo's Agentforce packages | `RunLocalTests` on the Developer-sandbox dress rehearsal `start`, and on production `validate` then `quick --job-id` | Same contract as [Service Agent](10-service-agent.md), [Employee Agent](11-employee-agent.md), [Lead Nurture](12-lead-nurture-agent.md), and [Package CLI Reference](deployment-workflow.md) |
| Optional `--dry-run` | Same `TEST_LEVEL` as the real deploy (`RunLocalTests` for Agentforce packages) | Does not save. Does not count as rehearsal |

Do not collapse those jobs. Do not silently switch Agentforce packages to `RunSpecifiedTests` and pretend guides 10/11 changed. If the operator still switches, they accept the per-class 75% rule and a deviation from those guides. Call it when a messy customer org's `RunLocalTests` would fail a valid package.

Warm orgs hide first-install failures. Activate prompt templates before Apex. Tests mock Einstein, `ConnectApi`, and Data 360.

**Stop if:** A test class creates a live `AiJobRun` or calls a prompt template that is not yet in the target org.

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
| Apex returns no rows at API `67.0` | User mode / `with sharing` default. Grant the running user object, field, and record access. See [Troubleshooting](03-troubleshooting.md) |
| Preview before data-access assign | Employee: assign `EMPLOYEE_DATA_ACCESS_PERMISSION_SET_API_NAME` first. Not a coordinator phase |

If retrieve, deploy, preview, publish, Data 360, or web messaging fails, use [Troubleshooting](03-troubleshooting.md).

## Operator cheat sheet

| Need | Do this |
|---|---|
| See the path | Start at [docs/index.md](index.md) |
| Starting template | Copy [`templates/deploy.mjs`](../templates/deploy.mjs) next to the retrieved DX project and fill env/placeholders |
| Hand-run one agent package | Use [Service Agent](10-service-agent.md) or [Employee Agent](11-employee-agent.md), not this page |
| CLI verbs only | [Package CLI Reference](deployment-workflow.md) |
| Production preflight | `--validate-only --target-org <PROD_ALIAS>` |
| Dress rehearsal | `--deploy --target-org <REHEARSAL_ALIAS>` on a fresh Developer sandbox, then type `DEPLOY` |
| Deploy production | `--deploy --target-org <PROD_ALIAS>`, then type `DEPLOY` |
| Resume | `--start-at <PHASE> --target-org <ALIAS>` |
| CI / no keyboard | `--non-interactive` fails at `DEPLOY` / `DONE`; do not skip |
| Data 360 | [Deploy a Data 360 DevOps Data Kit](20-data-360-data-kit.md), then type `DONE` after component deploy, reauth, and refresh |
| Service Agent user | See [Inventory](#inventory-what-is-not-a-normal-mdapi-deploy) for `access.default_agent_user` |
| Employee data access | Assign by hand before `agent-preview`. See [Employee Agent](11-employee-agent.md) |
| Employee access package | After publish, deploy `manifests/employee-agent-access-package.xml` |
| Web chat | [Migrate Enhanced Web Chat](21-enhanced-web-chat.md) after the Service Agent is active |
| Failure | [Troubleshooting](03-troubleshooting.md). Do not publish after a failed validate |

## Checklist

- [ ] Path confirmed (Service, Employee, and/or Lead Nurture). Guides 10/11/12 followed for package contents.
- [ ] `templates/deploy.mjs` copied next to the DX project. Env filled. ALL_CAPS placeholders replaced.
- [ ] `--deploy` rehearsed on a fresh Developer sandbox (`RunLocalTests`) before production. `--validate-only` is not rehearsal.
- [ ] Data 360 kit + `DONE` completed before agent deploy, if used.
- [ ] Prompt templates published/active before the `apex` phase, if split.
- [ ] Service Agent: `access.default_agent_user` is the target-org username. Custom access permset assigned to the agent user before preview.
- [ ] Employee Agent: data-access permset assigned before preview. `agentAccesses` package deploys only after publish.
- [ ] Lead Nurture: dependencies only. Configure the agent in Builder. Do not publish a packaged agent.
- [ ] Production uses `validate` then `quick --job-id`. Never `--ignore-errors`.
- [ ] Go-live proof saved for this target org. See [Capture go-live proof](deployment-workflow.md#5-capture-go-live-proof).
- [ ] If a step fails, use [Troubleshooting](03-troubleshooting.md).

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
