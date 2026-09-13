const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  'import Tables from \'./pages/Tables\'',
  'import Tables from \'./pages/Tables\'\nimport TableQr from \'./pages/TableQr\''
);

app = app.replace(
  '<Route path="/tables" element={<Tables />} />',
  '<Route path="/tables" element={<Tables />} />\n            <Route path="/table-qr" element={<TableQr />} />'
);

fs.writeFileSync('src/App.tsx', app);
