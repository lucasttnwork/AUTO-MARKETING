const fs = require('fs');
const content = fs.readFileSync('server/index.js', 'utf8');

// Find the location where we need to insert
const searchStr = "This ensures variety while maintaining consistency in your content mix.`  };";
const idx = content.indexOf(searchStr);

if (idx === -1) {
  console.log('Pattern not found');
  process.exit(1);
}

// New templates to add
const newTemplates = `This ensures variety while maintaining consistency in your content mix.\`,

    'editorial-calendar': \`# 30-Day Editorial Calendar for \${clientName}

## Campaign Focus
\${brief.substring(0, 150)}...

---

## EDITORIAL CALENDAR OVERVIEW

| Week | Theme | Content Focus |
|------|-------|---------------|
| Week 1 | Foundation | Brand awareness, value proposition |
| Week 2 | Education | Pain points, solutions, how-tos |
| Week 3 | Social Proof | Testimonials, case studies, results |
| Week 4 | Conversion | Offers, CTAs, promotions |

---

## WEEK 1: FOUNDATION (Days 1-7)

### Day 1 - Monday
**Content Type:** Instagram Post / LinkedIn Post
**Topic:** Introduction - Who is \${clientName}?
**Platform:** Instagram, LinkedIn, Facebook
**Brief:** Share your brand story, mission, and what makes you unique.

### Day 2 - Tuesday
**Content Type:** Educational Carousel
**Topic:** 5 Things You Didnt Know About Your Industry
**Platform:** Instagram, LinkedIn
**Brief:** Educational content establishing authority in your space.

### Day 3 - Wednesday
**Content Type:** Behind-the-Scenes Story
**Topic:** A Day in the Life at \${clientName}
**Platform:** Instagram Stories, TikTok
**Brief:** Show the human side of your brand.

### Day 4 - Thursday
**Content Type:** Educational Video/Reel
**Topic:** Quick Tip: Solve a Common Problem
**Platform:** Instagram Reels, TikTok, YouTube Shorts
**Brief:** 30-60 second video with a quick, actionable tip.

### Day 5 - Friday
**Content Type:** Engagement Post
**Topic:** This or That Poll / Question
**Platform:** Instagram Stories, Twitter/X
**Brief:** Interactive content to boost engagement.

### Day 6 - Saturday
**Content Type:** Value Post
**Topic:** Weekend Resource: Free Tool/Template/Guide
**Platform:** Instagram, LinkedIn, Twitter/X
**Brief:** Share something valuable with no ask.

### Day 7 - Sunday
**Content Type:** Inspirational/Motivational
**Topic:** Weekly Motivation / Quote
**Platform:** Instagram, Facebook
**Brief:** Share an inspiring quote aligned with your brand values.

---

## WEEK 2: EDUCATION (Days 8-14)

### Day 8 - Monday
**Content Type:** Blog Post / Long-form
**Topic:** The Complete Guide to Core Topic
**Platform:** Blog, LinkedIn Article
**Brief:** Comprehensive educational piece.

### Day 9 - Tuesday
**Content Type:** Problem-Solution Carousel
**Topic:** Common Problem and How to Fix It
**Platform:** Instagram, LinkedIn
**Brief:** Address a major pain point your audience faces.

### Day 10 - Wednesday
**Content Type:** Video Tutorial
**Topic:** How to Achieve Specific Result
**Platform:** YouTube, Instagram Reels, TikTok
**Brief:** Step-by-step tutorial.

### Day 11 - Thursday
**Content Type:** Myth-Busting Post
**Topic:** 3 Myths About Topic - Debunked
**Platform:** Instagram, LinkedIn, Twitter Thread
**Brief:** Challenge common misconceptions.

### Day 12 - Friday
**Content Type:** Q and A / AMA
**Topic:** Ask Me Anything About Topic
**Platform:** Instagram Stories, LinkedIn
**Brief:** Engage directly with audience questions.

### Day 13 - Saturday
**Content Type:** Listicle Post
**Topic:** 7 Tools/Resources for Achieving Goal
**Platform:** Instagram Carousel, Blog, Twitter Thread
**Brief:** Curated list of helpful resources.

### Day 14 - Sunday
**Content Type:** Recap/Summary
**Topic:** Week in Review: Key Takeaways
**Platform:** Instagram Stories, Email Newsletter
**Brief:** Summarize the weeks best content.

---

## WEEK 3: SOCIAL PROOF (Days 15-21)

### Day 15 - Monday
**Content Type:** Customer Testimonial
**Topic:** Customer Success Story
**Platform:** Instagram, LinkedIn, Facebook
**Brief:** Feature a happy customer with their results.

### Day 16 - Tuesday
**Content Type:** Case Study
**Topic:** How Customer Achieved Result in Time
**Platform:** Blog, LinkedIn, Email
**Brief:** Detailed case study with specific metrics.

### Day 17 - Wednesday
**Content Type:** User-Generated Content
**Topic:** Repost: Customer Content
**Platform:** Instagram Stories, TikTok
**Brief:** Share content created by your customers.

### Day 18 - Thursday
**Content Type:** Results Compilation
**Topic:** Results Our Customers Are Getting
**Platform:** Instagram Carousel, LinkedIn
**Brief:** Compilation of multiple customer results.

### Day 19 - Friday
**Content Type:** Live Q and A / Webinar
**Topic:** Live: Expert Topic Discussion
**Platform:** Instagram Live, LinkedIn Live, YouTube
**Brief:** Host a live session answering questions.

### Day 20 - Saturday
**Content Type:** Before/After
**Topic:** Transformation: Customer Journey
**Platform:** Instagram, TikTok, Facebook
**Brief:** Visual before/after showcasing transformation.

### Day 21 - Sunday
**Content Type:** Gratitude Post
**Topic:** Thank You to Our Community
**Platform:** Instagram, Facebook
**Brief:** Express genuine gratitude to customers.

---

## WEEK 4: CONVERSION (Days 22-30)

### Day 22 - Monday
**Content Type:** Product/Service Feature
**Topic:** Introducing Product/Feature
**Platform:** Instagram, LinkedIn, Email
**Brief:** Highlight key product/service features.

### Day 23 - Tuesday
**Content Type:** Limited-Time Offer
**Topic:** 48-Hour Flash Sale
**Platform:** Instagram Stories, Email, SMS
**Brief:** Create urgency with a time-limited offer.

### Day 24 - Wednesday
**Content Type:** FAQ Video
**Topic:** Answering Your Top Questions
**Platform:** Instagram Reels, TikTok, YouTube
**Brief:** Address common questions and objections.

### Day 25 - Thursday
**Content Type:** Comparison Post
**Topic:** Why \${clientName} vs. Alternatives
**Platform:** Instagram Carousel, Blog, LinkedIn
**Brief:** Honest comparison showing unique value proposition.

### Day 26 - Friday
**Content Type:** Social Proof + Offer
**Topic:** Join Happy Customers - Special Offer
**Platform:** Instagram, Facebook, Email
**Brief:** Combine social proof with compelling offer.

### Day 27 - Saturday
**Content Type:** Story/Reel Series
**Topic:** Weekend Special: Exclusive Offer
**Platform:** Instagram Stories, TikTok
**Brief:** Multi-part story series with exclusive offer.

### Day 28 - Sunday
**Content Type:** Countdown/Reminder
**Topic:** Last Chance: Offer Ends Tonight
**Platform:** Instagram Stories, Email, SMS
**Brief:** Final push reminder for ongoing promotions.

### Day 29 - Monday
**Content Type:** New Month Preview
**Topic:** Whats Coming Next Month
**Platform:** Instagram, LinkedIn
**Brief:** Tease upcoming content, products, or events.

### Day 30 - Tuesday
**Content Type:** Month in Review
**Topic:** 30 Days of Topic: Best Moments
**Platform:** Instagram Carousel, Blog
**Brief:** Recap the best content and achievements.

---

## CONTENT MIX SUMMARY

| Content Type | Frequency | Percentage |
|--------------|-----------|------------|
| Educational | 10 posts | 33% |
| Social Proof | 7 posts | 23% |
| Engagement | 5 posts | 17% |
| Promotional | 5 posts | 17% |
| Behind-the-Scenes | 3 posts | 10% |

---

## KEY METRICS TO TRACK

1. Engagement Rate - Target: 3-5%
2. Reach Growth - Target: 10% month-over-month
3. Click-through Rate - Target: 1-2%
4. Conversion Rate - Target: Based on industry
5. Follower Growth - Track weekly

---

## EXPORT OPTIONS

This calendar can be:
- Exported to Google Sheets
- Synced with content scheduling tools
- Downloaded as PDF
- Integrated with project management tools\`,

    'topic-clusters': \`# SEO Topic Cluster Strategy for \${clientName}

## Campaign Focus
\${brief.substring(0, 150)}...

---

## TOPIC CLUSTER OVERVIEW

Topic clusters are groups of interlinked content that establish topical authority. Each cluster has a pillar page supported by related cluster content.

---

## PILLAR 1: PRIMARY TOPIC

### Pillar Page
**Title:** The Ultimate Guide to Primary Topic
**Target Keyword:** primary keyword (2000-3000 monthly searches)
**Word Count:** 3000-5000 words

### Cluster Articles

| Article Title | Target Keyword | Search Volume | Difficulty |
|--------------|----------------|---------------|------------|
| How to Subtopic A | keyword a | 800 | Medium |
| Best Subtopic B for Audience | keyword b | 1200 | Low |
| Subtopic C vs Alternative | keyword c | 500 | Low |
| Common Topic Mistakes | keyword d | 600 | Medium |
| Topic for Beginners | keyword e | 1500 | High |
| Advanced Topic Strategies | keyword f | 400 | Medium |
| Topic Tools and Resources | keyword g | 900 | Low |
| Topic Case Studies | keyword h | 300 | Low |

---

## PILLAR 2: SECONDARY TOPIC

### Pillar Page
**Title:** Complete Secondary Topic Strategy
**Target Keyword:** secondary keyword
**Word Count:** 2500-4000 words

### Cluster Articles

| Article Title | Target Keyword | Search Volume | Difficulty |
|--------------|----------------|---------------|------------|
| Topic Step-by-Step Tutorial | keyword | 700 | Medium |
| Top Number Topic Examples | keyword | 1000 | Low |
| Topic Trends for Year | keyword | 500 | Medium |
| How Company Uses Topic | keyword | 400 | Low |
| Topic ROI Calculator | keyword | 300 | Low |
| Topic Checklist | keyword | 800 | Low |

---

## INTERNAL LINKING RULES

1. Pillar to Cluster: Each pillar page links to all its cluster articles
2. Cluster to Pillar: Every cluster article links back to its pillar page
3. Cluster to Cluster: Related articles link to each other (2-3 links)
4. Cross-Pillar: Link between pillars when topically relevant
5. Anchor Text: Use descriptive, keyword-rich anchor text

---

## SUCCESS METRICS

| Metric | 3-Month Target | 6-Month Target | 12-Month Target |
|--------|---------------|----------------|-----------------|
| Organic Traffic | +25% | +75% | +150% |
| Keywords Top 10 | 10 | 30 | 60 |
| Domain Authority | +5 | +10 | +20 |
| Backlinks | 20 | 50 | 100 |\`,

    'content-gap': \`# Content Gap Analysis for \${clientName}

## Analysis Focus
\${brief.substring(0, 150)}...

---

## CONTENT GAP OVERVIEW

A content gap analysis identifies topics and keywords your competitors rank for that you dont, revealing opportunities to capture additional organic traffic.

---

## COMPETITOR CONTENT AUDIT

### Competitor 1: Competitor Name
**Domain Authority:** XX
**Estimated Monthly Traffic:** XXX,XXX

#### Top-Performing Content:
| Content Title | Est. Traffic | Keywords | Gap Opportunity |
|--------------|--------------|----------|-----------------|
| Article 1 | 5,000 | 15 | HIGH - No coverage |
| Article 2 | 3,500 | 12 | MEDIUM - Outdated |
| Article 3 | 2,800 | 8 | HIGH - Missing |

### Competitor 2: Competitor Name
**Domain Authority:** XX
**Estimated Monthly Traffic:** XXX,XXX

#### Top-Performing Content:
| Content Title | Est. Traffic | Keywords | Gap Opportunity |
|--------------|--------------|----------|-----------------|
| Article 1 | 4,200 | 11 | HIGH |
| Article 2 | 3,100 | 9 | MEDIUM |
| Article 3 | 2,500 | 7 | HIGH |

---

## IDENTIFIED CONTENT GAPS

### HIGH PRIORITY GAPS (Quick Wins)

| Topic/Keyword | Search Volume | Difficulty | Action |
|--------------|---------------|------------|--------|
| Keyword 1 | 2,500 | Low | Create guide |
| Keyword 2 | 1,800 | Low | Create comparison |
| Keyword 3 | 1,500 | Medium | Create tutorial |
| Keyword 4 | 1,200 | Low | Create listicle |
| Keyword 5 | 1,000 | Low | Create case study |

### MEDIUM PRIORITY GAPS

| Topic/Keyword | Search Volume | Difficulty | Action |
|--------------|---------------|------------|--------|
| Keyword 6 | 800 | Medium | Update existing |
| Keyword 7 | 700 | Medium | New pillar page |
| Keyword 8 | 600 | High | Create superior resource |

---

## CONTENT FORMAT GAPS

| Format | Competitor Usage | Our Status | Priority |
|--------|-----------------|------------|----------|
| Interactive Calculators | 2/3 competitors | Missing | HIGH |
| Video Tutorials | 3/3 competitors | Limited | HIGH |
| Infographics | 2/3 competitors | Missing | MEDIUM |
| Downloadable Templates | 2/3 competitors | Missing | HIGH |
| Case Studies | 3/3 competitors | Limited | HIGH |

---

## ACTION PLAN

### Immediate Actions (Next 30 Days):
1. Create High Priority Gap 1 - comprehensive guide
2. Create High Priority Gap 2 - comparison article
3. Update Outdated Article 1 - refresh statistics
4. Add video to Existing Article
5. Create downloadable template for Topic

### Short-term Actions (30-60 Days):
1. Create High Priority Gap 3 - tutorial content
2. Create High Priority Gap 4 - listicle
3. Expand Thin Content 1 - add 1,500+ words
4. Create interactive calculator for Topic

---

## PROJECTED IMPACT

| Metric | Current | 3-Month Target | 6-Month Target |
|--------|---------|----------------|----------------|
| Organic Keywords | X | X + 50 | X + 150 |
| Estimated Traffic | X | X + 25% | X + 75% |
| Content Pieces | X | X + 20 | X + 50 |\`
  };

  // Check for content type specific template first
  if (contentType && contentTypeTemplates[contentType]) {
    return contentTypeTemplates[contentType];
  }`;

const newContent = content.replace(searchStr, newTemplates);
fs.writeFileSync('server/index.js', newContent);
console.log('Templates added successfully');
