const fs = require("fs");
let content = fs.readFileSync("src/pages/TableQr.tsx", "utf8");

// 1. Fix getTableQrUrl fallback
content = content.replace(
  `const getTableQrUrl = (tableId: string) =>\n    tableQrSlug ? \`\${baseUrl}/table/\${tableQrSlug}/\${tableId}\` : ""`,
  `const getTableQrUrl = (tableId: string) => {\n    const slug = tableQrSlug || "restaurant"\n    return \`\${baseUrl}/table/\${slug}/\${tableId}\` \n  }`
);

// 2. Fix fetchSettings fallback
content = content.replace(
  `        setIsTableQrEnabled(restaurant.isTableQrEnabled || false)\n        setTableQrSlug(restaurant.tableQrSlug || "")`,
  `        setIsTableQrEnabled(restaurant.isTableQrEnabled || false)\n        const slug = restaurant.tableQrSlug || restaurant.waiterSlug || restaurant.billingSlug || restaurant.onlineSlug || restaurant._id || ""\n        setTableQrSlug(slug)`
);

// 3. Fix handleQrToggle fallback
content = content.replace(
  `      setIsTableQrEnabled(res.data.data.isTableQrEnabled)\n      setTableQrSlug(res.data.data.tableQrSlug || "")`,
  `      setIsTableQrEnabled(res.data.data.isTableQrEnabled)\n      const slug = res.data.data.tableQrSlug || tableQrSlug || res.data.data.waiterSlug || res.data.data.billingSlug || res.data.data._id || ""\n      setTableQrSlug(slug)`
);

// 4. Fix JSX condition: replace `{isTableQrEnabled && tableQrSlug ? (` with `{isTableQrEnabled ? (`
content = content.replace(
  `{/* QR Grid */}\n      {isTableQrEnabled && tableQrSlug ? (`,
  `{/* QR Grid */}\n      {isTableQrEnabled ? (`
);

fs.writeFileSync("src/pages/TableQr.tsx", content);
console.log("TableQr fixed successfully!");
