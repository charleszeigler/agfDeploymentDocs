/**
 * Repo CI for agfDeploymentDocs.
 *
 * `ci` is docs/coordinator checks. `orgCi` is scratch-org smoke (not Agentforce
 * dress rehearsal). Hosts call `dagger call ci --source .` always, and
 * `dagger call org-ci --source . --devhub-auth-url env://SF_DEVHUB_AUTH_URL`
 * when a Dev Hub auth URL is configured.
 */
import { argument, dag, Directory, func, object, Secret } from "@dagger.io/dagger"

@object()
export class Ci {
  source: Directory

  constructor(
    @argument({
      defaultPath: "/",
      ignore: [".git", "dagger/sdk", "dagger/node_modules"],
    })
    source: Directory,
  ) {
    this.source = source
  }

  private workspace() {
    return dag
      .container()
      .from("node:20-bookworm")
      .withDirectory("/src", this.source)
      .withWorkdir("/src")
  }

  /**
   * Syntax-check the staged deploy coordinator.
   */
  @func()
  async syntax(): Promise<string> {
    const out = await this.workspace()
      .withExec(["node", "--check", "templates/deploy.mjs"])
      .stdout()
    return out.trim() ? out : "OK node --check templates/deploy.mjs"
  }

  /**
   * Unit-test the staged deploy coordinator and coverage helper.
   */
  @func()
  async unit(): Promise<string> {
    return this.workspace()
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
  async docs(): Promise<string> {
    return this.workspace().withExec(["node", "scripts/ci-check.mjs"]).stdout()
  }

  /**
   * Run syntax, unit, and docs checks in parallel.
   */
  @func()
  async ci(): Promise<string> {
    const [syntax, unit, docs] = await Promise.all([
      this.syntax(),
      this.unit(),
      this.docs(),
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
  async orgCi(devhubAuthUrl: Secret): Promise<string> {
    return this.orgWorkspace()
      .withSecretVariable("SF_DEVHUB_AUTH_URL", devhubAuthUrl)
      .withExec(["bash", "ci/sf/org-ci.sh"])
      .stdout()
  }

  private orgWorkspace() {
    return dag
      .container()
      .from("mcr.microsoft.com/playwright:v1.55.0-jammy")
      .withExec(["npm", "install", "-g", "@salesforce/cli"])
      .withDirectory("/src", this.source, {
        exclude: [".git", "dagger/sdk", "dagger/node_modules", "ci/playwright/node_modules"],
      })
      .withWorkdir("/src")
      .withExec(["npm", "ci", "--prefix", "ci/playwright"])
  }
}
