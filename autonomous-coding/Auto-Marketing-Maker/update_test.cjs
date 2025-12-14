const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const idx = data.findIndex(f => f.description === 'Competitor SWOT analysis generates for each competitor');
if (idx !== -1) {
  data[idx].passes = true;
  fs.writeFileSync('feature_list.json', JSON.stringify(data, null, 2));
  console.log('Updated test at index', idx);
} else {
  console.log('Test not found');
}
