const fs = require('fs');
let content = fs.readFileSync('src/pages/PublicBilling.tsx', 'utf8');

content = content.replace(
  "setError(err.response?.data?.message || 'Failed to load Billing Portal')",
  "setError(err.response?.data?.message || err.message || 'Failed to load Billing Portal')"
);

fs.writeFileSync('src/pages/PublicBilling.tsx', content);
