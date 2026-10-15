import os
import json
from playwright.sync_api import sync_playwright

SECTIONS = [
    "landing",
    "dashboard",
    "service-offers",
    "service-requests",
    "mentoring",
    "applications",
    "messages",
    "transactions",
    "logs",
    "profile",
    "admin"
]

JS_AUDIT_ALL_TARGETS = """() => {
    const selector = 'button, a, input, select, textarea, [role="button"]';
    const elements = document.querySelectorAll(selector);
    const sub44 = [];
    
    for (const el of elements) {
        // Must not be hidden
        if (el.offsetParent === null && window.getComputedStyle(el).position !== 'fixed') continue;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
        if (el.hasAttribute('hidden') || el.classList.contains('hidden')) continue;
        
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        
        // Check computed dimensions
        if (rect.width < 44 || rect.height < 44) {
            sub44.push({
                tag: el.tagName.toLowerCase(),
                id: el.id || '',
                className: (typeof el.className === 'string' ? el.className.split(' ').slice(0, 3).join(' ') : ''),
                text: (el.textContent || el.value || el.placeholder || '').trim().replace(/\\s+/g, ' ').slice(0, 30),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            });
        }
    }
    return sub44;
}"""

findings = {}

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    for vp_name, vp in [("portrait_390", {"width": 390, "height": 844}), ("landscape_844", {"width": 844, "height": 390})]:
        ctx = browser.new_context(viewport=vp, is_mobile=True, has_touch=True)
        page = ctx.new_page()
        page.add_init_script("""
            localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
            localStorage.setItem('w4a-guide-v1-guest', '5');
        """)

        for sec in SECTIONS:
            url = "http://localhost:5173/" if sec == "landing" else f"http://localhost:5173/?dev_preview={sec}"
            page.goto(url, wait_until="domcontentloaded")
            page.wait_for_timeout(500)
            page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if (g && g.open) g.close(); }")
            
            sub = page.evaluate(JS_AUDIT_ALL_TARGETS)
            if sub:
                findings[f"{vp_name}_{sec}"] = sub

        ctx.close()
    browser.close()

print(json.dumps(findings, indent=2))
