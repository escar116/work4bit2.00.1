import os
import sys
import time
import glob
import subprocess
from playwright.sync_api import sync_playwright

OUTPUT_DIR = os.path.abspath("./video_narration")
RAW_DIR = os.path.join(OUTPUT_DIR, "raw_recording")
VOICEOVER_AUDIO = os.path.join(OUTPUT_DIR, "work4bit_voiceover_full.mp3")
FINAL_MP4 = os.path.join(OUTPUT_DIR, "work4bit_presentation_3min.mp4")

# FFmpeg binary
FFMPEG_EXE = "C:\\Users\\charles\\AppData\\Local\\Programs\\Python\\Python312\\Lib\\site-packages\\imageio_ffmpeg\\binaries\\ffmpeg-win-x86_64-v7.1.exe"
if not os.path.exists(FFMPEG_EXE):
    import imageio_ffmpeg
    FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

def smooth_scroll(page, delta_y, steps=15, delay=0.03):
    step_y = delta_y / steps
    for _ in range(steps):
        page.evaluate(f"window.scrollBy(0, {step_y})")
        time.sleep(delay)

def smooth_mouse_move(page, start_x, start_y, end_x, end_y, steps=12, delay=0.02):
    for i in range(1, steps + 1):
        cur_x = start_x + (end_x - start_x) * (i / steps)
        cur_y = start_y + (end_y - start_y) * (i / steps)
        page.mouse.move(cur_x, cur_y)
        time.sleep(delay)

