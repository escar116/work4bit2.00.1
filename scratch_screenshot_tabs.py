from playwright.sync_api import sync_playwright
import time
import os

ARTIFACT_DIR = r"C:\Users\charles\.gemini\antigravity\brain\2dcbce95-d155-4f78-82c5-cabf4dd81ced"

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
    page.set_default_navigation_timeout(60000)

    for section_id, filename in sections:
        print(f"Capturing section: {section_id}...")
        url = f"https://work4abit.vercel.app?dev_preview={section_id}"
        try:
            page.goto(url, wait_until="networkidle", timeout=45000)
            time.sleep(1.8)
        except Exception as e:
            print(f"Navigation fallback on {section_id}: {e}")
            time.sleep(3)
        out_path = os.path.join(ARTIFACT_DIR, filename)
        page.screenshot(path=out_path)
        print(f"Saved: {filename}")

    browser.close()
    print("All tabs captured successfully.")
