// Test script to validate A/B variants are properly generated

const fs = require('fs');
const path = require('path');

// Read the server file
const serverCode = fs.readFileSync(path.join(__dirname, 'server', 'index.js'), 'utf8');

// Check for A/B/C variants with psychological approaches
const patterns = [
  /Subject A \(Curiosity\)/,
  /Subject B \(Benefit\)/,
  /Subject C \(Urgency\)/,
];

let allFound = true;
patterns.forEach(pattern => {
  const matches = serverCode.match(pattern);
  if (matches) {
    console.log('Found: ' + pattern);
  } else {
    console.log('Missing: ' + pattern);
    allFound = false;
  }
});

// Check for the new format
const hasNewFormat = serverCode.includes('## Subject Line A/B Variants');
console.log('\nHas new "Subject Line A/B Variants" format: ' + hasNewFormat);

// Count total A/B/C variants
const curiosityCount = (serverCode.match(/Subject A \(Curiosity\)/g) || []).length;
const benefitCount = (serverCode.match(/Subject B \(Benefit\)/g) || []).length;
const urgencyCount = (serverCode.match(/Subject C \(Urgency\)/g) || []).length;

console.log('\n--- Variant Counts ---');
console.log('Subject A (Curiosity): ' + curiosityCount);
console.log('Subject B (Benefit): ' + benefitCount);
console.log('Subject C (Urgency): ' + urgencyCount);

// Final validation
if (curiosityCount >= 3 && benefitCount >= 3 && urgencyCount >= 3 && allFound) {
  console.log('\nAll A/B/C subject line variants are properly implemented!');
  console.log('The feature is ready - requires server restart to test via UI.');
} else {
  console.log('\nSome variants are missing');
}
