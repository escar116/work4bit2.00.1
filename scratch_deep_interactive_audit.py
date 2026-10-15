import os
import json
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\charles\.gemini\antigravity\brain\d907ccf9-a33e-448a-adce-03c018fedb56"
SCREENSHOT_DIR = os.path.join(ARTIFACT_DIR, "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

test_results = {
    "console_errors": [],
    "console_warnings": [],
    "page_errors": [],
    "interactivity": {}
}

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page(viewport={"width": 1366, "height": 900})
    
    def on_console(msg):
        text = msg.text
        if msg.type == 'error':
            test_results["console_errors"].append(text)
            print(f"[CONSOLE ERROR]: {text}")
        elif msg.type == 'warning':
            if "Could not sync" not in text and "favicon" not in text:
                test_results["console_warnings"].append(text)

    def on_page_error(err):
        test_results["page_errors"].append(str(err))
        print(f"[PAGE ERROR]: {err}")

    page.on("console", on_console)
    page.on("pageerror", on_page_error)
    page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)

    # 1. Test Admin Tabs Switching
    print("Testing Admin Tabs Switching...")
    try:
        page.goto("http://localhost:5173/?dev_preview=admin", wait_until="domcontentloaded")
        page.wait_for_function("() => document.querySelector('#admin-stat-registered')?.textContent !== '0'", timeout=5000)
        page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
        
        admin_tabs = [
            ("tab-admin-pending", "Pending Verifications"),
            ("tab-admin-registered", "Registered Students"),
            ("tab-admin-applications", "Applications & Bids"),
            ("tab-admin-live-requests", "Live Services"),
            ("tab-admin-audit-logs", "Audit Logs")
        ]
        for tab_id, tab_label in admin_tabs:
            btn = page.query_selector(f"#{tab_id}")
            if btn:
                btn.click()
                time.sleep(0.3)
                test_results["interactivity"][f"admin_{tab_id}"] = "OK"
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_admin_tabs_audit_logs.png"))
    except Exception as e:
        test_results["interactivity"]["admin_tabs"] = str(e)

    # 2. Test Transactions Status Filter Pills
    print("Testing Transactions Tabs...")
    try:
        page.goto("http://localhost:5173/?dev_preview=transactions", wait_until="domcontentloaded")
        page.wait_for_selector("#transactions-tbody tr", timeout=5000)
        page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
        
        page.click("button[data-filter='pending']")
        time.sleep(0.3)
        page.click("button[data-filter='completed']")
        time.sleep(0.3)
        page.click("button[data-filter='all']")
        time.sleep(0.3)
        test_results["interactivity"]["transactions_filter"] = "OK"
    except Exception as e:
        test_results["interactivity"]["transactions_filter"] = str(e)

    # 3. Test Applications Hub Tabs
    print("Testing Applications Hub Tabs...")
    try:
        page.goto("http://localhost:5173/?dev_preview=applications", wait_until="domcontentloaded")
        page.wait_for_selector("#applications-marketplace-tabs", timeout=5000)
        page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
        
        # Click Applied
        page.click("#tab-app-applied")
        time.sleep(0.4)
        test_results["interactivity"]["applications_tab_applied"] = "OK"
        # Click Mentoring
        page.click("#tab-app-mentoring")
        time.sleep(0.4)
        test_results["interactivity"]["applications_tab_mentoring"] = "OK"
        # Click Posted
        page.click("#tab-app-posted")
        time.sleep(0.4)
        test_results["interactivity"]["applications_tab_posted"] = "OK"
    except Exception as e:
        test_results["interactivity"]["applications_tabs"] = str(e)

    # 4. Test Activity Logs Filter Pills & Search
    print("Testing Activity Logs Filters...")
    try:
        page.goto("http://localhost:5173/?dev_preview=logs", wait_until="domcontentloaded")
        page.wait_for_selector(".logs-category-pills", timeout=5000)
        page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
        
        sec_pill = page.query_selector("button[data-log-cat='security']")
        if sec_pill:
            sec_pill.click()
            time.sleep(0.3)
            test_results["interactivity"]["logs_filter_pill_security"] = "OK"
        
        page.fill("#logs-search-input", "Charles")
        time.sleep(0.3)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_logs_filtered.png"))
        test_results["interactivity"]["logs_search"] = "OK"
    except Exception as e:
        test_results["interactivity"]["logs_filter"] = str(e)

    # 5. Test Mentoring Hub search & cards
    print("Testing Mentoring Hub...")
    try:
        page.goto("http://localhost:5173/?dev_preview=mentoring", wait_until="domcontentloaded")
        page.wait_for_selector("#mentoring-users-grid .job-card", timeout=5000)
        page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
        
        page.fill("#mentoring-search-input", "Hardware")
        time.sleep(0.3)
        test_results["interactivity"]["mentoring_search"] = "OK"
    except Exception as e:
        test_results["interactivity"]["mentoring_search"] = str(e)

    # 6. Test Service Offers details modal
    print("Testing Service Offers details modal...")
    try:
        page.goto("http://localhost:5173/?dev_preview=service-offers", wait_until="domcontentloaded")
        page.wait_for_selector(".btn-view-details", timeout=5000)
        page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
        
        page.click(".btn-view-details")
        time.sleep(0.5)
        details_title = page.evaluate("() => document.querySelector('#sd-modal-title')?.textContent")
        test_results["interactivity"]["service_details_title"] = details_title
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "desktop_modal_service_details.png"))
        page.evaluate("() => document.querySelector('#dialog-service-details')?.close()")
        test_results["interactivity"]["service_details_dialog"] = "OK"
    except Exception as e:
        test_results["interactivity"]["service_details_dialog"] = str(e)

    # 7. Test Mobile Sidebar Drawer Open / Close
    print("Testing Mobile Drawer open/close...")
    m_ctx = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    m_page = m_ctx.new_page()
    m_page.on("console", on_console)
    m_page.on("pageerror", on_page_error)
    m_page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)
    try:
        m_page.goto("http://localhost:5173/?dev_preview=dashboard", wait_until="domcontentloaded")
        time.sleep(0.5)
        m_page.evaluate("() => document.querySelector('.workspace-menu')?.click()")
        time.sleep(0.4)
        is_open = m_page.evaluate("() => document.querySelector('#sidebar')?.classList.contains('sidebar-open')")
        test_results["interactivity"]["mobile_drawer_open"] = bool(is_open)
        m_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "mobile_sidebar_drawer.png"))
        
        # Close via close button or overlay
        m_page.evaluate("() => document.querySelector('#sidebar-close-btn')?.click()")
        time.sleep(0.3)
        is_closed = m_page.evaluate("() => !document.querySelector('#sidebar')?.classList.contains('sidebar-open')")
        test_results["interactivity"]["mobile_drawer_closed"] = bool(is_closed)
    except Exception as e:
        test_results["interactivity"]["mobile_drawer"] = str(e)

    browser.close()

with open(os.path.join(ARTIFACT_DIR, "deep_interactive_summary.json"), "w") as f:
    json.dump(test_results, f, indent=2)

print("\n=== DEEP INTERACTIVE AUDIT COMPLETE ===")
print(f"Console Errors: {len(test_results['console_errors'])}")
print(f"Console Warnings: {len(test_results['console_warnings'])}")
print(f"Page Errors: {len(test_results['page_errors'])}")
print("Interactivity Results:", json.dumps(test_results["interactivity"], indent=2))
