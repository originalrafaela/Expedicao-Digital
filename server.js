const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 4173;
const root = __dirname;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

const publicFiles = new Set([
  "index.html", "404.html", "styles.css", "script.js", "course.js", "courses-data.js", "favicon.svg",
  ...fs.readdirSync(path.join(root, "cursos")).filter((file) => file.endsWith(".html")).map((file) => `cursos/${file}`),
  ...fs.readdirSync(path.join(root, "assets")).filter((file) => /\.(png|jpe?g|webp|svg)$/.test(file)).map((file) => `assets/${file}`)
]);

function createServer() {
  return http.createServer((request, response) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    response.setHeader("X-Frame-Options", "SAMEORIGIN");
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end("Method not allowed");
      return;
    }
    let requestedPath;
    try {
      requestedPath = decodeURIComponent(request.url.split("?")[0]);
      if (/[\0\\]/.test(requestedPath)) throw new Error("Invalid path");
    } catch {
      response.writeHead(400);
      response.end("Bad request");
      return;
    }
    const safePath = requestedPath === "/" ? "/index.html" : requestedPath;
    const relativePath = safePath.replace(/^\//, "");
    const isPublic = publicFiles.has(relativePath);
    const filePath = path.join(root, isPublic ? relativePath : "404.html");

    fs.readFile(filePath, (error, content) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(isPublic ? 200 : 404, {
        "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
        "Cache-Control": "public, max-age=0, must-revalidate"
      });
      response.end(request.method === "HEAD" ? undefined : content);
    });
  });
}

if (require.main === module) {
  createServer().listen(port, () => {
    console.log(`Site rodando em http://localhost:${port}`);
  });
}

module.exports = { createServer, publicFiles };