def record_presentation():
    os.makedirs(RAW_DIR, exist_ok=True)
    # Clear old raw files
    for f in glob.glob(os.path.join(RAW_DIR, "*")):
        try: os.remove(f)
        except: pass

    print("==================================================")
    print("STARTING 3-MINUTE PRESENTATION RECORDING")
    print(f"Viewport: 1920x1080 (Full HD)")
    print(f"Browser: Microsoft Edge (Chromium)")
    print(f"Target Voiceover: {VOICEOVER_AUDIO}")
    print("==================================================")

    start_time = time.time()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel="msedge",
            headless=True,
            args=[
                "--start-maximized",
                "--hide-scrollbars=false",
                "--disable-blink-features=AutomationControlled"
            ]
        )

        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=1.0,
            record_video_dir=RAW_DIR,
            record_video_size={"width": 1920, "height": 1080}
        )

        page = context.new_page()

        # ----------------------------------------------------
        # SCENE 1: Introduction & Dashboard Overview (0:00 - 0:24)
        # ----------------------------------------------------
        print("[Scene 1/7] (0:00 - 0:24) Dashboard Overview & Key Metrics...")
        page.goto("http://localhost:4173/?dev_preview=dashboard", wait_until="domcontentloaded")
        time.sleep(3.0)

        # Move mouse across header
        smooth_mouse_move(page, 200, 30, 960, 30, steps=15)
        time.sleep(1.5)

        # Smooth scroll down to view 4 stat cards & analytics charts
        smooth_scroll(page, 380, steps=20, delay=0.04)
        time.sleep(2.0)

        # Hover over analytics charts
        smooth_mouse_move(page, 960, 400, 600, 520, steps=15)
        time.sleep(2.5)
        smooth_mouse_move(page, 600, 520, 1200, 520, steps=15)
        time.sleep(3.0)

        # Scroll to view bottom ratings
        smooth_scroll(page, 300, steps=15, delay=0.04)
        time.sleep(3.0)

        # Scroll back up to top
        smooth_scroll(page, -680, steps=25, delay=0.03)
        time.sleep(2.0)

        # Wait remaining time to reach 24s mark exactly
        elapsed = time.time() - start_time
        if elapsed < 24.0:
            time.sleep(24.0 - elapsed)

        # ----------------------------------------------------
        # SCENE 2: Authentication & Faculty Verification (0:24 - 0:47)
        # ----------------------------------------------------
        print("[Scene 2/7] (0:24 - 0:47) Student Profile & Faculty Reference Verification...")
        # Click Profile in sidebar
        page.click('button[data-target="profile"]')
        time.sleep(2.0)

        # Hover over Verified Student badge and Faculty Reference
        smooth_mouse_move(page, 100, 480, 500, 260, steps=15)
        time.sleep(2.5)

        # Scroll down through credentials, skills, portfolio
        smooth_scroll(page, 350, steps=18, delay=0.04)
        time.sleep(3.0)

        smooth_mouse_move(page, 500, 400, 850, 450, steps=15)
        time.sleep(3.0)

        # Scroll down to reviews
        smooth_scroll(page, 300, steps=15, delay=0.04)
        time.sleep(3.0)

        # Scroll back to top
        smooth_scroll(page, -650, steps=20, delay=0.03)
        time.sleep(1.5)

        elapsed = time.time() - start_time
        if elapsed < 47.0:
            time.sleep(47.0 - elapsed)

        # ----------------------------------------------------
        # SCENE 3: Services Marketplace & Image Postings (0:47 - 1:17)
        # ----------------------------------------------------
        print("[Scene 3/7] (0:47 - 1:17) Services Marketplace, Filtering & Photo Attachment...")
        page.click('button[data-target="services"]')
        time.sleep(2.0)

        # Hover over the 3D Printing card cover image
        smooth_mouse_move(page, 100, 420, 360, 360, steps=15)
        time.sleep(2.5)

        # Switch to Service Requests tab
        page.click('#tab-service-requests')
        time.sleep(2.5)

        # Switch back to Service Offers tab
        page.click('#tab-service-offers')
        time.sleep(2.0)

        # Click Details on first card
        first_details = page.query_selector('.request-card .card-open-details')
        if first_details:
            first_details.click()
            time.sleep(3.5)
            # Close details modal
            details_close = page.query_selector('#dialog-service-details .dialog-close-btn')
            if details_close:
                details_close.click()
            time.sleep(1.5)

        # Click Post a Service Offer button to showcase dialog with photo attachment
        post_btn = page.query_selector('#btn-post-offer')
        if post_btn:
            post_btn.click()
            time.sleep(2.0)

            # Smoothly scroll down form inside dialog
            page.evaluate("document.querySelector('#dialog-new-request .modal-content')?.scrollBy(0, 180)")
            time.sleep(2.5)

            # Close post dialog
            new_req_close = page.query_selector('#dialog-new-request .dialog-close-btn')
            if new_req_close:
                new_req_close.click()
            time.sleep(1.5)

        elapsed = time.time() - start_time
        if elapsed < 77.0:
            time.sleep(77.0 - elapsed)

        # ----------------------------------------------------
        # SCENE 4: Mentoring Hub (1:17 - 1:43)
        # ----------------------------------------------------
        print("[Scene 4/7] (1:17 - 1:43) Mentoring Hub & Specialized Skill Consultation...")
        page.click('button[data-target="mentoring"]')
        time.sleep(2.0)

        # Hover over mentor cards
        smooth_mouse_move(page, 100, 420, 400, 320, steps=15)
        time.sleep(2.5)

        # Open and interact with mentor filter drawer
        toggle_mentor_filters = page.query_selector('#btn-toggle-mentoring-filters')
        if toggle_mentor_filters:
            toggle_mentor_filters.click()
            time.sleep(1.5)
            page.select_option('#filter-mentor-rating', '5')
            time.sleep(2.0)
            page.select_option('#filter-mentor-rating', 'all')
            time.sleep(1.5)
            toggle_mentor_filters.click()
            time.sleep(1.0)

        # Smooth scroll down through mentors
        smooth_scroll(page, 300, steps=15, delay=0.04)
        time.sleep(3.0)

        # Scroll back
        smooth_scroll(page, -300, steps=15, delay=0.03)
        time.sleep(2.0)

        elapsed = time.time() - start_time
        if elapsed < 103.0:
            time.sleep(103.0 - elapsed)

        # ----------------------------------------------------
        # SCENE 5: Applications & Real-time Messaging (1:43 - 2:08)
        # ----------------------------------------------------
        print("[Scene 5/7] (1:43 - 2:08) Applications Management & In-App Messaging...")
        page.click('button[data-target="applications"]')
        time.sleep(2.5)

        # Switch between tabs in Applications Hub
        page.click('#tab-app-applied')
        time.sleep(2.0)
        page.click('#tab-app-posted')
        time.sleep(2.0)

        # Show candidate order cards in applications
        smooth_mouse_move(page, 100, 420, 500, 320, steps=15)
        time.sleep(2.0)

        # Switch to Messages
        page.click('button[data-target="messages"]')
        time.sleep(2.5)

        # Click conversation item
        first_conv = page.query_selector('.conversation-item')
        if first_conv:
            first_conv.click()
            time.sleep(2.0)

        # Scroll chat area to show message history
        page.evaluate("document.querySelector('#chat-messages')?.scrollBy(0, 200)")
        time.sleep(2.5)

        # Simulate typing in chat input
        chat_input = page.query_selector('#chat-input')
        if chat_input:
            chat_input.click()
            page.keyboard.type("Sounds good! I'll deliver the 3D enclosure models by tomorrow morning.", delay=30)
            time.sleep(3.0)

        elapsed = time.time() - start_time
        if elapsed < 128.0:
            time.sleep(128.0 - elapsed)

        # ----------------------------------------------------
        # SCENE 6: Admin Dashboard & Governance (2:08 - 2:33)
        # ----------------------------------------------------
        print("[Scene 6/7] (2:08 - 2:33) Admin Governance & Active User Presence...")
        page.click('button[data-target="admin"]')
        time.sleep(2.5)

        # Hover over online users counter and active stats
        smooth_mouse_move(page, 100, 480, 550, 220, steps=15)
        time.sleep(2.5)

        # Scroll down to student verification list
        smooth_scroll(page, 380, steps=18, delay=0.04)
        time.sleep(3.0)

        # Click View COE (certificate preview)
        cert_btn = page.query_selector('.view-cert-btn')
        if cert_btn:
            cert_btn.click()
            time.sleep(3.5)
            # Close certificate dialog
            cert_close = page.query_selector('#dialog-certificate .dialog-close-btn')
            if cert_close:
                cert_close.click()
            time.sleep(1.5)

        # Scroll back up to top
        smooth_scroll(page, -380, steps=18, delay=0.03)
        time.sleep(2.0)

        elapsed = time.time() - start_time
        if elapsed < 153.0:
            time.sleep(153.0 - elapsed)

        # ----------------------------------------------------
        # SCENE 7: Conclusion (2:33 - 2:44+)
        # ----------------------------------------------------
        print("[Scene 7/7] (2:33 - 2:44) Final Overview & Presentation Conclusion...")
        page.click('button[data-target="dashboard"]')
        time.sleep(2.0)

        smooth_scroll(page, 150, steps=10, delay=0.04)
        time.sleep(3.0)
        smooth_scroll(page, -150, steps=10, delay=0.04)
        time.sleep(3.0)

        # Ensure total duration matches/exceeds voiceover duration (~163-165s)
        elapsed = time.time() - start_time
        if elapsed < 165.0:
            time.sleep(165.0 - elapsed)

        total_elapsed = time.time() - start_time
        print(f"Browser recording complete! Total recorded time: {total_elapsed:.1f}s")

        context.close()
        browser.close()

    # Find the recorded .webm file
    webms = glob.glob(os.path.join(RAW_DIR, "*.webm"))
    if not webms:
        print("Error: No raw webm video was produced!")
        return False

    raw_video = webms[0]
    print(f"Raw video saved at: {raw_video} ({os.path.getsize(raw_video) / 1024 / 1024:.2f} MB)")

    # ----------------------------------------------------
    # STEP 8: MUXING AUDIO & VIDEO WITH FFMPEG
    # ----------------------------------------------------
    print("\n==================================================")
    print("ENCODING FINAL 3-MINUTE PRESENTATION MP4 WITH AUDIO")
    print(f"Video Source: {raw_video}")
    print(f"Audio Source: {VOICEOVER_AUDIO}")
    print(f"Target Output: {FINAL_MP4}")
    print("==================================================")

    # Encode with H.264, AAC, 1080p, and sync length with shortest or audio
    cmd = [
        FFMPEG_EXE,
        "-y",
        "-i", raw_video,
        "-i", VOICEOVER_AUDIO,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        FINAL_MP4
    ]

    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode == 0 and os.path.exists(FINAL_MP4):
        size_mb = os.path.getsize(FINAL_MP4) / 1024 / 1024
        print(f"\nSUCCESS! 3-minute video presentation created successfully!")
        print(f"File Path: {FINAL_MP4}")
        print(f"File Size: {size_mb:.2f} MB")
        return True
    else:
        print("FFmpeg encoding failed:", res.stderr)
        return False

if __name__ == "__main__":
    success = record_presentation()
    sys.exit(0 if success else 1)
