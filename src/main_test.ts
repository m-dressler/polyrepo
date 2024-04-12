// import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { cli } from "./main.ts";

await cli.run(["version", "1.0.0", "--path=./example"]);

Deno.test(async function setVersion() {
  await cli.run(["version", "2.0.0", "--path=./example"]);
});

Deno.test(async function patchVersion() {
  await cli.run(["version", "patch", "--path=./example"]);
});

Deno.test(async function minorVersion() {
  await cli.run(["version", "minor", "--path=./example"]);
});

Deno.test(async function majorVersion() {
  await cli.run(["version", "major", "--path=./example"]);
});
