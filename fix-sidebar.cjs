const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

content = content.replace(
  /Lock\r?\n\} from 'lucide-react'/,
  "Lock,\n  QrCode\n} from 'lucide-react'"
);

fs.writeFileSync('src/components/layout/Sidebar.tsx', content);
