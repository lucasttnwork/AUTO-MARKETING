const fs = require('fs');

const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

data.forEach(test => {
  if (test.description === 'Swipe gestures work for navigation on mobile' && !test.passes) {
    test.passes = true;
    console.log('Marked as passing:', test.description);
  }
});

fs.writeFileSync('feature_list.json', JSON.stringify(data, null, 2));
console.log('Done');
