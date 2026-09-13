const fs = require('fs');
let tables = fs.readFileSync('src/pages/Tables.tsx', 'utf8');

// Replace standard Tables title with Table QR Ordering title
let tableQr = tables.replace('<h1>Tables</h1>', '<h1>Table QR Ordering</h1>');
tableQr = tableQr.replace(/<p className="text-gray-500">Manage your restaurant floor plan.*<\/p>/, '<p className="text-gray-500">Manage digital QR menus for your tables.</p>');

fs.writeFileSync('src/pages/TableQr.tsx', tableQr);
