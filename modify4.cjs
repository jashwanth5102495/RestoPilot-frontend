const fs = require('fs');
let content = fs.readFileSync('src/pages/Tables.tsx', 'utf8');

const tableQrBtn = `
                      <div className="flex gap-2">
                        {isTableQrEnabled && tableQrSlug && (
                          <Button variant="outline" size="sm" className="h-6 px-2 text-xs bg-white flex-1 flex gap-1" onClick={() => window.open(window.location.origin + '/table/' + tableQrSlug + '/' + table._id, '_blank')}>
                            <QrCode className="w-3 h-3"/> View QR
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs bg-white/50" onClick={() => {
                          setEditingTable(table._id)
                          setEditingTableName(table.name || \`Table \${table.tableNumber}\`)
                        }}>Edit</Button>
                      </div>
`;

content = content.replace(
  '<Button variant="ghost" size="sm" className="h-6 px-2 text-xs bg-white/50" onClick={() => {\n                          setEditingTable(table._id)\n                          setEditingTableName(table.name || `Table ${table.tableNumber}`)\n                        }}>Edit</Button>',
  tableQrBtn
);

fs.writeFileSync('src/pages/Tables.tsx', content);
