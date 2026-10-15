from playwright.sync_api import sync_playwright
import time
import os

ARTIFACT_DIR = r"C:\Users\charles\.gemini\antigravity\brain\99bbb9a9-8bb4-4e35-8e85-c6f15d42cd57\mobile_landing_sections"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    context = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True
    )
    page = context.new_page()
    page.goto("http://localhost:5173/", wait_until="domcontentloaded")
    page.wait_for_timeout(1000)

    # Scroll incrementally so intersection observer triggers
    for i in range(1, 10):
        page.evaluate(f"window.scrollTo(0, {i * 600})")
        page.wait_for_timeout(300)

    # Now capture full page
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "landing_scrolled_full.png"), full_page=True)

    # Test Hamburger Nav Menu
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(300)
    page.evaluate("() => document.querySelector('#section-landing .menu')?.click()")
    page.wait_for_timeout(300)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "landing_menu_open.png"))

    browser.close()
    print("Landing sections captured.")
