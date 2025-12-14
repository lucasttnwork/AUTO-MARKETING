const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
data.forEach((test, idx) => {
  if (!test.passes) {
    console.log(`Test #${idx}: ${test.description}`);
    console.log(`  Category: ${test.category}`);
    console.log('');
  }
});
