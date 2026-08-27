/**
 * Repo CI for agfDeploymentDocs.
 *
 * `ci` is docs/coordinator checks (no Salesforce org). `orgCi`/`orgCiJwt` are a
 * scratch-org smoke — create, dry-run, deploy, Apex tests, Playwright — not an
 * Agentforce dress rehearsal. Hosts call `dagger call ci --source .` always, then
 * one Dev Hub path when configured:
 *   `dagger call org-ci --source . --devhub-auth-url env://SF_DEVHUB_AUTH_URL`
 *   `dagger call org-ci-jwt --source . --jwt-key env://SF_JWT_KEY \
 *      --consumer-key <ck> --hub-username <user>`
 * JWT is the headless path for a Dev Hub that never mints a refresh token.
 */
import { argument, dag, Directory, func, object, Secret } from "@dagger.io/dagger"

// Source is a per-function argument so every host runs the documented command
// `dagger call <fn> --source .`. defaultPath keeps a bare `dagger call ci`
// working from the repo root; ignore trims build noise from the uploaded tree.
const SOURCE = {
  defaultPath: "/",
  ignore: [".git", "dagger/sdk", "dagger/node_modules", "ci/playwright/node_modules"],
}

@object()
export class Ci {
  private workspace(source: Directory) {
    return dag
      .container()
      .from("node:20-bookworm")
      .withDirectory("/src", source)
      .withWorkdir("/src")
  }

  /**
   * Syntax-check the staged deploy coordinator.
   */
  @func()
  async syntax(@argument(SOURCE) source: Directory): Promise<string> {
    const out = await this.workspace(source)
      .withExec(["node", "--check", "templates/deploy.mjs"])
      .stdout()
    return out.trim() ? out : "OK node --check templates/deploy.mjs"
  }

  /**
   * Unit-test the staged deploy coordinator and coverage helper.
   */
  @func()
  async unit(@argument(SOURCE) source: Directory): Promise<string> {
    return this.workspace(source)
      .withExec([
        "node",
        "--test",
        "tests/deploy.test.mjs",
        "tests/check-coverage.test.mjs",
      ])
      .stdout()
  }

  /**
   * Docs, nav, manifests, and CI-layout checks.
   */
  @func()
  async docs(@argument(SOURCE) source: Directory): Promise<string> {
    return this.workspace(source).withExec(["node", "scripts/ci-check.mjs"]).stdout()
  }

  /**
   * Run syntax, unit, and docs checks in parallel.
   */
  @func()
  async ci(@argument(SOURCE) source: Directory): Promise<string> {
    const [syntax, unit, docs] = await Promise.all([
      this.syntax(source),
      this.unit(source),
      this.docs(source),
    ])
    return ["=== syntax ===", syntax, "=== unit ===", unit, "=== docs ===", docs].join(
      "\n",
    )
  }

  /**
   * Scratch-org smoke: create, dry-run, deploy, Apex tests, Playwright.
   * Requires a Dev Hub sfdx auth URL. Not Agentforce/Data 360 dress rehearsal.
   */
  @func()
  async orgCi(
    devhubAuthUrl: Secret,
    @argument(SOURCE) source: Directory,
  ): Promise<string> {
    return this.orgWorkspace(source)
      .withSecretVariable("SF_DEVHUB_AUTH_URL", devhubAuthUrl)
      .withExec(["bash", "ci/sf/org-ci.sh"])
      .stdout()
  }

  /**
   * Same scratch-org smoke, authed to the Dev Hub with JWT bearer flow.
   * `jwtKey` is the RSA private key matching the connected app's cert.
   * `consumerKey` and `hubUsername` are not secret; the private key is.
   */
  @func()
  async orgCiJwt(
    jwtKey: Secret,
    consumerKey: string,
    hubUsername: string,
    @argument(SOURCE) source: Directory,
    hubInstanceUrl = "https://login.salesforce.com",
  ): Promise<string> {
    return this.orgWorkspace(source)
      .withSecretVariable("SF_JWT_KEY", jwtKey)
      .withEnvVariable("SF_CONSUMER_KEY", consumerKey)
      .withEnvVariable("SF_HUB_USERNAME", hubUsername)
      .withEnvVariable("SF_HUB_INSTANCE_URL", hubInstanceUrl)
      .withExec(["bash", "ci/sf/org-ci.sh"])
      .stdout()
  }

  private orgWorkspace(source: Directory) {
    return dag
      .container()
      .from("mcr.microsoft.com/playwright:v1.55.0-jammy")
      .withExec(["npm", "install", "-g", "@salesforce/cli"])
      .withDirectory("/src", source)
      .withWorkdir("/src")
      .withExec(["npm", "ci", "--prefix", "ci/playwright"])
  }
}
