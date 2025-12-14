const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const failing = data.filter(t => t.passes === false);
console.log('=== FAILING TESTS (' + failing.length + ' total) ===\n');
failing.forEach((t, i) => {
  console.log((i+1) + '. ' + t.description);
  console.log('   Category: ' + t.category);
  console.log('');
});
