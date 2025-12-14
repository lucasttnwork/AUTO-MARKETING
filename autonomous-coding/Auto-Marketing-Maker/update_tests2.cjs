const fs = require('fs');

// Read the feature list
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Tests to mark as passing based on verification
const testsToPass = [
  'AI Provider Factory initializes with API keys from environment variables',
  'OpenRouter provider generates non-streaming completions correctly'
];

let updated = 0;
data.forEach(test => {
  if (testsToPass.includes(test.description) && !test.passes) {
    test.passes = true;
    updated++;
    console.log('Updated: ' + test.description);
  }
});

// Write back
fs.writeFileSync('feature_list.json', JSON.stringify(data, null, 2));
console.log('\nUpdated ' + updated + ' tests');

// Count tests
const passing = data.filter(t => t.passes).length;
const failing = data.filter(t => !t.passes).length;
console.log('\nTotal: ' + data.length + ' tests');
console.log('Passing: ' + passing);
console.log('Failing: ' + failing);
