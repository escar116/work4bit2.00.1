from playwright.sync_api import sync_playwright
import time
import os

ARTIFACT_DIR = r"C:\Users\charles\.gemini\antigravity\brain\99bbb9a9-8bb4-4e35-8e85-c6f15d42cd57\mobile_interactive_audit"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    context = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True
    )
    page = context.new_page()
    page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)

    # 1. Sidebar open via .workspace-menu
    print("Testing workspace sidebar drawer...")
    page.goto("http://localhost:5173/?dev_preview=dashboard", wait_until="domcontentloaded")
    page.wait_for_timeout(1000)
    page.evaluate("() => document.querySelector('.workspace-menu')?.click()")
    page.wait_for_timeout(500)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "1_sidebar_drawer_open.png"))

    # 2. Account dropdown
    print("Testing account menu...")
    page.evaluate("() => document.querySelector('#sidebar-close-btn')?.click()")
    page.wait_for_timeout(300)
    page.evaluate("() => document.querySelector('.account-toggle')?.click()")
    page.wait_for_timeout(500)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "2_account_menu_open.png"))

    # 3. Notification dropdown
    print("Testing notifications dropdown...")
    page.evaluate("() => document.querySelector('.account-toggle')?.click()")
    page.wait_for_timeout(300)
    page.evaluate("() => document.querySelector('.btn-notification-bell')?.click()")
    page.wait_for_timeout(500)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "3_notification_dropdown_open.png"))

    # 4. Filter dropdown on service offers
    print("Testing filters button...")
    page.goto("http://localhost:5173/?dev_preview=service-offers", wait_until="domcontentloaded")
    page.wait_for_timeout(1000)
    page.evaluate("() => document.querySelector('#btn-toggle-filters')?.click()")
    page.wait_for_timeout(500)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "4_filters_expanded.png"))

    # 5. New Service Offer Modal
    print("Testing dialog-new-request...")
    page.evaluate("() => document.querySelector('#btn-post-service-offer')?.click()")
    page.wait_for_timeout(500)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "5_dialog_new_request.png"))

    # 6. Service Details Dialog
    print("Testing dialog-service-details...")
    page.goto("http://localhost:5173/?dev_preview=service-offers", wait_until="domcontentloaded")
    page.wait_for_timeout(1000)
    page.evaluate("() => { const d = document.querySelector('#dialog-service-details'); if (d) d.showModal(); }")
    page.wait_for_timeout(500)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "6_dialog_service_details.png"))

    # 7. Edit Profile Dialog
    print("Testing dialog-edit-profile...")
    page.goto("http://localhost:5173/?dev_preview=profile", wait_until="domcontentloaded")
    page.wait_for_timeout(1000)
    page.evaluate("() => document.querySelector('#btn-edit-profile')?.click()")
    page.wait_for_timeout(500)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "7_dialog_edit_profile.png"))

    # 8. Add Portfolio Dialog
    print("Testing dialog-add-portfolio...")
    page.evaluate("() => { document.querySelector('#dialog-edit-profile')?.close(); }")
    page.wait_for_timeout(300)
    page.evaluate("() => document.querySelector('#btn-add-portfolio-item')?.click()")
    page.wait_for_timeout(500)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "8_dialog_add_portfolio.png"))

    # 9. Landscape test
    print("Testing Landscape 844x390...")
    context_landscape = browser.new_context(
        viewport={"width": 844, "height": 390},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True
    )
    page_l = context_landscape.new_page()
    page_l.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)
    page_l.goto("http://localhost:5173/?dev_preview=dashboard", wait_until="domcontentloaded")
    page_l.wait_for_timeout(1000)
    page_l.screenshot(path=os.path.join(ARTIFACT_DIR, "9_dashboard_landscape.png"))

    page_l.goto("http://localhost:5173/?dev_preview=messages", wait_until="domcontentloaded")
    page_l.wait_for_timeout(1000)
    page_l.screenshot(path=os.path.join(ARTIFACT_DIR, "10_messages_landscape.png"))

    browser.close()
    print("Interactive mobile audit complete.")
