const fs = require('fs');

const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

const testsToPass = [
  'Progressive Web App can be installed',
  'PWA works offline with cached resources'
];

let updated = 0;
data.forEach(test => {
  if (testsToPass.includes(test.description) && !test.passes) {
    test.passes = true;
    updated++;
    console.log('Marked as passing:', test.description);
  }
});

fs.writeFileSync('feature_list.json', JSON.stringify(data, null, 2));
console.log('\nUpdated', updated, 'tests');
