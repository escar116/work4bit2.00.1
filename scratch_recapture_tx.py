from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    context = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    page = context.new_page()
    page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)
    page.goto("http://localhost:5173/?dev_preview=transactions", wait_until="domcontentloaded")
    page.wait_for_selector("#transactions-tbody tr", timeout=5000)
    page.wait_for_timeout(400)
    page.screenshot(path="C:/Users/charles/.gemini/antigravity/brain/30f35ad9-b208-40ae-9182-314a8a9fd3bd/screenshots/mobile_portrait_transactions.png")
    page.screenshot(path="C:/Users/charles/.gemini/antigravity/brain/30f35ad9-b208-40ae-9182-314a8a9fd3bd/screenshots/mobile_full_transactions.png", full_page=True)
    browser.close()
print("Recaptured mobile transactions screenshots successfully!")
