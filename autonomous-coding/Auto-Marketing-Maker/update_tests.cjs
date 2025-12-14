const fs = require('fs');

// Read the feature list
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Tests to mark as passing
const testsToPass = [
  'OpenRouter provider generates streaming completions with SSE',
  'OpenRouter model generates content in Agents Hub'
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
