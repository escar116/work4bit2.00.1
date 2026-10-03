import os
import time
from playwright.sync_api import sync_playwright

url = "https://www.canva.com/design/DAHWxKFLdBI/91yvL4TmzsXXS0vEtsRyLQ/view"
output_dir = r"C:\Users\charles\.gemini\antigravity\brain\2dcbce95-d155-4f78-82c5-cabf4dd81ced\canva_slides"
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
    print("Navigating to Canva...")
    page.goto(url, wait_until="load", timeout=45000)
    time.sleep(5)

    # Let's navigate slide by slide up to slide 20
    # On Canva viewer, pressing ArrowRight or 'PageDown' advances slides
    # Let's verify current slide number by checking text or pressing keys
    for slide_idx in range(1, 21):
        print(f"Capturing slide {slide_idx}...")
        # Take screenshot of the main canvas / slide area
        page.screenshot(path=os.path.join(output_dir, f"slide_{slide_idx}.png"))
        
        # Advance to next slide
        page.keyboard.press("ArrowRight")
        time.sleep(1.2)

    browser.close()
    print("All slides captured successfully!")
