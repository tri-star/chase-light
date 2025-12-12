import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { describe, expect, it, afterEach } from "vitest"
import {
  PNPM_LOCK_FILENAME,
  loadLockfile,
  resolveDependencyVersions,
  selectImporter,
} from "../lib/pnpm/lockfile.js"

const tempDirs: string[] = []

const createTempDir = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lockfile-test-"))
  tempDirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

const writeLockfile = (dir: string, contents: string) => {
  fs.writeFileSync(path.join(dir, PNPM_LOCK_FILENAME), contents)
}

describe("lockfile dependency resolution", () => {
  it("resolves pinned versions and strips peer suffix", () => {
    const projectDir = createTempDir()
    writeLockfile(
      projectDir,
      `
importers:
  packages/backend:
    dependencies:
      pg:
        specifier: ^8.16.0
        version: 8.16.3
      drizzle-orm:
        specifier: ^0.44.2
        version: 0.44.5(@types/pg@8.15.5)(pg@8.16.3)
`,
    )

    const lockfile = loadLockfile(projectDir)
    const importer = selectImporter(
      lockfile,
      path.join(projectDir, "packages/backend"),
    )

    const result = resolveDependencyVersions({
      lockfile,
      importer,
      dependencyNames: ["pg", "drizzle-orm"],
    })

    expect(result).toEqual({
      pg: "8.16.3",
      "drizzle-orm": "0.44.5",
    })
  })

  it("resolves linked workspace versions via package.json", () => {
    const projectDir = createTempDir()
    const backendDir = path.join(projectDir, "packages/backend")
    const sharedDir = path.join(projectDir, "packages/shared")
    fs.mkdirSync(backendDir, { recursive: true })
    fs.mkdirSync(sharedDir, { recursive: true })

    writeLockfile(
      projectDir,
      `
importers:
  packages/backend:
    dependencies:
      shared:
        specifier: workspace:*
        version: link:../shared
      pg:
        specifier: ^8.16.0
        version: 8.16.3
  packages/shared:
    dependencies: {}
`,
    )

    fs.writeFileSync(
      path.join(sharedDir, "package.json"),
      JSON.stringify({ name: "shared", version: "1.2.3" }),
    )

    const lockfile = loadLockfile(projectDir)
    const importer = selectImporter(lockfile, backendDir)

    const result = resolveDependencyVersions({
      lockfile,
      importer,
      dependencyNames: ["shared", "pg"],
    })

    expect(result.shared).toBe("1.2.3")
    expect(result.pg).toBe("8.16.3")
  })

  it("throws when dependency is missing in importer", () => {
    const projectDir = createTempDir()
    writeLockfile(
      projectDir,
      `
importers:
  packages/backend:
    dependencies:
      pg:
        specifier: ^8.16.0
        version: 8.16.3
`,
    )

    const lockfile = loadLockfile(projectDir)
    const importer = selectImporter(
      lockfile,
      path.join(projectDir, "packages/backend"),
    )

    expect(() =>
      resolveDependencyVersions({
        lockfile,
        importer,
        dependencyNames: ["drizzle-orm"],
      }),
    ).toThrowError(/drizzle-orm/)
  })
})
