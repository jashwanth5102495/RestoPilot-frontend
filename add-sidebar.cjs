const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

const importItem = `import { QrCode } from 'lucide-react'`;
content = content.replace(
  'Lock\n} from \'lucide-react\'',
  'Lock,\n  QrCode\n} from \'lucide-react\''
);

const newNavItem = `  { name: 'Table QR', to: '/table-qr', icon: QrCode, featureKey: 'isTableQrEnabled' },`;
content = content.replace(
  '{ name: \'Tables\', to: \'/tables\', icon: LayoutTemplate, featureKey: \'isTablesEnabled\' },',
  `{ name: 'Tables', to: '/tables', icon: LayoutTemplate, featureKey: 'isTablesEnabled' },\n${newNavItem}`
);

fs.writeFileSync('src/components/layout/Sidebar.tsx', content);
