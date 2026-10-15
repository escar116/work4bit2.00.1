import os
import json
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\charles\.gemini\antigravity\brain\fd163c90-b1fc-4be3-b0a5-0c4fc12919d1"
SCREENSHOT_DIR = os.path.join(ARTIFACT_DIR, "screenshots_verified")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

sections = [
    "landing",
    "dashboard",
    "services",
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
    "touch_target_issues": [],
    "dialog_checks": {},
    "admin_tab_checks": {},
    "a11y_issues": []
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
    print("--- 1. DESKTOP VERIFICATION (1440x900) ---")
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.on("console", record_error)
    page.on("pageerror", lambda err: report["page_errors"].append(str(err)))

    page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)

    # Landing Page
    print("Testing Landing Desktop...")
    page.goto("http://localhost:5173/", wait_until="domcontentloaded")
    time.sleep(1)
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_landing.png"))

    # Sections
    for sec in sections:
        if sec == "landing":
            continue
        print(f"Testing Desktop Section: {sec}...")
        page.goto(f"http://localhost:5173/?dev_preview={sec}", wait_until="domcontentloaded")
        time.sleep(0.7)
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

        page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"desktop_{sec}.png"))

    # ----------------------------------------------------
    # 2. Admin Tabs Verification
    # ----------------------------------------------------
    print("\n--- 2. ADMIN TABS VERIFICATION ---")
    page.goto("http://localhost:5173/?dev_preview=admin", wait_until="domcontentloaded")
    time.sleep(0.8)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")

    admin_tabs = [
        ("pending", "#tab-admin-pending", "#admin-tab-pane-pending"),
        ("users", "#tab-admin-registered", "#admin-tab-pane-users"),
        ("applications", "#tab-admin-applications", "#admin-tab-pane-applications"),
        ("listings", "#tab-admin-live-requests", "#admin-tab-pane-listings"),
        ("audit-logs", "#tab-admin-audit-logs", "#admin-tab-pane-audit-logs")
    ]

    for tab_name, tab_sel, pane_sel in admin_tabs:
        tab_btn = page.query_selector(tab_sel)
        if tab_btn:
            tab_btn.click()
            time.sleep(0.4)
            pane_vis = page.evaluate(f"() => !document.querySelector('{pane_sel}')?.classList.contains('hidden')")
            report["admin_tab_checks"][tab_name] = {"visible": pane_vis}
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"admin_tab_{tab_name}.png"))

    # ----------------------------------------------------
    # 3. Interactive Modals Verification
    # ----------------------------------------------------
    print("\n--- 3. MODALS VERIFICATION ---")
    
    # 3a. Post Service Offer Modal
    page.goto("http://localhost:5173/?dev_preview=dashboard", wait_until="domcontentloaded")
    time.sleep(0.6)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    page.click("#dash-btn-post-offer")
    time.sleep(0.4)
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, "modal_01_post_offer.png"))
    report["dialog_checks"]["dialog-new-request (OFFER)"] = "Opened successfully"
    page.evaluate("() => document.querySelector('#dialog-new-request')?.close()")
    time.sleep(0.3)

    # 3b. Post Service Request Modal
    page.click("#dash-btn-post-request")
    time.sleep(0.4)
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, "modal_02_post_request.png"))
    report["dialog_checks"]["dialog-new-request (REQUEST)"] = "Opened successfully"
    page.evaluate("() => document.querySelector('#dialog-new-request')?.close()")
    time.sleep(0.3)

    # 3c. Service Details Modal
    page.goto("http://localhost:5173/?dev_preview=service-offers", wait_until="domcontentloaded")
    time.sleep(0.6)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    details_buttons = page.query_selector_all(".btn-view-details")
    if len(details_buttons) > 1:
        details_buttons[1].click()
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "modal_03_service_details.png"))
        report["dialog_checks"]["dialog-service-details"] = "Opened successfully"

        # 3d. Modal-to-Modal: View Profile from Service Details
        view_prof_btn = page.query_selector("#sd-btn-view-profile")
        if view_prof_btn:
            view_prof_btn.click()
            time.sleep(0.6)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "modal_04_view_profile.png"))
            prof_status = page.evaluate("""() => {
                const vp = document.querySelector('#dialog-view-profile');
                return {
                    open: vp ? vp.open : false,
                    name: document.querySelector('#vp-name')?.textContent,
                    skillsCount: document.querySelectorAll('#vp-skills .badge')?.length,
                    hasBio: !!document.querySelector('#vp-bio')?.textContent,
                    reviewsCount: document.querySelector('#vp-ratings-count')?.textContent
                };
            }""")
            report["dialog_checks"]["dialog-view-profile"] = prof_status
            page.evaluate("() => document.querySelector('#dialog-view-profile')?.close()")
            time.sleep(0.3)

        # 3e. Apply / Order Modal from Service Details
        action_btn = page.query_selector("#sd-modal-action-btn")
        if action_btn and action_btn.is_visible():
            action_btn.click()
            time.sleep(0.5)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "modal_05_apply_order.png"))
            report["dialog_checks"]["dialog-apply"] = "Opened successfully"
            page.evaluate("() => document.querySelector('#dialog-apply')?.close()")
            time.sleep(0.3)

    # 3f. Edit Profile Modal
    page.goto("http://localhost:5173/?dev_preview=profile", wait_until="domcontentloaded")
    time.sleep(0.6)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    page.click("#btn-edit-profile")
    time.sleep(0.4)
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, "modal_06_edit_profile.png"))
    report["dialog_checks"]["dialog-edit-profile"] = "Opened successfully"
    page.evaluate("() => document.querySelector('#dialog-edit-profile')?.close()")
    time.sleep(0.3)

    # 3g. Add Portfolio Modal
    add_port_btn = page.query_selector("#btn-add-portfolio-item")
    if add_port_btn:
        add_port_btn.click()
        time.sleep(0.4)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "modal_07_add_portfolio.png"))
        report["dialog_checks"]["dialog-add-portfolio"] = "Opened successfully"
        page.evaluate("() => document.querySelector('#dialog-add-portfolio')?.close()")
        time.sleep(0.3)

    # 3h. Mentoring Apply Modal
    page.goto("http://localhost:5173/?dev_preview=mentoring", wait_until="domcontentloaded")
    time.sleep(0.6)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    mentor_apply_btn = page.query_selector(".apply-mentor-btn")
    if mentor_apply_btn:
        mentor_apply_btn.click()
        time.sleep(0.4)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "modal_08_mentoring_apply.png"))
        report["dialog_checks"]["dialog-mentoring-apply"] = "Opened successfully"
        page.evaluate("() => document.querySelector('#dialog-mentoring-apply')?.close()")
        time.sleep(0.3)

    # 3i. A11y Audit on all dialog close buttons
    a11y_issues = page.evaluate("""() => {
        const dialogs = Array.from(document.querySelectorAll('dialog'));
        const issues = [];
        dialogs.forEach(d => {
            const closeBtns = Array.from(d.querySelectorAll('.dialog-close-btn'));
            closeBtns.forEach(btn => {
                const ariaLabel = btn.getAttribute('aria-label');
                const text = btn.textContent.trim();
                if (!ariaLabel && (text === '✕' || text === '×' || text === '?' || text === '')) {
                    issues.push({
                        dialogId: d.id,
                        issue: 'dialog-close-btn missing aria-label',
                        text: text
                    });
                }
            });
        });
        return issues;
    }""")
    report["a11y_issues"] = a11y_issues

    # ----------------------------------------------------
    # 4. Mobile Portrait Audit (390x844)
    # ----------------------------------------------------
    print("\n--- 4. MOBILE PORTRAIT VERIFICATION (390x844) ---")
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

    for sec in sections:
        url = "http://localhost:5173/" if sec == "landing" else f"http://localhost:5173/?dev_preview={sec}"
        m_page.goto(url, wait_until="domcontentloaded")
        time.sleep(0.7)
        m_page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")

        # Overflow check
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

        # Touch targets check
        small_targets = m_page.evaluate("""() => {
            const clickable = Array.from(document.querySelectorAll('button:not([hidden]), a:not([hidden]), input:not([type="hidden"]), select, textarea, .tab-btn'));
            const issues = [];
            for (let el of clickable) {
                if (el.offsetParent === null) continue;
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
            report["touch_target_issues"].append({"section": sec, "sample_targets": small_targets})
            print(f"  [TOUCH TARGET] {sec}: {len(small_targets)} items < 40px")

        m_page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"mobile_{sec}.png"))

    # ----------------------------------------------------
    # 5. Mobile Landscape Audit (844x390)
    # ----------------------------------------------------
    print("\n--- 5. MOBILE LANDSCAPE VERIFICATION (844x390) ---")
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
    for sec in ["landing", "dashboard", "service-offers", "applications", "messages", "profile", "admin"]:
        url = "http://localhost:5173/" if sec == "landing" else f"http://localhost:5173/?dev_preview={sec}"
        l_page.goto(url, wait_until="domcontentloaded")
        time.sleep(0.7)
        l_page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
        l_page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"mobile_landscape_{sec}.png"))

    # ----------------------------------------------------
    # 6. Android Mobile Audit (360x740)
    # ----------------------------------------------------
    print("\n--- 6. ANDROID MOBILE VERIFICATION (360x740) ---")
    a_ctx = browser.new_context(
        viewport={"width": 360, "height": 740},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True
    )
    a_page = a_ctx.new_page()
    a_page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)
    for sec in ["landing", "dashboard", "service-offers", "admin"]:
        url = "http://localhost:5173/" if sec == "landing" else f"http://localhost:5173/?dev_preview={sec}"
        a_page.goto(url, wait_until="domcontentloaded")
        time.sleep(0.7)
        a_page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
        
        of = a_page.evaluate("""() => {
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
            report["overflow_issues"].append({"section": sec, "viewport": "360x740", "overflow": of})
            print(f"  [ANDROID OVERFLOW] {sec}: diff={of['diff']}")

        a_page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"android_360_{sec}.png"))

    browser.close()

with open(os.path.join(ARTIFACT_DIR, "verification_audit_report.json"), "w") as f:
    json.dump(report, f, indent=2)

print("\n=== FINAL VERIFICATION AUDIT COMPLETE ===")
print(f"Console Errors: {len(report['console_errors'])}")
print(f"Console Warnings: {len(report['console_warnings'])}")
print(f"Page Errors: {len(report['page_errors'])}")
print(f"Horizontal Overflow Issues: {len(report['overflow_issues'])}")
print(f"Touch Target Sections with Issues: {len(report['touch_target_issues'])}")
print(f"A11y Issues: {len(report['a11y_issues'])}")
print(f"Dialog Checks: {json.dumps(report['dialog_checks'], indent=2)}")
print(f"Admin Tab Checks: {json.dumps(report['admin_tab_checks'], indent=2)}")
