const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const { createServer } = require("../server");

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function main() {
  const executable = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "expedicao-browser-"));
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const chrome = spawn(executable, ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-background-timer-throttling", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
  let socket;
  try {
    const portFile = path.join(profile, "DevToolsActivePort");
    for (let i = 0; !fs.existsSync(portFile) && i < 100; i++) await pause(100);
    const port = fs.readFileSync(portFile, "utf8").split("\n")[0];
    const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    socket = new WebSocket(targets.find((target) => target.type === "page").webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener("open", resolve); socket.addEventListener("error", reject); });
    let nextId = 0;
    const pending = new Map(), errors = [];
    socket.addEventListener("close", () => {
      for (const { reject } of pending.values()) reject(new Error("Browser connection closed"));
      pending.clear();
    });
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
      if (pending.has(message.id)) {
        const { resolve, reject } = pending.get(message.id);
        pending.delete(message.id);
        message.error ? reject(new Error(message.error.message)) : resolve(message.result);
      }
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Browser timeout: ${method}`)); }, 10000);
      pending.set(id, { resolve: result => {clearTimeout(timeout); resolve(result);}, reject: error => {clearTimeout(timeout); reject(error);} });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression) => {
      const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    const navigate = async (url, selector) => {
      await send("Page.navigate", { url });
      for (let i = 0; i < 100; i++) {
        if (await evaluate(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete' && !!document.querySelector(${JSON.stringify(selector)})`)) return;
        await pause(50);
      }
      throw new Error(`Page did not load: ${url}`);
    };
    await send("Runtime.enable");
    await send("Page.enable");
    let checkedTopics = 0;
    for (const width of [1366, 390]) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
      await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
      await navigate(base + "/", ".course-card");
      assert.equal(await evaluate("document.querySelectorAll('.course-card').length === courses.filter(course => course.category === 'computador').length"), true);
      await evaluate("document.querySelector('[data-course-filter=celular]').click()");
      assert.equal(await evaluate("document.querySelectorAll('.course-card').length === courses.filter(course => course.category === 'celular').length"), true);
      const slugs = await evaluate("courses.map(course => course.slug)");
      for (const slug of slugs) {
        await navigate(`${base}/cursos/${slug}.html`, ".topic-toggle");
        const count = await evaluate("document.querySelectorAll('[data-topic-link]').length");
        assert.equal(await evaluate("document.querySelectorAll('h1').length"), 1);
        assert.equal(await evaluate("document.querySelectorAll('.topic-illustration').length"), count);
        assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true, `${slug}: horizontal overflow`);
        for (let index = 0; index < count; index++) {
          await evaluate(`document.querySelectorAll('[data-topic-link]')[${index}].click()`);
          await evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
          const result = await evaluate(`(() => {
            const content = document.querySelector('.basic-template-content');
            const title = document.querySelector('.basic-topic.open .topic-toggle');
            const ownScroll = ['auto','scroll'].includes(getComputedStyle(content).overflowY);
            const expected = ownScroll ? content.getBoundingClientRect().top + content.clientTop + 12 : document.querySelector('.site-header').offsetHeight + 12;
            return {error: Math.abs(title.getBoundingClientRect().top - expected), open: document.querySelectorAll('.basic-topic.open').length, images: [...document.querySelectorAll('.basic-topic.open img')].every(image => image.complete && image.naturalWidth > 0)};
          })()`);
          assert.equal(result.open, 1);
          assert.equal(result.images, true);
          assert.ok(result.error < 3, `${width}px ${slug} topic ${index}: alignment error ${result.error}`);
          checkedTopics++;
        }
      }
      console.log(`OK: ${width}px, 20 courses, all topic titles and illustrations.`);
      await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
      await navigate(`${base}/cursos/basico.html`, ".topic-toggle");
      await evaluate("document.querySelectorAll('[data-topic-link]')[4].click(); document.querySelectorAll('[data-topic-link]')[1].click()");
      await pause(900);
      const aligned = await evaluate(`(() => {
        const content = document.querySelector('.basic-template-content'), title = document.querySelector('.basic-topic.open .topic-toggle');
        const expected = innerWidth > 920 ? content.getBoundingClientRect().top + 12 : document.querySelector('.site-header').offsetHeight + 12;
        return Math.abs(title.getBoundingClientRect().top - expected) < 3;
      })()`);
      assert.ok(aligned, `${width}px: rapid clicks with smooth scrolling`);
      await send("Page.captureScreenshot", { format: "png" }).then((result) => fs.writeFileSync(path.join(os.tmpdir(), `expedicao-${width}.png`), Buffer.from(result.data, "base64")));
    }
    assert.deepEqual(errors, []);
    console.log(`OK: ${checkedTopics} topic navigations, smooth rapid clicks, no JavaScript exceptions.`);
  } finally {
    socket?.close();
    chrome.kill();
    await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
