import os
import time
from playwright.sync_api import sync_playwright

output_dir = r"C:\Users\charles\.gemini\antigravity\brain\2dcbce95-d155-4f78-82c5-cabf4dd81ced"

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})
    print("Opening admin view...")
    page.goto("http://localhost:4173/?dev_preview=admin", wait_until="domcontentloaded")
    time.sleep(3)

    online_text = page.inner_text("#admin-stat-online-users")
    registered_text = page.inner_text("#admin-stat-registered")
    active_text = page.inner_text("#admin-stat-active-users")
    print(f"Online users count: {online_text}")
    print(f"Registered students count: {registered_text}")
    print(f"Active users count: {active_text}")

    page.screenshot(path=os.path.join(output_dir, "verify_admin_real_online.png"))
    browser.close()
    print("Verification complete!")
