const fs = require('fs');

const serverPath = 'server/index.js';
let content = fs.readFileSync(serverPath, 'utf8');

// Find the closing of contentTypeTemplates (the }; after the last template)
const marker = `| Content Pieces | X | X + 20 | X + 50 |\`
  };`;

const smsTemplates = `| Content Pieces | X | X + 20 | X + 50 |\`,

    'sms-campaign': \`# SMS Campaign for \${clientName}

## Campaign Objective
\${brief.substring(0, 100)}...

---

## SMS MESSAGES (160 characters max)

### 📱 VARIATION 1: PROMOTIONAL
\\\`\\\`\\\`
\${clientName}: Flash Sale! 25% OFF everything today only. Use code FLASH25 at checkout. Shop: [link] Reply STOP to opt out
\\\`\\\`\\\`
**Character Count:** 118/160 ✓

---

### 📱 VARIATION 2: URGENCY
\\\`\\\`\\\`
⏰ \${clientName}: Last chance! Sale ends at midnight. Save 30% now: [link] Reply STOP to unsubscribe
\\\`\\\`\\\`
**Character Count:** 95/160 ✓

---

### 📱 VARIATION 3: CART REMINDER
\\\`\\\`\\\`
\${clientName}: Your cart is waiting! Complete your order and get free shipping: [link] Reply STOP to opt out
\\\`\\\`\\\`
**Character Count:** 103/160 ✓

---

### 📱 VARIATION 4: WELCOME
\\\`\\\`\\\`
Welcome to \${clientName}! 🎉 Get 15% off your first order with code HELLO15. Shop now: [link] Txt STOP to opt out
\\\`\\\`\\\`
**Character Count:** 115/160 ✓

---

### 📱 VARIATION 5: VIP OFFER
\\\`\\\`\\\`
\${clientName} VIP: Exclusive early access! New arrivals just dropped. Be first to shop: [link] Reply STOP to opt out
\\\`\\\`\\\`
**Character Count:** 113/160 ✓

---

## 📊 SMS COMPLIANCE CHECKLIST
✓ All messages under 160 characters
✓ Opt-out instruction included (Reply STOP)
✓ Brand name at start for recognition
✓ Clear CTA with link placeholder
✓ No misleading content

## 📝 NOTES
- Replace [link] with your shortened URL (bit.ly, etc.)
- Test messages on multiple devices before sending
- Schedule sends between 10am-8pm local time
- Maintain 24-48hr gap between promotional SMS\`,

    'sms-reminder': \`# SMS Reminders for \${clientName}

## Reminder Type
\${brief.substring(0, 100)}...

---

## REMINDER MESSAGES (160 characters max)

### 📅 APPOINTMENT REMINDER - 24 HOURS
\\\`\\\`\\\`
\${clientName}: Reminder! Your appointment is tomorrow at [TIME]. Reply C to confirm or R to reschedule. Questions? Call [phone]
\\\`\\\`\\\`
**Character Count:** 127/160 ✓

---

### 📅 APPOINTMENT REMINDER - 1 HOUR
\\\`\\\`\\\`
\${clientName}: See you in 1 hour! Your appointment is at [TIME]. Address: [location]. Running late? Reply to let us know
\\\`\\\`\\\`
**Character Count:** 124/160 ✓

---

### 🛒 CART ABANDONMENT - GENTLE
\\\`\\\`\\\`
\${clientName}: You left something behind! Your cart is saved and waiting. Complete your order: [link] Reply STOP to opt out
\\\`\\\`\\\`
**Character Count:** 124/160 ✓

---

### 🛒 CART ABANDONMENT - INCENTIVE
\\\`\\\`\\\`
\${clientName}: Still thinking it over? Here's 10% off to help! Use code SAVE10: [link] Reply STOP to unsubscribe
\\\`\\\`\\\`
**Character Count:** 113/160 ✓

---

### 📦 ORDER UPDATE
\\\`\\\`\\\`
\${clientName}: Good news! Your order #[ORDER] has shipped. Track it here: [link] Questions? Reply to this message
\\\`\\\`\\\`
**Character Count:** 115/160 ✓

---

## ✓ COMPLIANCE NOTES
- All messages under 160 characters
- Opt-out/response option included
- Personalization tokens marked with [brackets]\`,

    'whatsapp-promo': \`# WhatsApp Promotional Messages for \${clientName}

## Campaign Focus
\${brief.substring(0, 100)}...

---

## WHATSAPP MESSAGES

### 💬 PROMOTIONAL MESSAGE 1
Hey there! 👋

Big news from \${clientName}!

🎉 **FLASH SALE - 48 HOURS ONLY**

✨ Up to 40% off bestsellers
🚚 Free shipping on orders over $50
🎁 Bonus gift with every purchase

Shop now: [link]

Questions? Just reply to this message - we're here to help! 💬

---

### 💬 PROMOTIONAL MESSAGE 2
Hi! 🌟

Exclusive offer just for our WhatsApp family:

🔥 **VIP EARLY ACCESS**

New collection drops in 24 hours, but YOU get first dibs!

Use code: VIPFIRST for 20% off

Preview & Shop: [link]

Limited stock - don't miss out! ⏰

---

### 💬 NEW ARRIVAL ANNOUNCEMENT
Hello! 👋

Something exciting just landed at \${clientName}! 🎊

**Introducing: [Product Name]**

⭐ [Key Feature 1]
⭐ [Key Feature 2]
⭐ [Key Feature 3]

Early bird special: 15% off for the first 100 orders!

Check it out: [link]

---

## 📊 BEST PRACTICES
✓ Use emojis for visual appeal
✓ Keep messages scannable with line breaks
✓ Include clear CTA button/link
✓ Offer reply option for engagement
✓ Personalize when possible\`,

    'whatsapp-flow': \`# WhatsApp Conversational Flow for \${clientName}

## Flow Purpose
\${brief.substring(0, 100)}...

---

## CONVERSATION SEQUENCE

### MESSAGE 1: WELCOME/OPENER
Hey! 👋 Welcome to \${clientName}!

I'm here to help you find exactly what you need.

What brings you here today?

1️⃣ Browse products
2️⃣ Check order status
3️⃣ Get support
4️⃣ Learn about offers

Just reply with a number!

---

### MESSAGE 2A: BROWSE PRODUCTS (if replied "1")
Great choice! 🛍️

Here are our most popular categories:

🔹 New Arrivals
🔹 Best Sellers
🔹 On Sale

Which would you like to explore?

Or tell me what you're looking for and I'll help find it!

---

### MESSAGE 2B: ORDER STATUS (if replied "2")
No problem! 📦

To check your order, I just need your:
• Order number (starts with #)
OR
• Email used for the order

Please share and I'll look it up right away!

---

### MESSAGE 2C: SUPPORT (if replied "3")
I'm here to help! 💪

What do you need assistance with?

1️⃣ Returns & exchanges
2️⃣ Shipping questions
3️⃣ Product information
4️⃣ Speak to a human

Reply with a number or describe your issue!

---

### MESSAGE 2D: OFFERS (if replied "4")
You're going to love this! 🎉

Current offers at \${clientName}:

🏷️ SAVE15 - 15% off first order
🚚 Free shipping over $50
🎁 Buy 2, Get 1 Free on select items

Want me to help you apply these?

---

## 🔄 FALLBACK MESSAGE
I didn't quite catch that! 😅

No worries - just reply with:
• A number (1-4) for quick options
• Or type your question and I'll help!

I'm here for you! 💬

---

## 📊 FLOW OPTIMIZATION TIPS
- Keep response time under 5 minutes during business hours
- Use quick reply buttons when possible
- Always offer human escalation option
- Track drop-off points to improve flow\`
  };`;

if (content.includes(marker)) {
  content = content.replace(marker, smsTemplates);
  fs.writeFileSync(serverPath, content);
  console.log('SMS templates added successfully!');
} else {
  console.log('Marker not found. Searching for alternative...');
  // Try with slightly different marker
  const altMarker = "| Content Pieces | X | X + 20 | X + 50 |`\n  };";
  if (content.includes(altMarker)) {
    content = content.replace(altMarker, smsTemplates);
    fs.writeFileSync(serverPath, content);
    console.log('SMS templates added successfully (alt marker)!');
  } else {
    console.log('Could not find marker to insert templates');
  }
}
