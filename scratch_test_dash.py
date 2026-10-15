from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page(viewport={"width": 1366, "height": 900})
    page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)
    page.goto("http://localhost:5173/?dev_preview=dashboard", wait_until="domcontentloaded")
    time.sleep(1)
    has_board = page.evaluate("() => Boolean(document.querySelector('.db-board'))")
    print("Has db-board:", has_board)
    page.screenshot(path=r"C:\Users\charles\.gemini\antigravity\brain\005de9c5-5a8d-44d8-8141-ca34dd20c12b\screenshots\desktop_tab_dashboard.png")
    browser.close()
