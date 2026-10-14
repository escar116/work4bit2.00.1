from playwright.sync_api import sync_playwright
import time
import os

CURRENT_ARTIFACT_DIR = r"C:\Users\charles\.gemini\antigravity\brain\edd6a75a-0958-4e2d-85cf-f8635302590a"
PREV_ARTIFACT_DIR = r"C:\Users\charles\.gemini\antigravity\brain\6caae866-4591-4aca-8440-cc45be20969d"
ALT_ARTIFACT_DIR = r"C:\Users\charles\.gemini\antigravity\brain\83773619-7a09-48a3-94d7-5484453086c6"

sections = [
    ("dashboard", "tab_1_dashboard.png"),
    ("service-offers", "tab_2_service_offers.png"),
    ("service-requests", "tab_3_service_requests.png"),
    ("mentoring", "tab_4_mentoring.png"),
    ("applications", "tab_5_applications.png"),
    ("messages", "tab_6_messages.png"),
    ("transactions", "tab_7_transactions.png"),
    ("logs", "tab_8_logs.png"),
    ("profile", "tab_9_profile.png"),
    ("admin", "tab_10_admin.png"),
]

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page(viewport={"width": 1366, "height": 900})
    page.set_default_navigation_timeout(25000)

    for section_id, filename in sections:
        print(f"Capturing section: {section_id}...")
        url = f"https://work4abit.vercel.app?dev_preview={section_id}"
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=25000)
            page.wait_for_selector(".main-content", timeout=12000)
            if section_id == "admin":
                try:
                    page.wait_for_function("() => document.querySelector('#admin-stat-registered')?.textContent !== '0'", timeout=8000)
                except Exception:
                    pass
            elif section_id == "messages":
                try:
                    page.wait_for_selector(".conversation-item", timeout=6000)
                except Exception:
                    pass
            elif section_id == "transactions":
                try:
                    page.wait_for_selector("#transactions-tbody tr", timeout=6000)
                except Exception:
                    pass
            time.sleep(2)
        except Exception as e:
            print(f"Wait note on {section_id}: {e}")
            time.sleep(2)
        
        # Save to current conversation artifact directory
        out_path = os.path.join(CURRENT_ARTIFACT_DIR, filename)
        page.screenshot(path=out_path)
        
        # Also mirror to other dirs if they exist
        for alt_dir in [PREV_ARTIFACT_DIR, ALT_ARTIFACT_DIR]:
            if os.path.exists(alt_dir):
                try:
                    page.screenshot(path=os.path.join(alt_dir, filename))
                except Exception:
                    pass
        print(f"Saved: {filename}")

    browser.close()
    print("All tabs captured successfully.")
