import fs from "node:fs"
import path from "node:path"
import { parse } from "yaml"

export const PNPM_LOCK_FILENAME = "pnpm-lock.yaml"

type DependencyEntry = {
  specifier?: string
  version?: string
}

export type ImporterSnapshot = {
  dependencies?: Record<string, DependencyEntry>
  devDependencies?: Record<string, DependencyEntry>
  optionalDependencies?: Record<string, DependencyEntry>
}

type ParsedLockfileContents = {
  importers: Record<string, ImporterSnapshot>
}

export type ParsedLockfile = {
  path: string
  dir: string
  importers: Record<string, ImporterSnapshot>
}

export class LockfileNotFoundError extends Error {
  constructor(startDir: string) {
    super(`pnpm-lock.yaml was not found from: ${startDir}`)
  }
}

export class DependencyResolutionError extends Error {}

const stripPeerSuffix = (version: string) => version.split("(")[0]

const isLinkLike = (version: string) =>
  version.startsWith("link:") || version.startsWith("workspace:")

const normalizeImporterKey = (key: string) => (key === "." ? "." : key)

export const findLockfile = (startDir = process.cwd()): string => {
  let current = path.resolve(startDir)

  while (true) {
    const candidate = path.join(current, PNPM_LOCK_FILENAME)
    if (fs.existsSync(candidate)) {
      return candidate
    }

    const parent = path.dirname(current)
    if (parent === current) {
      throw new LockfileNotFoundError(startDir)
    }
    current = parent
  }
}

export const loadLockfile = (startDir = process.cwd()): ParsedLockfile => {
  const lockfilePath = findLockfile(startDir)
  const raw = fs.readFileSync(lockfilePath, "utf8")
  const parsed = parse(raw) as ParsedLockfileContents | undefined

  if (!parsed || typeof parsed !== "object" || !parsed.importers) {
    throw new DependencyResolutionError("Invalid pnpm-lock.yaml format")
  }

  return {
    path: lockfilePath,
    dir: path.dirname(lockfilePath),
    importers: parsed.importers,
  }
}

export const selectImporter = (
  lockfile: ParsedLockfile,
  startDir = process.cwd(),
  preferredImporter?: string,
): string => {
  if (preferredImporter && lockfile.importers[preferredImporter]) {
    return preferredImporter
  }

  const start = path.resolve(startDir)
  const candidates = Object.keys(lockfile.importers).map((key) => {
    const normalized = normalizeImporterKey(key)
    const absolute = path.resolve(
      lockfile.dir,
      normalized === "." ? "" : normalized,
    )
    return { key: normalized, absolute }
  })

  const matched = candidates
    .filter(({ absolute }) => start.startsWith(absolute))
    .sort((a, b) => b.absolute.length - a.absolute.length)[0]

  if (matched) {
    return matched.key
  }

  if (lockfile.importers["."]) {
    return "."
  }

  throw new DependencyResolutionError(
    `No importer in pnpm-lock.yaml matches start directory: ${startDir}`,
  )
}

const readLinkedPackageVersion = (
  version: string,
  lockfileDir: string,
  importerKey: string,
): string => {
  const relativePath = version.replace(/^link:/, "").replace(/^workspace:/, "")
  const importerDir = path.resolve(
    lockfileDir,
    importerKey === "." ? "" : importerKey,
  )
  const packageJsonPath = path.resolve(
    importerDir,
    relativePath,
    "package.json",
  )

  if (!fs.existsSync(packageJsonPath)) {
    throw new DependencyResolutionError(
      `Linked workspace package.json not found: ${packageJsonPath}`,
    )
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    version?: string
  }

  if (!pkg.version) {
    throw new DependencyResolutionError(
      `Linked workspace package has no version field: ${packageJsonPath}`,
    )
  }

  return pkg.version
}

const readSnapshotValue = (
  snapshot: ImporterSnapshot,
  dependencyName: string,
) => {
  const sources = [
    snapshot.dependencies,
    snapshot.optionalDependencies,
    snapshot.devDependencies,
  ]

  for (const source of sources) {
    const entry = source?.[dependencyName]
    if (entry) {
      return entry.version ?? entry.specifier
    }
  }

  return undefined
}

export const resolveDependencyVersions = (options: {
  lockfile: ParsedLockfile
  importer: string
  dependencyNames: string[]
  overrides?: Record<string, string>
}) => {
  const { lockfile, importer, dependencyNames } = options
  const overrides = options.overrides ?? {}

  const snapshot = lockfile.importers[importer]
  if (!snapshot) {
    throw new DependencyResolutionError(`Importer not found: ${importer}`)
  }

  const results: Record<string, string> = {}
  const uniqueNames = Array.from(new Set(dependencyNames))

  for (const name of uniqueNames) {
    if (overrides[name]) {
      results[name] = overrides[name]
      continue
    }

    const rawVersion = readSnapshotValue(snapshot, name)
    if (!rawVersion) {
      throw new DependencyResolutionError(
        `Dependency "${name}" not found in importer "${importer}"`,
      )
    }

    const resolved = isLinkLike(rawVersion)
      ? readLinkedPackageVersion(rawVersion, lockfile.dir, importer)
      : stripPeerSuffix(rawVersion)

    results[name] = resolved
  }

  return results
}
