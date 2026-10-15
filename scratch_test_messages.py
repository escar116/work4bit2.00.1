from playwright.sync_api import sync_playwright
import time
import os

ARTIFACT_DIR = r"C:\Users\charles\.gemini\antigravity\brain\99bbb9a9-8bb4-4e35-8e85-c6f15d42cd57\mobile_messages_test"
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
    page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)

    page.goto("http://localhost:5173/?dev_preview=messages", wait_until="domcontentloaded")
    page.wait_for_timeout(1500)

    # 1. Active Chat Panel
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "chat_active_panel.png"))

    # 2. Click back button to see Conversations List
    page.evaluate("() => document.querySelector('#chat-back-btn')?.click()")
    page.wait_for_timeout(500)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "conversations_list.png"))

    # 3. Click conversation item to go back into chat
    page.evaluate("""() => {
        const item = document.querySelector('.conversation-item');
        if (item) item.click();
    }""")
    page.wait_for_timeout(500)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "chat_reopened.png"))

    browser.close()
    print("Messages test complete.")
