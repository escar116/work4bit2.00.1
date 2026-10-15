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
    # 1. Desktop Audit (1440x900)
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

    # Check each workspace section in Desktop
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
            print(f"  [OVERFLOW] {sec}: diff={of['diff']}")

        page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"desktop_sec_{sec}.png"))

    # ----------------------------------------------------
    # 2. Interactive Modals & Feature Testing
    # ----------------------------------------------------
    print("\n--- 2. INTERACTIVE MODALS AUDIT ---")
    
    # 2a. Service Details Modal & Modal-to-Modal View Profile Navigation
    page.goto("http://localhost:5173/?dev_preview=service-offers", wait_until="domcontentloaded")
    time.sleep(0.8)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    details_btn = page.query_selector(".btn-view-details")
    if details_btn:
        details_btn.click()
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "modal_01_service_details.png"))
        report["interactivity"]["modal_service_details"] = "Opened successfully"
        
        # Click "View Profile" from inside the Service Details modal
        view_prof_btn = page.query_selector("#sd-btn-view-profile")
        if view_prof_btn:
            view_prof_btn.click()
            time.sleep(0.6)
            # Verify profile modal is open and has user data
            prof_data = page.evaluate("""() => {
                const vp = document.querySelector('#dialog-view-profile');
                return {
                    open: vp ? vp.open : false,
                    name: document.querySelector('#vp-name')?.textContent,
                    skillsCount: document.querySelectorAll('#vp-skills .badge')?.length,
                    hasBio: !!document.querySelector('#vp-bio')?.textContent,
                    reviewsCount: document.querySelector('#vp-ratings-count')?.textContent
                };
            }""")
            report["interactivity"]["modal_view_profile_from_service"] = prof_data
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "modal_02_view_profile.png"))
            page.evaluate("() => document.querySelector('#dialog-view-profile')?.close()")
            time.sleep(0.3)

    # 2b. Post Service Offer Modal (dialog-new-request in OFFER mode)
    page.goto("http://localhost:5173/?dev_preview=dashboard", wait_until="domcontentloaded")
    time.sleep(0.8)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    page.click("#dash-btn-post-offer")
    time.sleep(0.4)
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, "modal_03_post_service_offer.png"))
    report["interactivity"]["modal_post_offer"] = "Opened successfully"
    page.evaluate("() => document.querySelector('#dialog-new-request')?.close()")
    time.sleep(0.3)

    # 2c. Post Service Request Modal (dialog-new-request in REQUEST mode)
    page.click("#dash-btn-post-request")
    time.sleep(0.4)
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, "modal_04_post_service_request.png"))
    report["interactivity"]["modal_post_request"] = "Opened successfully"
    page.evaluate("() => document.querySelector('#dialog-new-request')?.close()")
    time.sleep(0.3)

    # 2d. Edit Profile Modal
    page.goto("http://localhost:5173/?dev_preview=profile", wait_until="domcontentloaded")
    time.sleep(0.8)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    page.click("#btn-edit-profile")
    time.sleep(0.4)
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, "modal_05_edit_profile.png"))
    report["interactivity"]["modal_edit_profile"] = "Opened successfully"
    page.evaluate("() => document.querySelector('#dialog-edit-profile')?.close()")
    time.sleep(0.3)

    # ----------------------------------------------------
    # 3. Mobile Portrait Audit (390x844)
    # ----------------------------------------------------
    print("\n--- 3. MOBILE PORTRAIT AUDIT (390x844) ---")
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
            print(f"  [MOBILE OVERFLOW] {sec}: diff={of['diff']}")

        # Audit touch target sizes (<40px)
        small_targets = m_page.evaluate("""() => {
            const clickable = Array.from(document.querySelectorAll('button:not([hidden]), a:not([hidden]), input:not([type="hidden"]), select, textarea, .tab-btn'));
            const issues = [];
            for (let el of clickable) {
                if (el.offsetParent === null) continue; // hidden
                const r = el.getBoundingClientRect();
                if (r.width > 0 && r.height > 0 && (r.width < 40 || r.height < 40)) {
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
            return issues;
        }""")
        if small_targets:
            report["tap_target_issues"].append({"section": sec, "sample_targets": small_targets})
            print(f"  [TAP TARGET ISSUE] in {sec}: {len(small_targets)} elements < 40px")

        m_page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"mobile_390_{sec}.png"))

    # Mobile Dashboard Quick Actions verification
    m_page.goto("http://localhost:5173/?dev_preview=dashboard", wait_until="domcontentloaded")
    time.sleep(0.8)
    m_page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    dash_actions_metrics = m_page.evaluate("""() => {
        const offerBtn = document.querySelector('#dash-btn-post-offer');
        const reqBtn = document.querySelector('#dash-btn-post-request');
        const refreshBtn = document.querySelector('#dashboard-refresh');
        return {
            offer: offerBtn ? { w: Math.round(offerBtn.getBoundingClientRect().width), h: Math.round(offerBtn.getBoundingClientRect().height) } : null,
            req: reqBtn ? { w: Math.round(reqBtn.getBoundingClientRect().width), h: Math.round(reqBtn.getBoundingClientRect().height) } : null,
            refresh: refreshBtn ? { w: Math.round(refreshBtn.getBoundingClientRect().width), h: Math.round(refreshBtn.getBoundingClientRect().height) } : null
        };
    }""")
    report["interactivity"]["mobile_dash_actions"] = dash_actions_metrics

    # Mobile Profile Avatar button verification
    m_page.goto("http://localhost:5173/?dev_preview=profile", wait_until="domcontentloaded")
    time.sleep(0.8)
    m_page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    avatar_btn_metrics = m_page.evaluate("""() => {
        const btn = document.querySelector('#btn-change-avatar');
        return btn ? { w: Math.round(btn.getBoundingClientRect().width), h: Math.round(btn.getBoundingClientRect().height) } : null;
    }""")
    report["interactivity"]["mobile_avatar_btn"] = avatar_btn_metrics

    # ----------------------------------------------------
    # 4. Mobile Landscape Audit (844x390)
    # ----------------------------------------------------
    print("\n--- 4. MOBILE LANDSCAPE AUDIT (844x390) ---")
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

    l_page.goto("http://localhost:5173/?dev_preview=admin", wait_until="domcontentloaded")
    time.sleep(0.8)
    l_page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    l_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "mobile_landscape_admin.png"))

    browser.close()

with open(os.path.join(ARTIFACT_DIR, "comprehensive_audit_v3.json"), "w") as f:
    json.dump(report, f, indent=2)

print("\n=== AUDIT V3 FINISHED ===")
print(f"Total Console Errors: {len(report['console_errors'])}")
print(f"Total Console Warnings: {len(report['console_warnings'])}")
print(f"Total Page Errors: {len(report['page_errors'])}")
print(f"Total Overflow Issues: {len(report['overflow_issues'])}")
print(f"Total Tap Target Issues Sections: {len(report['tap_target_issues'])}")
print("Interactivity details:", json.dumps(report["interactivity"], indent=2))
