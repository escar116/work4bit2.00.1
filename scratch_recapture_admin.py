from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page(viewport={"width": 1366, "height": 900})
    page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)
    page.goto("http://localhost:5173/?dev_preview=admin", wait_until="domcontentloaded")
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
    page.wait_for_function("() => document.querySelector('#admin-stat-registered')?.textContent !== '0'", timeout=5000)
    page.wait_for_timeout(400)
    page.screenshot(path="C:/Users/charles/.gemini/antigravity/brain/30f35ad9-b208-40ae-9182-314a8a9fd3bd/screenshots/desktop_full_admin.png", full_page=True)
    browser.close()
print("Recaptured desktop_full_admin.png successfully")
