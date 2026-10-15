from playwright.sync_api import sync_playwright
import time
import os
import json

ARTIFACT_DIR = r"C:\Users\charles\.gemini\antigravity\brain\005de9c5-5a8d-44d8-8141-ca34dd20c12b"
SCREENSHOT_DIR = os.path.join(ARTIFACT_DIR, "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

audit_report = {
    "console_errors": [],
    "console_warnings": [],
    "page_errors": [],
    "tab_results": {},
    "dialog_results": {},
    "feature_results": {},
    "responsive_results": {}
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
    
    # --- Desktop Context (1366x900) ---
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

    # 1. Landing Page Test
    print("Testing Landing Page...")
    try:
        page.goto("http://localhost:5173/", wait_until="domcontentloaded", timeout=15000)
        time.sleep(1)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_landing.png"))
        audit_report["tab_results"]["landing"] = "OK"
    except Exception as e:
        audit_report["tab_results"]["landing"] = str(e)

    # 2. Tabs Test
    for sec in sections:
        print(f"Testing Tab: {sec}...")
        url = f"http://localhost:5173/?dev_preview={sec}"
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=15000)
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
            
            time.sleep(0.5)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"desktop_tab_{sec}.png"))
            audit_report["tab_results"][sec] = "OK"
        except Exception as e:
            audit_report["tab_results"][sec] = str(e)
            print(f"Tab error on {sec}: {e}")

    # 3. Interactive Modals on Desktop
    print("Testing Interactive Modals...")
    # Modal: New Service Offer
    try:
        page.goto("http://localhost:5173/?dev_preview=service-offers", wait_until="domcontentloaded")
        page.wait_for_selector("#btn-post-offer", timeout=5000)
        page.click("#btn-post-offer")
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_modal_new_service_offer.png"))
        page.evaluate("() => { const d = document.querySelector('#dialog-new-request'); if(d && d.open) d.close(); }")
        audit_report["dialog_results"]["new_service_offer"] = "OK"
    except Exception as e:
        audit_report["dialog_results"]["new_service_offer"] = str(e)

    # Modal: New Service Request
    try:
        page.goto("http://localhost:5173/?dev_preview=service-requests", wait_until="domcontentloaded")
        page.wait_for_selector("#btn-post-request", timeout=5000)
        page.click("#btn-post-request")
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_modal_new_service_request.png"))
        page.evaluate("() => { const d = document.querySelector('#dialog-new-request'); if(d && d.open) d.close(); }")
        audit_report["dialog_results"]["new_service_request"] = "OK"
    except Exception as e:
        audit_report["dialog_results"]["new_service_request"] = str(e)

    # Modal: Service Details (Populated from real listing)
    try:
        page.goto("http://localhost:5173/?dev_preview=service-offers", wait_until="domcontentloaded")
        page.wait_for_selector(".btn-view-details", timeout=5000)
        page.click(".btn-view-details")
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_modal_service_details.png"))
        page.evaluate("() => document.querySelector('#dialog-service-details')?.close()")
        audit_report["dialog_results"]["service_details"] = "OK"
    except Exception as e:
        audit_report["dialog_results"]["service_details"] = str(e)

    # Modal: Edit Profile
    try:
        page.goto("http://localhost:5173/?dev_preview=profile", wait_until="domcontentloaded")
        page.wait_for_selector("#btn-edit-profile", timeout=5000)
        page.click("#btn-edit-profile")
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_modal_edit_profile.png"))
        page.evaluate("() => document.querySelector('#dialog-edit-profile')?.close()")
        audit_report["dialog_results"]["edit_profile"] = "OK"
    except Exception as e:
        audit_report["dialog_results"]["edit_profile"] = str(e)

    # Modal: Add Portfolio
    try:
        page.wait_for_selector("#btn-add-portfolio-item", timeout=5000)
        page.click("#btn-add-portfolio-item")
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_modal_add_portfolio.png"))
        page.evaluate("() => document.querySelector('#dialog-add-portfolio')?.close()")
        audit_report["dialog_results"]["add_portfolio"] = "OK"
    except Exception as e:
        audit_report["dialog_results"]["add_portfolio"] = str(e)

    # 4. Interactive Header Features (Search dropdown, Notifications, Account menu)
    print("Testing Interactive Header Elements...")
    try:
        page.goto("http://localhost:5173/?dev_preview=dashboard", wait_until="domcontentloaded")
        time.sleep(0.5)
        
        # Search dropdown
        page.fill("#workspace-search", "3D")
        time.sleep(0.4)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_search_dropdown.png"))
        page.click("#workspace-search-clear")
        audit_report["feature_results"]["search_dropdown"] = "OK"

        # Notification dropdown
        page.click(".btn-notification-bell")
        time.sleep(0.4)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_notifications_dropdown.png"))
        page.click(".btn-notification-bell")

        # Account menu
        page.click(".account-toggle")
        time.sleep(0.4)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_account_menu.png"))
        page.click(".account-toggle")
        audit_report["feature_results"]["header_menus"] = "OK"
    except Exception as e:
        audit_report["feature_results"]["header_menus"] = str(e)

    # --- Mobile Portrait Context (390x844) ---
    print("Testing Mobile Portrait (390x844)...")
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
            time.sleep(0.5)
            m_page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"mobile_portrait_{sec}.png"))
            audit_report["responsive_results"][f"mobile_{sec}"] = "OK"
        except Exception as e:
            audit_report["responsive_results"][f"mobile_{sec}"] = str(e)

    # Test Mobile Sidebar Drawer
    try:
        m_page.goto("http://localhost:5173/?dev_preview=dashboard", wait_until="domcontentloaded")
        time.sleep(0.5)
        m_page.evaluate("() => document.querySelector('.workspace-menu')?.click()")
        time.sleep(0.5)
        m_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "mobile_sidebar_drawer.png"))
        audit_report["responsive_results"]["sidebar_drawer"] = "OK"
    except Exception as e:
        audit_report["responsive_results"]["sidebar_drawer"] = str(e)

    # --- Mobile Landscape Context (844x390) ---
    print("Testing Mobile Landscape (844x390)...")
    landscape_context = browser.new_context(
        viewport={"width": 844, "height": 390},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True
    )
    l_page = landscape_context.new_page()
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
            time.sleep(0.5)
            l_page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"mobile_landscape_{sec}.png"))
            audit_report["responsive_results"][f"landscape_{sec}"] = "OK"
        except Exception as e:
            audit_report["responsive_results"][f"landscape_{sec}"] = str(e)

    browser.close()

with open(os.path.join(ARTIFACT_DIR, "audit_summary.json"), "w") as f:
    json.dump(audit_report, f, indent=2)

print("\n=== COMPREHENSIVE AUDIT COMPLETE ===")
print(f"Total Console Errors: {len(audit_report['console_errors'])}")
print(f"Total Page Errors: {len(audit_report['page_errors'])}")
