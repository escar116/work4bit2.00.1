import os
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\charles\.gemini\antigravity\brain\d019a430-b423-43ba-a56c-2d66c8583165\screenshots"

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)
    
    # 1. Admin table scrolled
    page.goto("http://localhost:5173/?dev_preview=admin", wait_until="domcontentloaded")
    page.wait_for_timeout(500)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if (g && g.open) g.close(); }")
    page.evaluate("() => document.querySelector('#admin-management-tabs')?.scrollIntoView()")
    page.wait_for_timeout(300)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "06_admin_table_390.png"))

    # 2. Mentoring hub
    page.goto("http://localhost:5173/?dev_preview=mentoring", wait_until="domcontentloaded")
    page.wait_for_timeout(500)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if (g && g.open) g.close(); }")
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "06_mentoring_hub_390.png"))

    # 3. Landing how it works steps
    page.goto("http://localhost:5173/", wait_until="domcontentloaded")
    page.wait_for_timeout(500)
    page.evaluate("() => document.querySelector('#lp-steps')?.scrollIntoView({block: 'center'})")
    page.wait_for_timeout(300)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "05_landing_steps_centered_390.png"))

    browser.close()
print("Recaptured targeted views successfully!")
