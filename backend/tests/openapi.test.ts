import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import SwaggerParser from "@apidevtools/swagger-parser";

test("OpenAPI document validates with all referenced schemas and paths", async () => {
  const path = fileURLToPath(new URL("../openapi.yaml", import.meta.url));
  const api = await SwaggerParser.validate(path);
  assert.ok("openapi" in api && api.openapi === "3.0.3");
});
