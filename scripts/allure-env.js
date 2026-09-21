const fs = require("fs");
const os = require("os");

const dir = "allure-results";
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const env = [
  `Browser=Chrome`,
  `OS=${os.type()} ${os.release()}`,
  `Node=${process.version}`,
  `Date=${new Date().toISOString()}`,
  `Tester=${process.env.USER || process.env.USERNAME || "QA"}`,
].join("\n");

fs.writeFileSync(`${dir}/environment.properties`, env);
