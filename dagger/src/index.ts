/**
 * Repo CI for agfDeploymentDocs.
 *
 * Same three checks the repo has always run. No Salesforce org. No deploy.
 * Hosts call `dagger call ci --source .` (Buildkite today, Cloud Build in GCP).
 */
import { argument, dag, Directory, func, object } from "@dagger.io/dagger"

// Source is a per-function argument so every host runs the documented command
// `dagger call <fn> --source .`. defaultPath keeps a bare `dagger call ci`
// working from the repo root; ignore trims build noise from the uploaded tree.
const SOURCE = {
  defaultPath: "/",
  ignore: [".git", "dagger/sdk", "dagger/node_modules"],
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
   * Unit-test the staged deploy coordinator.
   */
  @func()
  async unit(@argument(SOURCE) source: Directory): Promise<string> {
    return this.workspace(source)
      .withExec(["node", "--test", "tests/deploy.test.mjs"])
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
}
