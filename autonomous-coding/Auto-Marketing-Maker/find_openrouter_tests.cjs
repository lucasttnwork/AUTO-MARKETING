const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json'));

// Find OpenRouter related tests
const openRouterTests = data.filter(t =>
  t.description.toLowerCase().includes('openrouter') ||
  t.description.toLowerCase().includes('ai provider')
);

console.log('=== OpenRouter/AI Provider Related Tests ===\n');
openRouterTests.forEach((t, i) => {
  console.log((i+1) + '. ' + t.description);
  console.log('   passes: ' + t.passes);
  console.log('');
});
