import os
import json
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\charles\.gemini\antigravity\brain\d9445050-133d-4e21-aadb-bcd6bb52a3f3"
SCREENSHOT_DIR = os.path.join(ARTIFACT_DIR, "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

sections = [
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

report = {
    "console_errors": [],
    "console_warnings": [],
    "page_errors": [],
    "overflow_issues": [],
    "interactivity": {},
    "dark_mode_issues": [],
    "tap_target_issues": []
}

def record_error(msg):
    text = msg.text
    if msg.type == 'error':
        report["console_errors"].append(text)
        print(f"[CONSOLE ERROR]: {text}")
    elif msg.type == 'warning':
        if "Could not sync" not in text and "favicon" not in text:
            report["console_warnings"].append(text)

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)

    # ----------------------------------------------------
    # 1. Desktop Audit (1440x900) - Light & Dark Modes
    # ----------------------------------------------------
    print("\n--- 1. DESKTOP AUDIT (1440x900) ---")
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.on("console", record_error)
    page.on("pageerror", lambda err: report["page_errors"].append(str(err)))

    page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)

    # Landing Desktop
    print("Testing Landing Desktop...")
    page.goto("http://localhost:5173/", wait_until="domcontentloaded")
    time.sleep(1)
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_01_landing.png"))

    # Test Landing Sign In Modal
    page.click("#section-landing .account .signin")
    time.sleep(0.5)
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_01b_landing_signin.png"))
    page.evaluate("() => document.querySelector('#lp-sign-in')?.close()")
    time.sleep(0.3)

    # Check each workspace section in Desktop Light Mode
    for sec in sections:
        if sec == "landing":
            continue
        print(f"Testing Desktop Section: {sec}...")
        page.goto(f"http://localhost:5173/?dev_preview={sec}", wait_until="domcontentloaded")
        time.sleep(0.8)
        page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")

        # Check horizontal overflow
        of = page.evaluate("""() => {
            const doc = document.documentElement;
            const body = document.body;
            return {
                docScroll: doc.scrollWidth,
                docClient: doc.clientWidth,
                bodyScroll: body.scrollWidth,
                bodyClient: body.clientWidth,
                diff: Math.max(doc.scrollWidth - doc.clientWidth, body.scrollWidth - body.clientWidth)
            };
        }""")
        if of["diff"] > 2:
            report["overflow_issues"].append({"section": sec, "viewport": "1440x900", "overflow": of})
            print(f"  [OVERFLOW] {sec}: scrollWidth={of['docScroll']}, clientWidth={of['docClient']}")

        page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"desktop_sec_{sec}.png"))

    # ----------------------------------------------------
    # 2. Desktop Dark Mode Audit
    # ----------------------------------------------------
    print("\n--- 2. DESKTOP DARK MODE AUDIT ---")
    page.goto("http://localhost:5173/?dev_preview=dashboard", wait_until="domcontentloaded")
    time.sleep(0.8)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    # Toggle theme to dark
    page.evaluate("() => { if(!document.body.classList.contains('dark-theme')) { const t = document.querySelector('#theme-toggle, .theme-toggle, [data-action=\"toggle-theme\"]'); if(t) t.click(); else document.body.classList.add('dark-theme'); } }")
    time.sleep(0.5)
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_dark_dashboard.png"))

    # Check admin in dark theme
    page.goto("http://localhost:5173/?dev_preview=admin", wait_until="domcontentloaded")
    time.sleep(0.8)
    page.evaluate("() => { document.body.classList.add('dark-theme'); const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    time.sleep(0.5)
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_dark_admin.png"))

    # Check service offers in dark theme
    page.goto("http://localhost:5173/?dev_preview=service-offers", wait_until="domcontentloaded")
    time.sleep(0.8)
    page.evaluate("() => { document.body.classList.add('dark-theme'); const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    time.sleep(0.5)
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_dark_service_offers.png"))

    # ----------------------------------------------------
    # 3. Interactive Modals & Features Audit
    # ----------------------------------------------------
    print("\n--- 3. INTERACTIVE MODALS & FEATURES AUDIT ---")
    # Service Details Modal
    page.goto("http://localhost:5173/?dev_preview=service-offers", wait_until="domcontentloaded")
    time.sleep(0.8)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    details_btn = page.query_selector(".btn-view-details")
    if details_btn:
        details_btn.click()
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "modal_service_details.png"))
        report["interactivity"]["modal_service_details"] = "Opened successfully"
        page.evaluate("() => document.querySelector('#dialog-service-details')?.close()")
        time.sleep(0.3)

    # View Profile Modal (triggered via profile link or function)
    prof_opened = page.evaluate("""() => {
        if (typeof window.openViewProfileDialog === 'function') {
            window.openViewProfileDialog('dev_student_2');
            return true;
        }
        return false;
    }""")
    if prof_opened:
        time.sleep(0.8)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "modal_view_profile.png"))
        report["interactivity"]["modal_view_profile"] = "Opened successfully"
        page.evaluate("() => document.querySelector('#dialog-view-profile')?.close()")
        time.sleep(0.3)

    # Post Service Modal
    post_opened = page.evaluate("""() => {
        const d = document.querySelector('#dialog-post-service');
        if (d) { d.showModal(); return true; }
        return false;
    }""")
    if post_opened:
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "modal_post_service.png"))
        report["interactivity"]["modal_post_service"] = "Opened successfully"
        page.evaluate("() => document.querySelector('#dialog-post-service')?.close()")
        time.sleep(0.3)

    # Post Request Modal
    req_opened = page.evaluate("""() => {
        const d = document.querySelector('#dialog-post-request');
        if (d) { d.showModal(); return true; }
        return false;
    }""")
    if req_opened:
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "modal_post_request.png"))
        report["interactivity"]["modal_post_request"] = "Opened successfully"
        page.evaluate("() => document.querySelector('#dialog-post-request')?.close()")
        time.sleep(0.3)

    # Edit Profile Modal
    edit_prof_opened = page.evaluate("""() => {
        const d = document.querySelector('#dialog-edit-profile');
        if (d) { d.showModal(); return true; }
        return false;
    }""")
    if edit_prof_opened:
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "modal_edit_profile.png"))
        report["interactivity"]["modal_edit_profile"] = "Opened successfully"
        page.evaluate("() => document.querySelector('#dialog-edit-profile')?.close()")
        time.sleep(0.3)

    # ----------------------------------------------------
    # 4. Mobile Portrait Audit (390x844)
    # ----------------------------------------------------
    print("\n--- 4. MOBILE PORTRAIT AUDIT (390x844) ---")
    m_ctx = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True
    )
    m_page = m_ctx.new_page()
    m_page.on("console", record_error)
    m_page.on("pageerror", lambda err: report["page_errors"].append(str(err)))

    m_page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)

    # Landing Mobile
    m_page.goto("http://localhost:5173/", wait_until="domcontentloaded")
    time.sleep(0.8)
    m_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "mobile_390_landing.png"))

    # Landing Menu
    m_page.click("#section-landing .menu")
    time.sleep(0.4)
    m_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "mobile_390_landing_menu.png"))

    for sec in sections:
        if sec == "landing":
            continue
        print(f"Testing Mobile Section: {sec}...")
        m_page.goto(f"http://localhost:5173/?dev_preview={sec}", wait_until="domcontentloaded")
        time.sleep(0.8)
        m_page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")

        # Check horizontal overflow
        of = m_page.evaluate("""() => {
            const doc = document.documentElement;
            const body = document.body;
            return {
                docScroll: doc.scrollWidth,
                docClient: doc.clientWidth,
                bodyScroll: body.scrollWidth,
                bodyClient: body.clientWidth,
                diff: Math.max(doc.scrollWidth - doc.clientWidth, body.scrollWidth - body.clientWidth)
            };
        }""")
        if of["diff"] > 2:
            report["overflow_issues"].append({"section": sec, "viewport": "390x844", "overflow": of})
            print(f"  [MOBILE OVERFLOW] {sec}: scrollWidth={of['docScroll']}, clientWidth={of['docClient']}")

        # Audit touch target sizes
        small_targets = m_page.evaluate("""() => {
            const clickable = Array.from(document.querySelectorAll('button:not([hidden]), a:not([hidden]), input:not([type="hidden"]), select, textarea, .tab-btn'));
            const issues = [];
            for (let el of clickable) {
                if (el.offsetParent === null) continue; // hidden
                const r = el.getBoundingClientRect();
                if (r.width > 0 && r.height > 0 && (r.width < 40 || r.height < 40)) {
                    // Check if parent or container pads it
                    issues.push({
                        tag: el.tagName,
                        id: el.id,
                        className: el.className,
                        text: (el.textContent || '').trim().slice(0, 30),
                        width: Math.round(r.width),
                        height: Math.round(r.height)
                    });
                }
            }
            return issues.slice(0, 8); // sample first few
        }""")
        if small_targets:
            report["tap_target_issues"].append({"section": sec, "sample_targets": small_targets})

        m_page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"mobile_390_{sec}.png"))

    # Mobile Drawer Test
    m_page.goto("http://localhost:5173/?dev_preview=dashboard", wait_until="domcontentloaded")
    time.sleep(0.8)
    m_page.evaluate("() => document.querySelector('.workspace-menu')?.click()")
    time.sleep(0.4)
    m_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "mobile_390_sidebar_drawer.png"))

    # ----------------------------------------------------
    # 5. Mobile Landscape Audit (844x390)
    # ----------------------------------------------------
    print("\n--- 5. MOBILE LANDSCAPE AUDIT (844x390) ---")
    l_ctx = browser.new_context(
        viewport={"width": 844, "height": 390},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True
    )
    l_page = l_ctx.new_page()
    l_page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)
    l_page.goto("http://localhost:5173/?dev_preview=dashboard", wait_until="domcontentloaded")
    time.sleep(0.8)
    l_page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    l_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "mobile_landscape_dashboard.png"))

    # Landscape Admin
    l_page.goto("http://localhost:5173/?dev_preview=admin", wait_until="domcontentloaded")
    time.sleep(0.8)
    l_page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    l_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "mobile_landscape_admin.png"))

    browser.close()

with open(os.path.join(ARTIFACT_DIR, "comprehensive_audit_v2.json"), "w") as f:
    json.dump(report, f, indent=2)

print("\n=== AUDIT FINISHED ===")
print(f"Total Console Errors: {len(report['console_errors'])}")
print(f"Total Console Warnings: {len(report['console_warnings'])}")
print(f"Total Page Errors: {len(report['page_errors'])}")
print(f"Total Overflow Issues: {len(report['overflow_issues'])}")
print(f"Total Tap Target Issues Sections: {len(report['tap_target_issues'])}")
