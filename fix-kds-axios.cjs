const fs = require("fs");
let content = fs.readFileSync("src/pages/PublicKds.tsx", "utf8");

const oldImports = `import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';`;

const newImports = `import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    return \`\${protocol}//\${host}:5000/api/v1\`;
  }
  return 'http://localhost:5000/api/v1';
};

const API_URL = getApiBaseUrl();`;

content = content.replace(oldImports, newImports);
content = content.replace(`await api.get(\`/public/kds/\${slug}/orders\`)`, `await axios.get(\`\${API_URL}/public/kds/\${slug}/orders\`)`);
content = content.replace(`await api.patch(\`/public/kds/\${slug}/orders/\${orderId}/status\``, `await axios.patch(\`\${API_URL}/public/kds/\${slug}/orders/\${orderId}/status\``);

fs.writeFileSync("src/pages/PublicKds.tsx", content);
console.log("PublicKds.tsx updated with raw axios & API_URL fallback!");
