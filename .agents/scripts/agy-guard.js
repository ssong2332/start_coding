const path = require("node:path");

const root = path.resolve(__dirname, "../..");
process.chdir(root);
require(path.join(root, "scripts/agy-guard.js"));
