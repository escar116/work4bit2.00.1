import os
import json
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\charles\.gemini\antigravity\brain\30f35ad9-b208-40ae-9182-314a8a9fd3bd"
SCREENSHOT_DIR = os.path.join(ARTIFACT_DIR, "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

audit_report = {
    "console_errors": [],
    "console_warnings": [],
    "page_errors": [],
    "overflow_issues": [],
    "broken_images": [],
    "tab_results": {},
    "modal_results": {},
    "dark_mode_results": {},
    "mobile_results": {},
    "accessibility_issues": []
}

sections = [
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

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    
    # 1. Desktop Audit (1366x900)
    page = browser.new_page(viewport={"width": 1366, "height": 900})
    
    def on_console(msg):
        text = msg.text
        if msg.type == 'error':
            audit_report["console_errors"].append(text)
            print(f"[CONSOLE ERROR]: {text}")
        elif msg.type == 'warning':
            if "Could not sync" not in text and "favicon" not in text:
                audit_report["console_warnings"].append(text)

    def on_page_error(err):
        audit_report["page_errors"].append(str(err))
        print(f"[PAGE ERROR]: {err}")

    page.on("console", on_console)
    page.on("pageerror", on_page_error)
    page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)

    # Check Landing page
    print("Auditing Landing Page...")
    try:
        page.goto("http://localhost:5173/", wait_until="domcontentloaded")
        page.wait_for_timeout(1000)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_landing.png"))
        audit_report["tab_results"]["landing"] = "OK"
    except Exception as e:
        audit_report["tab_results"]["landing"] = str(e)

    # Check each tab in Desktop
    for sec in sections:
        print(f"Auditing Tab: {sec}...")
        url = f"http://localhost:5173/?dev_preview={sec}"
        try:
            page.goto(url, wait_until="domcontentloaded")
            page.wait_for_selector(".main-content", timeout=8000)
            page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
            
            if sec == "dashboard":
                page.wait_for_selector(".db-board", timeout=6000)
            elif sec == "admin":
                page.wait_for_function("() => document.querySelector('#admin-stat-registered')?.textContent !== '0'", timeout=4000)
            elif sec == "messages":
                page.wait_for_selector(".conversation-item", timeout=4000)
            elif sec == "transactions":
                page.wait_for_selector("#transactions-tbody tr", timeout=4000)
            
            page.wait_for_timeout(600)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"desktop_tab_{sec}.png"))
            audit_report["tab_results"][sec] = "OK"

            # Check overflow & broken images
            overflow = page.evaluate("""() => {
                const doc = document.documentElement;
                return {
                    scrollWidth: doc.scrollWidth,
                    clientWidth: doc.clientWidth,
                    hasOverflow: doc.scrollWidth > doc.clientWidth
                };
            }""")
            if overflow.get("hasOverflow"):
                audit_report["overflow_issues"].append(f"Desktop tab {sec}: scrollWidth {overflow['scrollWidth']} > clientWidth {overflow['clientWidth']}")

            broken_imgs = page.evaluate("""() => {
                const imgs = Array.from(document.querySelectorAll('img'));
                return imgs.filter(i => i.src && !i.complete || (i.complete && i.naturalWidth === 0)).map(i => i.src);
            }""")
            if broken_imgs:
                audit_report["broken_images"].extend([f"Tab {sec}: {src}" for src in broken_imgs])

        except Exception as e:
            audit_report["tab_results"][sec] = str(e)
            print(f"Tab error on {sec}: {e}")

    # Test Dark Mode toggle across key views
    print("Testing Dark Mode...")
    for sec in ["dashboard", "service-offers", "messages", "transactions", "admin", "profile"]:
        try:
            page.goto(f"http://localhost:5173/?dev_preview={sec}", wait_until="domcontentloaded")
            page.wait_for_selector(".main-content", timeout=8000)
            page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
            # Set dark mode
            page.evaluate("() => { document.body.classList.add('dark'); document.documentElement.setAttribute('data-theme', 'dark'); }")
            page.wait_for_timeout(500)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"desktop_dark_{sec}.png"))
            audit_report["dark_mode_results"][sec] = "OK"
        except Exception as e:
            audit_report["dark_mode_results"][sec] = str(e)

    # Revert dark mode
    page.evaluate("() => { document.body.classList.remove('dark'); document.documentElement.removeAttribute('data-theme'); }")

    # Modals test
    print("Testing Interactive Modals...")
    modals = [
        ("service-offers", "#btn-post-offer", "#dialog-new-request", "modal_new_service_offer"),
        ("service-requests", "#btn-post-request", "#dialog-new-request", "modal_new_service_request"),
        ("service-offers", ".btn-view-details", "#dialog-service-details", "modal_service_details"),
        ("profile", "#btn-edit-profile", "#dialog-edit-profile", "modal_edit_profile"),
        ("profile", "#btn-add-portfolio-item", "#dialog-add-portfolio", "modal_add_portfolio")
    ]

    for tab, trigger_sel, dialog_sel, name in modals:
        try:
            page.goto(f"http://localhost:5173/?dev_preview={tab}", wait_until="domcontentloaded")
            page.wait_for_selector(trigger_sel, timeout=6000)
            page.click(trigger_sel)
            page.wait_for_timeout(500)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"desktop_{name}.png"))
            page.evaluate(f"() => {{ const d = document.querySelector('{dialog_sel}'); if(d && d.open) d.close(); }}")
            audit_report["modal_results"][name] = "OK"
        except Exception as e:
            audit_report["modal_results"][name] = str(e)
            print(f"Modal error on {name}: {e}")

    # Header interactive menus (Search, Notification, Account)
    print("Testing Header Elements...")
    try:
        page.goto("http://localhost:5173/?dev_preview=dashboard", wait_until="domcontentloaded")
        page.wait_for_timeout(500)
        # Search dropdown
        page.fill("#workspace-search", "Design")
        page.wait_for_timeout(400)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_search_dropdown.png"))
        page.click("#workspace-search-clear")
        
        # Notification
        page.click(".btn-notification-bell")
        page.wait_for_timeout(400)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_notifications_dropdown.png"))
        page.click(".btn-notification-bell")

        # Account menu
        page.click(".account-toggle")
        page.wait_for_timeout(400)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_account_menu.png"))
        page.click(".account-toggle")
    except Exception as e:
        print(f"Header elements error: {e}")

    # Mobile Portrait (390x844)
    print("Auditing Mobile Portrait (390x844)...")
    mobile_context = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True
    )
    m_page = mobile_context.new_page()
    m_page.on("console", on_console)
    m_page.on("pageerror", on_page_error)
    m_page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)

    for sec in ["dashboard", "service-offers", "applications", "messages", "transactions", "admin", "profile"]:
        try:
            m_page.goto(f"http://localhost:5173/?dev_preview={sec}", wait_until="domcontentloaded")
            m_page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
            if sec == "dashboard":
                m_page.wait_for_selector(".db-board", timeout=6000)
            m_page.wait_for_timeout(500)
            m_page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"mobile_portrait_{sec}.png"))
            audit_report["mobile_results"][f"portrait_{sec}"] = "OK"

            # Check horizontal overflow on mobile
            overflow = m_page.evaluate("""() => {
                const doc = document.documentElement;
                return {
                    scrollWidth: doc.scrollWidth,
                    clientWidth: doc.clientWidth,
                    hasOverflow: doc.scrollWidth > doc.clientWidth
                };
            }""")
            if overflow.get("hasOverflow"):
                audit_report["overflow_issues"].append(f"Mobile portrait tab {sec}: scrollWidth {overflow['scrollWidth']} > clientWidth {overflow['clientWidth']}")

        except Exception as e:
            audit_report["mobile_results"][f"portrait_{sec}"] = str(e)

    # Mobile drawer open
    try:
        m_page.goto("http://localhost:5173/?dev_preview=dashboard", wait_until="domcontentloaded")
        m_page.wait_for_timeout(500)
        m_page.evaluate("() => document.querySelector('.workspace-menu')?.click()")
        m_page.wait_for_timeout(500)
        m_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "mobile_sidebar_drawer.png"))
        audit_report["mobile_results"]["sidebar_drawer"] = "OK"
    except Exception as e:
        audit_report["mobile_results"]["sidebar_drawer"] = str(e)

    # Mobile Landscape (844x390)
    print("Auditing Mobile Landscape (844x390)...")
    l_context = browser.new_context(
        viewport={"width": 844, "height": 390},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True
    )
    l_page = l_context.new_page()
    l_page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)
    for sec in ["dashboard", "messages"]:
        try:
            l_page.goto(f"http://localhost:5173/?dev_preview={sec}", wait_until="domcontentloaded")
            l_page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
            if sec == "dashboard":
                l_page.wait_for_selector(".db-board", timeout=6000)
            l_page.wait_for_timeout(500)
            l_page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"mobile_landscape_{sec}.png"))
            audit_report["mobile_results"][f"landscape_{sec}"] = "OK"
        except Exception as e:
            audit_report["mobile_results"][f"landscape_{sec}"] = str(e)

    browser.close()

with open(os.path.join(ARTIFACT_DIR, "audit_summary.json"), "w") as f:
    json.dump(audit_report, f, indent=2)

print("\n================ AUDIT SUMMARY ================")
print(f"Console Errors: {len(audit_report['console_errors'])}")
print(f"Console Warnings: {len(audit_report['console_warnings'])}")
print(f"Page Errors: {len(audit_report['page_errors'])}")
print(f"Horizontal Overflow Issues: {len(audit_report['overflow_issues'])}")
print(f"Broken Images: {len(audit_report['broken_images'])}")
if audit_report['overflow_issues']:
    for oi in audit_report['overflow_issues']:
        print("  -", oi)
if audit_report['broken_images']:
    for bi in audit_report['broken_images']:
        print("  -", bi)
if audit_report['console_errors']:
    for ce in audit_report['console_errors']:
        print("  -", ce)
