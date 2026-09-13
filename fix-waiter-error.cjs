const fs = require('fs');
let content = fs.readFileSync('src/pages/PublicWaiter.tsx', 'utf8');

content = content.replace(
  "setError(err.response?.data?.message || 'Failed to load Waiter Portal')",
  "setError(err.response?.data?.message || err.message || 'Failed to load Waiter Portal')"
);

fs.writeFileSync('src/pages/PublicWaiter.tsx', content);
