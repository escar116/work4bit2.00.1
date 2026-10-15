from playwright.sync_api import sync_playwright
import time
import os

ARTIFACT_DIR = r"C:\Users\charles\.gemini\antigravity\brain\99bbb9a9-8bb4-4e35-8e85-c6f15d42cd57\mobile_audit_fullpage"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

targets = [
    ("landing", "http://localhost:5173/"),
    ("dashboard", "http://localhost:5173/?dev_preview=dashboard"),
    ("service-offers", "http://localhost:5173/?dev_preview=service-offers"),
    ("service-requests", "http://localhost:5173/?dev_preview=service-requests"),
    ("mentoring", "http://localhost:5173/?dev_preview=mentoring"),
    ("applications", "http://localhost:5173/?dev_preview=applications"),
    ("messages", "http://localhost:5173/?dev_preview=messages"),
    ("transactions", "http://localhost:5173/?dev_preview=transactions"),
    ("logs", "http://localhost:5173/?dev_preview=logs"),
    ("profile", "http://localhost:5173/?dev_preview=profile"),
    ("admin", "http://localhost:5173/?dev_preview=admin"),
]

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

    for name, url in targets:
        print(f"Full-page audit {name}...")
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(1000)
            page.evaluate("""() => {
                const g = document.querySelector('dialog.workspace-guide');
                if (g && g.open) g.close();
            }""")
            page.wait_for_timeout(300)
        except Exception as e:
            print(f"goto note: {e}")

        # Capture full page
        screenshot_path = os.path.join(ARTIFACT_DIR, f"{name}_full.png")
        page.screenshot(path=screenshot_path, full_page=True)

    browser.close()
    print("Full-page audit capture complete.")
