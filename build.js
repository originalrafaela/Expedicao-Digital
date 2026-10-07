const fs = require("node:fs");
const path = require("node:path");
const { publicFiles } = require("./server");

for (const file of publicFiles) {
  // Keep only the optimized hero and assets referenced by the site.
  if (file.startsWith("assets/") && file !== "assets/hero-expedicao.jpg") continue;
  const destination = path.join(__dirname, "dist", file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(__dirname, file), destination);
}
console.log("Arquivos públicos preparados em dist/ para hospedagem estática.");
