/**
 * Repo CI for agfDeploymentDocs.
 *
 * Same three checks the repo has always run. No Salesforce org. No deploy.
 * Hosts call `dagger call ci --source .` (Buildkite today, Cloud Build in GCP).
 */
import { argument, dag, Directory, func, object } from "@dagger.io/dagger"

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
   * Unit-test the staged deploy coordinator.
   */
  @func()
  async unit(): Promise<string> {
    return this.workspace()
      .withExec(["node", "--test", "tests/deploy.test.mjs"])
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
}
