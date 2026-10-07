const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { createServer, publicFiles } = require("../server");
let server, base;
before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));

test("all public files and courses respond successfully", async () => {
  for (const file of publicFiles) {
    const response = await fetch(`${base}/${file}`);
    assert.equal(response.status, 200, file);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    await response.arrayBuffer();
  }
});
test("invalid paths return 400 and keep the server running", async () => {
  for (const file of ["/%ZZ", "/%00", "/%5cserver.js"]) {
    assert.equal((await fetch(base + file)).status, 400);
  }
  assert.equal((await fetch(base)).status, 200);
});
test("private files, traversal and missing pages return the custom 404", async () => {
  for (const file of ["/server.js", "/package.json", "/build.js", "/README.md", "/.git/config", "/%2e%2e%2fserver.js", "/missing"]) {
    const response = await fetch(base + file);
    assert.equal(response.status, 404, file);
    assert.match(await response.text(), /Página não encontrada/);
  }
});
test("HEAD has no body and unsupported methods return 405", async () => {
  const response = await fetch(base, {method: "HEAD"});
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "");
  const post = await fetch(base, {method: "POST"});
  assert.equal(post.status, 405);
  assert.equal(post.headers.get("allow"), "GET, HEAD");
});
