const fs = require('fs');
let content = fs.readFileSync('src/pages/Menu.tsx', 'utf8');

// Add useRef import if not exists
if (!content.includes('useRef')) {
  content = content.replace('useState, useEffect', 'useState, useEffect, useRef');
}

// Add a ref to prevent double submission
content = content.replace(
  'const [submitting, setSubmitting] = useState(false)',
  'const [submitting, setSubmitting] = useState(false)\n  const isSubmittingRef = useRef(false)'
);

// Prevent double execution in handleSaveDish
content = content.replace(
  'const handleSaveDish = async () => {\n    if (!dishName || !selectedCategoryId || !price) {',
  'const handleSaveDish = async () => {\n    if (isSubmittingRef.current) return;\n    if (!dishName || !selectedCategoryId || !price) {'
);

content = content.replace(
  'setSubmitting(true)\n    try {',
  'isSubmittingRef.current = true;\n    setSubmitting(true)\n    try {'
);

content = content.replace(
  '} finally {\n      setSubmitting(false)\n    }',
  '} finally {\n      setSubmitting(false)\n      isSubmittingRef.current = false;\n    }'
);

fs.writeFileSync('src/pages/Menu.tsx', content);
