import * as CLI from "@md/cli";
import { exists } from "@std/fs";
import "@std/dotenv";

const versionFormat = "`${number}.${number}.${number}`";
const versionRegex = /^\d+\.\d+\.\d+$/;

const readJson = (path: string) => Deno.readTextFile(path).then(JSON.parse);

const writeJson = (path: string, json: Record<string, string>) =>
  Deno.writeTextFile(path, JSON.stringify(json, null, 2));

const upsertJson = async (path: string, json: Record<string, string>) => {
  const read = await readJson(path);
  await writeJson(path, Object.assign(read, json));
};

const getMasterJson = async (
  path: string
): Promise<{ version: string; name: string }> => {
  const denoPath = path + "/deno.json";
  const json = await readJson(denoPath);
  if (!json.version) json.version = "0.0.0";
  if (!versionRegex.test(json.version))
    throw new Error(
      `Invalid deno.json | {"version": "${json.version}"} doesn't match format ${versionFormat}`
    );

  const nameFormat = "`@${string}/root`";
  const nameRegex = /^@[a-z0-9-]+\/root$/;

  if (!json.name)
    throw new Error(`Invalid deno.json | Missing {"name": ${nameFormat}}`);
  if (!nameRegex.test(json.name))
    throw new Error(
      `Invalid deno.json | {"name": "${json.name}"} doesn't match regex ${nameRegex}`
    );
  json.name = json.name.substring(0, json.name.indexOf("/"));
  return json;
};

const listRepos = async (dirpath: string) => {
  const children = await Array.fromAsync(Deno.readDir(dirpath + "/"));
  const folders = children.filter((child) => child.isDirectory);
  const repoFoldersPromises = folders.map(async ({ name }) => {
    const path = `${dirpath}/${name}`;
    if (await exists(path + "/deno.json")) return [{ path, name }];
    else return [];
  });
  return (await Promise.all(repoFoldersPromises)).flat();
};

export const cli: CLI.CLI = CLI.create("Manage a small-scale poly-repo sync", {
  version: CLI.command({
    description: "Updates the version across the poly-repo",
    arguments: [["versioning"]],
    flags: {
      path: {
        description: "The path to run the command in",
        type: "value",
      },
    },
  }).runner(async ([versioning], { path }) => {
    path = path ?? ".";
    const { version } = await getMasterJson(path);

    const newVersion = (() => {
      const versionDeltas = ["major", "minor", "patch"];

      if (versionRegex.test(versioning)) return versioning;

      if (!versionDeltas.includes(versioning)) {
        const validVersions =
          versionDeltas.map((v) => `"${v}"`).join() + ", " + versionFormat;
        throw new Error(
          `Invalid version (${versioning}) specified. Not any of ${validVersions}`
        );
      }

      const versionParts = version.split(".").map(Number);
      const delta = versionDeltas.indexOf(versioning);
      versionParts[delta] += 1;
      return versionParts.join(".");
    })();

    const mainPromise = upsertJson(path + "/deno.json", {
      version: newVersion,
    });
    const repos = await listRepos(path);

    await Promise.all(
      repos.map(({ path }) =>
        upsertJson(path + "/deno.json", { version: newVersion })
      )
    );
    await mainPromise;
  }),
});

if (import.meta.main) cli.run();
