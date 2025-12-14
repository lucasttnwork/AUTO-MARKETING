# Puppeteer MCP Troubleshooting Guide

## Common Issues and Solutions

### 1. Navigation Timeout Errors
**Error:** `Navigation timeout of 30000 ms exceeded`

**Cause:** Page takes longer than default 30s to load

**Solution:**
- Increased timeout to 120s in `client.py`
- Configuration: `--timeout=120000` and `--protocol-timeout=120000`
- If still timing out, check:
  - Is the local dev server running? (`npm run dev` or similar)
  - Is the URL correct?
  - Are there network issues?

**Test:**
```bash
curl http://localhost:5173  # Should return HTML
```

### 2. Protocol Timeout Errors
**Error:** `Page.captureScreenshot timed out` or `Emulation.setTouchEmulationEnabled timed out`

**Cause:** Chrome DevTools Protocol commands timing out (default: 30s)

**Solution:**
- Now configured with 120s protocol timeout
- Caused by browser being slow, frozen, or overloaded
- Try restarting the Puppeteer browser:
  - Kill the Chrome/Chromium process
  - Restart your agent

### 3. Invalid CSS Selector Errors
**Error:** `SyntaxError: 'button:has-text("Export")' is not a valid selector`

**Cause:** Using Playwright syntax instead of Puppeteer CSS selectors

**Puppeteer vs Playwright Selectors:**

| Feature | Puppeteer | Playwright |
|---------|-----------|------------|
| By text | ❌ No native support | ✅ `text=Export` |
| Has-text | ❌ Not supported | ✅ `:has-text("Export")` |
| CSS selector | ✅ Standard CSS only | ✅ CSS + extensions |

**Solution - Finding elements by text in Puppeteer:**

```javascript
// Use puppeteer_evaluate to find by text
const buttons = Array.from(document.querySelectorAll('button'));
const exportBtn = buttons.find(btn => btn.textContent.includes('Export'));
if (exportBtn) {
  exportBtn.click();
}
```

**Valid Puppeteer selectors:**
```css
button                          /* Tag name */
.btn-primary                   /* Class */
#export-button                 /* ID */
[data-testid="export-btn"]    /* Attribute */
button.btn-primary            /* Combination */
div > button:first-child      /* Pseudo-selectors */
input[type="text"]            /* Attribute value */
```

### 4. Script Execution Timeout
**Error:** `Runtime.evaluate timed out`

**Causes:**
- Infinite loop in JavaScript
- Very slow page rendering
- Waiting for network requests

**Solutions:**
- Keep `puppeteer_evaluate` scripts simple and fast
- Avoid waiting/polling inside scripts
- Use `puppeteer_navigate` to wait for page load before evaluating

### 5. Multiple Concurrent Timeouts
**Symptom:** Many operations time out in sequence

**Causes:**
- Browser crashed or became unresponsive
- Page is in a bad state
- Too many operations at once

**Solutions:**
1. Navigate to a fresh page first
2. Take a screenshot to verify page state
3. Add delays between operations if needed
4. Restart the agent if browser is stuck

## Best Practices

### 1. Always verify page loaded before interacting
```javascript
// 1. Navigate
puppeteer_navigate(url)

// 2. Screenshot to verify
puppeteer_screenshot(name="verify-loaded")

// 3. Then interact
puppeteer_click(selector)
```

### 2. Use robust selectors
Prefer (in order):
1. `data-testid` attributes: `[data-testid="export-button"]`
2. IDs: `#export-button`
3. Classes: `.export-btn`
4. Tag + class: `button.export-btn`
5. Text-based (via evaluate): last resort

### 3. Handle slow pages gracefully
```javascript
// Check if element exists before clicking
const element = document.querySelector('button.export');
if (element) {
  element.click();
  return { success: true };
} else {
  return { success: false, error: 'Element not found' };
}
```

### 4. Debug with screenshots
Take screenshots liberally during automation:
```javascript
puppeteer_screenshot(name="before-click")
puppeteer_click(selector)
puppeteer_screenshot(name="after-click")
```

## Configuration Reference

### Current Timeout Settings
- **Navigation timeout:** 120 seconds (increased from 30s default)
- **Protocol timeout:** 120 seconds (increased from 30s default)
- **Max turns:** 1000

### Environment Variables
Set in `client.py`:
```python
"env": {
    "PUPPETEER_TIMEOUT": "120000",
    "PUPPETEER_PROTOCOL_TIMEOUT": "120000"
}
```

### MCP Server Args
```python
"args": [
    "puppeteer-mcp-server",
    "--timeout=120000",
    "--protocol-timeout=120000",
]
```

## Debugging Checklist

When encountering errors:

- [ ] Is the dev server running and accessible?
- [ ] Is the URL correct?
- [ ] Are you using valid CSS selectors (not Playwright syntax)?
- [ ] Did you navigate to the page first?
- [ ] Is the page fully loaded? (take a screenshot)
- [ ] Are there JavaScript errors in the page console?
- [ ] Is the browser process still running?
- [ ] Try navigating to a simple page (e.g., `about:blank`) to test

## Additional Resources

- [Puppeteer Selectors Documentation](https://pptr.dev/guides/query-selectors)
- [CSS Selectors Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
