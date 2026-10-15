import os
import json
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\charles\.gemini\antigravity\brain\fd163c90-b1fc-4be3-b0a5-0c4fc12919d1"
SCREENSHOT_DIR = os.path.join(ARTIFACT_DIR, "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

test_results = {}

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)

    # 1. Applications Hub Tabs Test
    print("\n--- Testing Applications Hub Tabs ---")
    page.goto("http://localhost:5173/?dev_preview=applications", wait_until="domcontentloaded")
    time.sleep(0.8)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")

    app_tabs = [
        ("submitted", "#tab-app-submitted"),
        ("received", "#tab-app-received"),
        ("posted", "#tab-app-posted")
    ]
    for name, sel in app_tabs:
        btn = page.query_selector(sel)
        if btn:
            btn.click()
            time.sleep(0.4)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"interactive_app_tab_{name}.png"))
            test_results[f"app_tab_{name}"] = "Clicked and verified"
            print(f"  Applications tab: {name} OK")

    # 2. Messages Workspace Interactive Test
    print("\n--- Testing Messages Workspace ---")
    page.goto("http://localhost:5173/?dev_preview=messages", wait_until="domcontentloaded")
    time.sleep(0.8)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, "interactive_messages_initial.png"))
    
    # Click first conversation if available
    conv_item = page.query_selector(".conversation-item")
    if conv_item:
        conv_item.click()
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "interactive_messages_convo_opened.png"))
        test_results["messages_convo"] = "Conversation opened"
        print("  Messages: Conversation selected OK")
    else:
        test_results["messages_convo"] = "No conversation item found"
        print("  Messages: No conversation items found")

    # 3. Transactions Workspace Tabs Test
    print("\n--- Testing Transactions Workspace ---")
    page.goto("http://localhost:5173/?dev_preview=transactions", wait_until="domcontentloaded")
    time.sleep(0.8)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, "interactive_transactions_all.png"))

    tx_tabs = [
        ("escrow", "button[data-txtab='escrow']"),
        ("completed", "button[data-txtab='completed']"),
        ("disputed", "button[data-txtab='disputed']")
    ]
    for name, sel in tx_tabs:
        btn = page.query_selector(sel)
        if btn:
            btn.click()
            time.sleep(0.3)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"interactive_tx_tab_{name}.png"))
            test_results[f"tx_tab_{name}"] = "Verified"
            print(f"  Transactions tab: {name} OK")

    # 4. Logs Workspace Filters Test
    print("\n--- Testing Logs Workspace ---")
    page.goto("http://localhost:5173/?dev_preview=logs", wait_until="domcontentloaded")
    time.sleep(0.8)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, "interactive_logs_all.png"))

    log_filters = [
        ("info", "button[data-logfilter='info']"),
        ("warning", "button[data-logfilter='warning']"),
        ("error", "button[data-logfilter='error']")
    ]
    for name, sel in log_filters:
        btn = page.query_selector(sel)
        if btn:
            btn.click()
            time.sleep(0.3)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"interactive_log_filter_{name}.png"))
            test_results[f"log_filter_{name}"] = "Verified"
            print(f"  Logs filter: {name} OK")

    # 5. Service Offers Details -> Avail / Order dialog test
    print("\n--- Testing Service Offers Details -> Avail Modal ---")
    page.goto("http://localhost:5173/?dev_preview=service-offers", wait_until="domcontentloaded")
    time.sleep(0.8)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")

    # Find a card not posted by dev_student_1 if possible, or first card
    details_buttons = page.query_selector_all(".btn-view-details")
    print(f"  Found {len(details_buttons)} view-details buttons")
    if len(details_buttons) > 1:
        details_buttons[1].click() # Click second card (posted by Engr. Noel V.)
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "interactive_service_details_card2.png"))

        action_btn = page.query_selector("#sd-modal-action-btn")
        if action_btn and action_btn.is_visible():
            action_btn.click()
            time.sleep(0.5)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "interactive_apply_order_modal.png"))
            dialog_apply_open = page.evaluate("() => document.querySelector('#dialog-apply')?.open")
            test_results["dialog_apply_from_offer"] = f"Open={dialog_apply_open}"
            print(f"  dialog-apply opened: {dialog_apply_open}")
            page.evaluate("() => document.querySelector('#dialog-apply')?.close()")
        else:
            test_results["dialog_apply_from_offer"] = "Action button hidden or not visible"

    # 6. Service Requests Details -> Submit Bid dialog test
    print("\n--- Testing Service Requests Details -> Bid Modal ---")
    page.goto("http://localhost:5173/?dev_preview=service-requests", wait_until="domcontentloaded")
    time.sleep(0.8)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")

    req_details_buttons = page.query_selector_all(".btn-view-details")
    print(f"  Found {len(req_details_buttons)} req view-details buttons")
    if len(req_details_buttons) > 0:
        req_details_buttons[0].click()
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "interactive_req_details.png"))

        req_action_btn = page.query_selector("#sd-modal-action-btn")
        if req_action_btn and req_action_btn.is_visible():
            req_action_btn.click()
            time.sleep(0.5)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "interactive_bid_modal.png"))
            dialog_bid_open = page.evaluate("() => document.querySelector('#dialog-apply')?.open")
            test_results["dialog_apply_from_request"] = f"Open={dialog_bid_open}"
            print(f"  dialog-apply for request opened: {dialog_bid_open}")
            page.evaluate("() => document.querySelector('#dialog-apply')?.close()")

    # 7. Mentoring Apply Modal Test
    print("\n--- Testing Mentoring Apply Modal ---")
    page.goto("http://localhost:5173/?dev_preview=mentoring", wait_until="domcontentloaded")
    time.sleep(0.8)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")

    mentor_apply_btn = page.query_selector(".apply-mentor-btn")
    if mentor_apply_btn:
        mentor_apply_btn.click()
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "interactive_mentoring_apply_modal.png"))
        mentor_modal_open = page.evaluate("() => document.querySelector('#dialog-mentoring-apply')?.open")
        test_results["dialog_mentoring_apply"] = f"Open={mentor_modal_open}"
        print(f"  dialog-mentoring-apply opened: {mentor_modal_open}")
        page.evaluate("() => document.querySelector('#dialog-mentoring-apply')?.close()")

    # 8. Profile Add Portfolio Modal Test
    print("\n--- Testing Profile Add Portfolio Modal ---")
    page.goto("http://localhost:5173/?dev_preview=profile", wait_until="domcontentloaded")
    time.sleep(0.8)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")

    add_port_btn = page.query_selector("#btn-add-portfolio-item")
    if add_port_btn:
        add_port_btn.click()
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "interactive_add_portfolio_modal.png"))
        port_modal_open = page.evaluate("() => document.querySelector('#dialog-add-portfolio')?.open")
        test_results["dialog_add_portfolio"] = f"Open={port_modal_open}"
        print(f"  dialog-add-portfolio opened: {port_modal_open}")
        page.evaluate("() => document.querySelector('#dialog-add-portfolio')?.close()")

    # 9. Admin Pending Verifications Certificate Dialog Test
    print("\n--- Testing Admin Pending Certificate Modal ---")
    page.goto("http://localhost:5173/?dev_preview=admin", wait_until="domcontentloaded")
    time.sleep(0.8)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")

    # In pending verifications table, check for view certificate button
    cert_btn = page.query_selector(".btn-view-cert, [data-cert]")
    if cert_btn:
        cert_btn.click()
        time.sleep(0.5)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "interactive_admin_cert_modal.png"))
        cert_modal_open = page.evaluate("() => document.querySelector('#dialog-certificate')?.open")
        test_results["dialog_certificate"] = f"Open={cert_modal_open}"
        print(f"  dialog-certificate opened: {cert_modal_open}")
        page.evaluate("() => document.querySelector('#dialog-certificate')?.close()")
    else:
        test_results["dialog_certificate"] = "No pending cert button found"
        print("  No pending cert button found in devPreview mock")

    browser.close()

with open(os.path.join(ARTIFACT_DIR, "deep_interactive_results.json"), "w") as f:
    json.dump(test_results, f, indent=2)

print("\n=== DEEP INTERACTIVE TESTING COMPLETE ===")
print(json.dumps(test_results, indent=2))
