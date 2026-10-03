import os
import time
from playwright.sync_api import sync_playwright

url = "https://www.canva.com/design/DAHWxKFLdBI/91yvL4TmzsXXS0vEtsRyLQ/view"
output_dir = r"C:\Users\charles\.gemini\antigravity\brain\2dcbce95-d155-4f78-82c5-cabf4dd81ced\canva_slides_recheck"
os.makedirs(output_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(
        channel="msedge",
        headless=True,
        args=["--start-maximized", "--disable-blink-features=AutomationControlled"]
    )
    context = browser.new_context(
        viewport={"width": 1920, "height": 1080},
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0"
    )
    page = context.new_page()
    print("Navigating to Canva to recheck...")
    page.goto(url, wait_until="load", timeout=45000)
    time.sleep(5)

    # Advance to slide 16
    for i in range(1, 16):
        page.keyboard.press("ArrowRight")
        time.sleep(0.3)
    
    time.sleep(1.5)
    page.screenshot(path=os.path.join(output_dir, "slide_16_recheck.png"))
    print("Slide 16 rechecked.")

    page.keyboard.press("ArrowRight")
    time.sleep(1.0)
    page.screenshot(path=os.path.join(output_dir, "slide_17_recheck.png"))
    print("Slide 17 rechecked.")

    page.keyboard.press("ArrowRight")
    time.sleep(1.0)
    page.screenshot(path=os.path.join(output_dir, "slide_18_recheck.png"))
    print("Slide 18 rechecked.")

    browser.close()
    print("Done rechecking slides 16, 17, 18!")
