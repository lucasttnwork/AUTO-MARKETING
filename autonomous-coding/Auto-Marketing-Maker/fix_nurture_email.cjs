const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server', 'index.js');
let content = fs.readFileSync(serverPath, 'utf8');

// Find the nurture template section and add Email 5
const email4End = `**[🚀 Start Your Free Trial]**\`,

    'launch':`;

const email5Addition = `**[🚀 Start Your Free Trial]**

---

## Email 5: Consultation Offer (Day 14)
**Subject:** Your free strategy session is waiting...

[First Name],

You've been with us for two weeks now, and we've seen your engagement.

It's clear you're serious about [achieving goal].

That's why we'd like to offer you something special:

**📞 A FREE 30-minute Strategy Session**

On this call, you'll get:
- A personalized action plan for your specific situation
- Expert insights from our team
- Answers to all your questions

No strings attached. Just pure value.

**[📅 Book Your Free Session Now]**

Only 10 spots available this month. Don't wait!

Best,
The \${clientName} Team\`,

    'launch':`;

if (content.includes(email4End)) {
  content = content.replace(email4End, email5Addition);
  fs.writeFileSync(serverPath, content);
  console.log('Successfully added Email 5 to nurture sequence template');
} else {
  console.log('Could not find the exact text to replace');
  // Try an alternative approach
  const altSearch = "**[🚀 Start Your Free Trial]**`,";
  if (content.includes(altSearch)) {
    console.log('Found alternative pattern, trying replacement...');
  }
}
