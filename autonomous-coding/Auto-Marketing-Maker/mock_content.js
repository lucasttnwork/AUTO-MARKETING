// Helper function for mock content generation
function generateMockAgentContent(agentType, brief, clientName) {
  const templates = {
    'email-sequence': `# Welcome Email Sequence for ${clientName}

## Email 1: Welcome & Introduction
**Subject Line A:** Welcome to ${clientName} - Your Journey Starts Here!
**Subject Line B:** You're In! Here's What Happens Next...

Dear [First Name],

Welcome to the ${clientName} family! We're thrilled to have you join us.

Based on your brief: "${brief.substring(0, 100)}..."

Here's what you can expect:
- Exclusive access to our best resources
- Priority support when you need it
- Regular updates and tips

**CTA:** Get Started Now

---

## Email 2: Value Delivery (Day 2)
**Subject:** [First Name], here's your first gift...

We promised value, and we deliver. Here's something special just for you...

---

## Email 3: Social Proof (Day 4)
**Subject:** See what others are saying about ${clientName}

"${clientName} changed everything for our business..." - Happy Customer`,

    'landing-page': `# Landing Page Copy for ${clientName}

## Hero Section
**Headline:** Transform Your [Pain Point] Into [Desired Outcome]
**Subheadline:** ${clientName} helps you achieve results in less time, with less effort.
**CTA:** Start Your Free Trial

---

## Problem Section
Are you tired of [common pain point]? You're not alone.

Based on your brief: "${brief.substring(0, 100)}..."

Most people struggle with:
- Pain point 1
- Pain point 2
- Pain point 3

---

## Solution Section
Introducing ${clientName}: The smarter way to [achieve goal].

**Key Benefits:**
1. Benefit One - with supporting detail
2. Benefit Two - with supporting detail
3. Benefit Three - with supporting detail

---

## Social Proof
"${clientName} delivered exactly what they promised." - Customer Name

---

## FAQ Section
**Q: How quickly will I see results?**
A: Most customers see initial results within...

---

## Final CTA
Ready to get started? Join thousands who've already transformed their [area].

**CTA:** Get Started Free`,

    'social-media': `# Social Media Content for ${clientName}

## Instagram Post
Big news from ${clientName}!

Based on: "${brief.substring(0, 80)}..."

Here's what you need to know:
- Key point 1
- Key point 2
- Key point 3

Ready to level up? Link in bio!

#${clientName.replace(/\s/g, '')} #Marketing #Growth

---

## Instagram Carousel (5 slides)

**Slide 1 (Hook):** "The secret to [outcome] that nobody talks about..."

**Slide 2:** Problem: Most people do [wrong approach]

**Slide 3:** Instead, try [right approach]

**Slide 4:** Here's how it works: [steps]

**Slide 5 (CTA):** Want more tips like this? Follow @${clientName.toLowerCase().replace(/\s/g, '')}

---

## LinkedIn Post

A lesson we learned at ${clientName}:

${brief.substring(0, 100)}...

Here's what we discovered:

1. First insight
2. Second insight
3. Third insight

The bottom line? [Key takeaway]

What's your experience with this? Drop a comment below.`,

    'ad-copy': `# Ad Copy Variations for ${clientName}

## Facebook Ad - Variation 1
**Primary Text:**
Struggling with [pain point]? ${clientName} has the solution.

Based on: "${brief.substring(0, 80)}..."

Benefits:
- Benefit 1
- Benefit 2
- Benefit 3

Try it free today

**Headline:** Stop [Pain] and Start [Gain]
**Description:** Join 10,000+ customers who made the switch.

---

## Facebook Ad - Variation 2
**Primary Text:**
"I wish I found ${clientName} sooner!" - Sarah M.

Here's why customers love us:
- Reason 1
- Reason 2
- Reason 3

**Headline:** The ${clientName} Difference
**Description:** See results in 30 days or less.

---

## Google Ads

**Headline 1:** ${clientName} - Get Results Fast
**Headline 2:** Trusted by 10,000+ Customers
**Headline 3:** Start Your Free Trial Today

**Description 1:** Discover why thousands choose ${clientName} for [solution]. Try free for 14 days.
**Description 2:** [Benefit 1]. [Benefit 2]. [Benefit 3]. Get started in minutes.`,

    'video-script': `# Video Script for ${clientName}

## UGC-Style Script (60 seconds)

**HOOK (0-3 sec):**
"Stop scrolling if you've ever struggled with [pain point]..."

**PROBLEM (3-15 sec):**
"I used to spend hours trying to [achieve goal], but nothing worked. Sound familiar?"

Based on: "${brief.substring(0, 80)}..."

**SOLUTION (15-35 sec):**
"Then I discovered ${clientName}. Here's what changed:
- First, [benefit 1]
- Then, [benefit 2]
- And finally, [benefit 3]"

**PROOF (35-50 sec):**
"In just [timeframe], I went from [before state] to [after state]."

**CTA (50-60 sec):**
"Ready to get the same results? Click the link below to try ${clientName} free. You won't regret it!"

---

## B-Roll Suggestions:
- 0:00 - Face to camera, authentic setting
- 0:15 - Screen recording of problem
- 0:30 - Product demonstration
- 0:45 - Results/testimonial screenshot
- 0:55 - Face to camera with enthusiasm`,

    'content-strategy': `# 30-Day Content Strategy for ${clientName}

Based on: "${brief.substring(0, 100)}..."

## Content Pillars
1. **Educational Content** - How-to guides, tips, tutorials
2. **Social Proof** - Customer stories, case studies, results
3. **Behind the Scenes** - Company culture, process, team
4. **Engagement** - Questions, polls, conversations

---

## Week 1: Foundation
- Day 1: Introduction post - Who is ${clientName}?
- Day 2: Educational tip #1
- Day 3: Customer testimonial
- Day 4: Behind the scenes
- Day 5: Engagement question
- Day 6: Educational tip #2
- Day 7: Weekly recap

## Week 2: Value
[Similar structure with deeper content]

## Week 3: Trust Building
[Customer stories and case studies focus]

## Week 4: Conversion
[Promotional content with offers]

---

## Key Topics to Cover:
1. Topic A - addressing [pain point]
2. Topic B - demonstrating [benefit]
3. Topic C - comparing [alternatives]

## Hashtag Strategy:
Primary: #${clientName.replace(/\s/g, '')}
Secondary: #[industry] #[topic] #[benefit]`,

    'sms-whatsapp': `# SMS/WhatsApp Messages for ${clientName}

Based on: "${brief.substring(0, 80)}..."

## SMS Campaign (160 characters max)

**Promo Alert:**
${clientName}: Your exclusive 20% off code is here! Use SAVE20 at checkout. Shop now: [link] Reply STOP to opt out

**Reminder:**
Hey! Your cart at ${clientName} is waiting. Complete your order [link]

**Welcome:**
Welcome to ${clientName}! Reply YES for exclusive deals.

---

## WhatsApp Messages

**Welcome Message:**
Hey there!

Welcome to ${clientName}! We're excited to have you.

Here's what you can expect:
- Exclusive offers
- Order updates
- Quick support

Need help? Just reply to this message!

**Promotional:**
FLASH SALE at ${clientName}!

For the next 24 hours only:
- 30% off everything
- Free shipping
- Bonus gift with purchase

Shop now [link]

Don't miss out!`
  };

  return templates[agentType] || `Generated content for ${agentType}:

Based on your brief: "${brief}"

Client: ${clientName}

[Content would be generated here based on the specific agent type and requirements.]`;
}

module.exports = { generateMockAgentContent };
