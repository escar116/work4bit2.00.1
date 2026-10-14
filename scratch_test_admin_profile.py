from playwright.sync_api import sync_playwright
import time

artifact_dir = r"C:\Users\charles\.gemini\antigravity\brain\2dcbce95-d155-4f78-82c5-cabf4dd81ced"

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page(viewport={"width": 1366, "height": 900})
    page.goto("http://127.0.0.1:5190?dev_preview=admin", wait_until="domcontentloaded")
    time.sleep(3)
    
    # Click 'All Registered Students' tab
    tab_btn = page.query_selector("[data-admintab='users']")
    if tab_btn:
        tab_btn.click()
        print("Clicked All Registered Students tab")
    time.sleep(2)
    
    # 1. Screenshot table with Profile button
    page.screenshot(path=f"{artifact_dir}/verify_admin_users_profile_btn.png")
    print("Screenshot 1 taken: admin table with Profile buttons")
    
    # 2. Click 'Profile' button of first row
    profile_btn = page.query_selector("#admin-all-users-tbody tr .view-profile-btn")
    if profile_btn:
        profile_btn.click()
        print("Clicked Profile button")
        time.sleep(2)
        page.screenshot(path=f"{artifact_dir}/verify_admin_opened_profile_view.png")
        print("Screenshot 2 taken: opened Profile View dialog")
        
        # Close dialog
        close_btn = page.query_selector("#dialog-view-profile .dialog-close-btn")
        if close_btn:
            close_btn.click()
            time.sleep(1)
            
    # 3. Click 'Details' button to check the Details dialog with View Profile
    details_btn = page.query_selector("#admin-all-users-tbody tr .view-info-btn")
    if details_btn:
        details_btn.click()
        print("Clicked Details button")
        time.sleep(1)
        page.screenshot(path=f"{artifact_dir}/verify_admin_details_modal_with_profile.png")
        print("Screenshot 3 taken: Details modal with View Profile")

    browser.close()
    print("Playwright test completed successfully")
