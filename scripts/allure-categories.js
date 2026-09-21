const fs = require("fs");

const dir = "allure-results";
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const categories = [
  {
    name: "Server/Network Errors",
    matchedStatuses: ["broken"],
    messageRegex: ".*(?:ERR_|TIMEOUT|5\\d{2}).*",
  },
  {
    name: "Element Not Found",
    matchedStatuses: ["broken"],
    messageRegex: ".*(?:waiting for|locator|selector).*",
  },
  {
    name: "Assertion Failures",
    matchedStatuses: ["failed"],
    messageRegex: ".*(?:expect|assert|toBe|toHave|toEqual).*",
  },
];

fs.writeFileSync(
  `${dir}/categories.json`,
  JSON.stringify(categories, null, 2)
);
