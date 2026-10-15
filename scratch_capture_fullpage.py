import os
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\charles\.gemini\antigravity\brain\30f35ad9-b208-40ae-9182-314a8a9fd3bd\screenshots"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

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
    
    # 1. Desktop Full-Page (1366px wide)
    page = browser.new_page(viewport={"width": 1366, "height": 900})
    page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)
    for sec in sections:
        url = f"http://localhost:5173/?dev_preview={sec}"
        page.goto(url, wait_until="domcontentloaded")
        page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
        if sec == "profile":
            try:
                page.wait_for_selector("#profile-skel.is-revealed", timeout=4000)
            except Exception:
                pass
        elif sec == "admin":
            try:
                page.wait_for_function("() => document.querySelector('#admin-stat-registered')?.textContent !== '0'", timeout=4000)
            except Exception:
                pass
        page.wait_for_timeout(400)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, f"desktop_full_{sec}.png"), full_page=True)

    # 2. Mobile Full-Page (390px wide)
    m_ctx = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    m_page = m_ctx.new_page()
    m_page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)
    for sec in sections:
        url = f"http://localhost:5173/?dev_preview={sec}"
        m_page.goto(url, wait_until="domcontentloaded")
        m_page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
        if sec == "profile":
            try:
                m_page.wait_for_selector("#profile-skel.is-revealed", timeout=4000)
            except Exception:
                pass
        elif sec == "admin":
            try:
                m_page.wait_for_function("() => document.querySelector('#admin-stat-registered')?.textContent !== '0'", timeout=4000)
            except Exception:
                pass
        m_page.wait_for_timeout(400)
        m_page.screenshot(path=os.path.join(ARTIFACT_DIR, f"mobile_full_{sec}.png"), full_page=True)

    browser.close()

print("Full-page captures completed successfully!")
