const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json'));
let c = 0;
data.forEach((t, i) => {
  if (!t.passes && c < 10) {
    console.log('Index ' + i + ': ' + t.description);
    console.log('Steps: ' + JSON.stringify(t.steps));
    console.log('---');
    c++;
  }
});
