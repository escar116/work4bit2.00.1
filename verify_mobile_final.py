import os
import json
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\charles\.gemini\antigravity\brain\4ad8e8d7-2053-4918-9958-a5b7bb1e6e92\mobile_screenshots"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

test_summary = {
    "viewports_tested": ["360x780", "390x844", "430x932", "844x390 (Landscape)"],
    "horizontal_overflows": [],
    "tap_target_issues": [],
    "targets_verified": {}
}

sections = [
    "landing",
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

    # 1. Main Verification at 390x844
    print("\n--- 1. Verification at 390x844 ---")
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

    # Landing Page
    print("Testing Landing Page...")
    page.goto("http://localhost:5173/", wait_until="domcontentloaded")
    page.wait_for_timeout(600)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "final_390_landing_hero.png"))
    
    # Test Hamburger Nav on Landing
    page.click("#section-landing .menu")
    page.wait_for_timeout(300)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "final_390_landing_menu_open.png"))
    
    # Check landing mobile signin link presence & dimensions
    ms_metrics = page.evaluate("""() => {
        const link = document.querySelector('#section-landing .navlinks.open a.mobile-signin');
        if (!link) return null;
        const r = link.getBoundingClientRect();
        return { visible: window.getComputedStyle(link).display !== 'none', width: Math.round(r.width), height: Math.round(r.height) };
    }""")
    test_summary["targets_verified"]["landing_menu_signin"] = ms_metrics
    
    # Click mobile sign in
    page.evaluate("() => document.querySelector('#section-landing .navlinks.open a.mobile-signin')?.click()")
    page.wait_for_timeout(400)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "final_390_landing_signin_dialog.png"))
    
    # Close signin modal
    page.evaluate("() => document.querySelector('#lp-sign-in')?.close()")
    page.wait_for_timeout(200)

    # Scroll down to services, journey, footer
    page.evaluate("() => document.querySelector('#lp-offers')?.scrollIntoView()")
    page.wait_for_timeout(300)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "final_390_landing_service_cards.png"))
    page.evaluate("() => document.querySelector('#lp-how')?.scrollIntoView()")
    page.wait_for_timeout(300)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "final_390_landing_journey_steps.png"))

    # Test all workspace sections
    for sec in sections:
        if sec == "landing":
            continue
        print(f"Testing Section: {sec}...")
        page.goto(f"http://localhost:5173/?dev_preview={sec}", wait_until="domcontentloaded")
        page.wait_for_timeout(600)
        page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if (g && g.open) g.close(); }")
        
        # Check horizontal overflow
        of = page.evaluate("""() => {
            const doc = document.documentElement;
            const body = document.body;
            return {
                docScroll: doc.scrollWidth,
                docClient: doc.clientWidth,
                bodyScroll: body.scrollWidth,
                bodyClient: body.clientWidth,
                hasOverflow: doc.scrollWidth > doc.clientWidth || body.scrollWidth > body.clientWidth
            };
        }""")
        if of["hasOverflow"]:
            test_summary["horizontal_overflows"].append({"section": sec, "viewport": "390x844", "details": of})

        page.screenshot(path=os.path.join(ARTIFACT_DIR, f"final_390_{sec}.png"))
        test_summary["targets_verified"][sec] = "OK"

    # Deep check: Messages active chat transition & back button
    print("Testing Messages Transition & Back Button...")
    page.goto("http://localhost:5173/?dev_preview=messages", wait_until="domcontentloaded")
    page.wait_for_timeout(600)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if (g && g.open) g.close(); }")
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "final_390_messages_active_chat.png"))
    
    chat_state = page.evaluate("""() => {
        const list = document.querySelector('.conversations-sidebar');
        const chat = document.querySelector('#chat-panel');
        const backBtn = document.querySelector('#chat-back-btn');
        const bRect = backBtn ? backBtn.getBoundingClientRect() : null;
        const sendBtn = document.querySelector('#chat-send-btn');
        const sRect = sendBtn ? sendBtn.getBoundingClientRect() : null;
        const attachBtn = document.querySelector('#chat-attach-btn');
        const aRect = attachBtn ? attachBtn.getBoundingClientRect() : null;
        return {
            listDisplay: window.getComputedStyle(list).display,
            chatDisplay: window.getComputedStyle(chat).display,
            backBtnVisible: backBtn ? window.getComputedStyle(backBtn).display !== 'none' : false,
            backBtnSize: bRect ? { width: Math.round(bRect.width), height: Math.round(bRect.height) } : null,
            sendBtnSize: sRect ? { width: Math.round(sRect.width), height: Math.round(sRect.height) } : null,
            attachBtnSize: aRect ? { width: Math.round(aRect.width), height: Math.round(aRect.height) } : null
        };
    }""")
    test_summary["targets_verified"]["messages_interactive"] = chat_state
    
    # Click back button to return to conversation list
    page.click("#chat-back-btn")
    page.wait_for_timeout(300)
    after_back = page.evaluate("""() => ({
        listDisplay: window.getComputedStyle(document.querySelector('.conversations-sidebar')).display,
        chatDisplay: window.getComputedStyle(document.querySelector('#chat-panel')).display
    })""")
    test_summary["targets_verified"]["messages_after_back"] = after_back
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "final_390_messages_conversations_list.png"))

    # Re-click conversation item to reopen chat
    page.click(".conversation-item")
    page.wait_for_timeout(300)
    test_summary["targets_verified"]["messages_reopened"] = page.evaluate("""() => ({
        listDisplay: window.getComputedStyle(document.querySelector('.conversations-sidebar')).display,
        chatDisplay: window.getComputedStyle(document.querySelector('#chat-panel')).display
    })""")

    # Deep check: Sidebar drawer open & click overlay dismissal
    print("Testing Sidebar Drawer & Overlay...")
    page.goto("http://localhost:5173/?dev_preview=dashboard", wait_until="domcontentloaded")
    page.wait_for_timeout(500)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if (g && g.open) g.close(); }")
    page.click(".workspace-menu")
    page.wait_for_timeout(300)
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "final_390_sidebar_drawer_open.png"))
    
    drawer_state = page.evaluate("""() => {
        const sb = document.querySelector('#sidebar');
        const ov = document.querySelector('#sidebar-overlay');
        const closeBtn = document.querySelector('#sidebar-close-btn');
        const cbRect = closeBtn ? closeBtn.getBoundingClientRect() : null;
        return {
            sidebarOpen: sb.classList.contains('sidebar-open'),
            overlayDisplay: window.getComputedStyle(ov).display,
            overlayOpacity: window.getComputedStyle(ov).opacity,
            closeBtnSize: cbRect ? { width: Math.round(cbRect.width), height: Math.round(cbRect.height) } : null
        };
    }""")
    test_summary["targets_verified"]["sidebar_drawer"] = drawer_state
    page.click("#sidebar-overlay", position={"x": 350, "y": 300})
    page.wait_for_timeout(300)
    test_summary["targets_verified"]["sidebar_closed"] = page.evaluate("""() => ({
        sidebarOpen: document.querySelector('#sidebar').classList.contains('sidebar-open'),
        overlayDisplay: window.getComputedStyle(document.querySelector('#sidebar-overlay')).display
    })""")

    # Deep check: Modals sizing and viewport fit
    print("Testing Modals...")
    modal_tests = [
        ("service-offers", "#btn-post-offer", "#dialog-new-request", "modal_post_offer"),
        ("service-offers", ".btn-view-details", "#dialog-service-details", "modal_service_details"),
        ("profile", "#btn-edit-profile", "#dialog-edit-profile", "modal_edit_profile"),
        ("profile", "#btn-add-portfolio-item", "#dialog-add-portfolio", "modal_add_portfolio"),
        ("mentoring", ".btn-schedule-mentor", "#dialog-mentoring-apply", "modal_mentoring_apply")
    ]
    for sec, trig, d_sel, name in modal_tests:
        page.goto(f"http://localhost:5173/?dev_preview={sec}", wait_until="domcontentloaded")
        page.wait_for_timeout(500)
        page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if (g && g.open) g.close(); }")
        if page.evaluate(f"() => !!document.querySelector('{trig}')"):
            page.click(trig)
            page.wait_for_timeout(400)
            d_info = page.evaluate(f"""() => {{
                const d = document.querySelector('{d_sel}');
                if (!d) return null;
                const r = d.getBoundingClientRect();
                const closeBtn = d.querySelector('.dialog-close-btn, .modal-close-btn');
                const cbr = closeBtn ? closeBtn.getBoundingClientRect() : null;
                return {{
                    width: Math.round(r.width),
                    height: Math.round(r.height),
                    viewportWidth: window.innerWidth,
                    fitsWithin92vw: r.width <= (window.innerWidth * 0.925),
                    closeBtnSize: cbr ? {{ width: Math.round(cbr.width), height: Math.round(cbr.height) }} : null
                }};
            }}""")
            test_summary["targets_verified"][name] = d_info
            page.screenshot(path=os.path.join(ARTIFACT_DIR, f"final_390_{name}.png"))
            page.evaluate(f"() => {{ const d = document.querySelector('{d_sel}'); if (d && d.open) d.close(); }}")

    context.close()

    # 2. Check 360px width
    print("\n--- 2. Checking 360px viewport ---")
    c360 = browser.new_context(viewport={"width": 360, "height": 780}, is_mobile=True, has_touch=True)
    p360 = c360.new_page()
    p360.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)
    for sec in ["landing", "dashboard", "service-offers", "applications", "messages", "profile", "admin"]:
        url = "http://localhost:5173/" if sec == "landing" else f"http://localhost:5173/?dev_preview={sec}"
        p360.goto(url, wait_until="domcontentloaded")
        p360.wait_for_timeout(400)
        p360.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if (g && g.open) g.close(); }")
        of = p360.evaluate("""() => {
            const doc = document.documentElement;
            const body = document.body;
            return {
                docScroll: doc.scrollWidth,
                docClient: doc.clientWidth,
                bodyScroll: body.scrollWidth,
                bodyClient: body.clientWidth,
                hasOverflow: doc.scrollWidth > doc.clientWidth || body.scrollWidth > body.clientWidth
            };
        }""")
        if of["hasOverflow"]:
            test_summary["horizontal_overflows"].append({"section": sec, "viewport": "360x780", "details": of})
    c360.close()

    # 3. Check 430px width
    print("\n--- 3. Checking 430px viewport ---")
    c430 = browser.new_context(viewport={"width": 430, "height": 932}, is_mobile=True, has_touch=True)
    p430 = c430.new_page()
    p430.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)
    for sec in ["landing", "dashboard", "service-offers", "applications", "messages", "profile", "admin"]:
        url = "http://localhost:5173/" if sec == "landing" else f"http://localhost:5173/?dev_preview={sec}"
        p430.goto(url, wait_until="domcontentloaded")
        p430.wait_for_timeout(400)
        p430.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if (g && g.open) g.close(); }")
        of = p430.evaluate("""() => {
            const doc = document.documentElement;
            const body = document.body;
            return {
                docScroll: doc.scrollWidth,
                docClient: doc.clientWidth,
                bodyScroll: body.scrollWidth,
                bodyClient: body.clientWidth,
                hasOverflow: doc.scrollWidth > doc.clientWidth || body.scrollWidth > body.clientWidth
            };
        }""")
        if of["hasOverflow"]:
            test_summary["horizontal_overflows"].append({"section": sec, "viewport": "430x932", "details": of})
    c430.close()

    # 4. Check Landscape 844x390
    print("\n--- 4. Checking Landscape 844x390 ---")
    cland = browser.new_context(viewport={"width": 844, "height": 390}, is_mobile=True, has_touch=True)
    pland = cland.new_page()
    pland.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)
    for sec in ["landing", "dashboard", "messages", "admin"]:
        url = "http://localhost:5173/" if sec == "landing" else f"http://localhost:5173/?dev_preview={sec}"
        pland.goto(url, wait_until="domcontentloaded")
        pland.wait_for_timeout(400)
        pland.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if (g && g.open) g.close(); }")
        
        # Check landscape header buttons tap target size
        if sec == "dashboard":
            hb_sizes = pland.evaluate("""() => {
                const btns = document.querySelectorAll('.workspace-header button, .workspace-actions .icon-button');
                const out = [];
                btns.forEach(b => {
                    const r = b.getBoundingClientRect();
                    out.push({ class: b.className, width: Math.round(r.width), height: Math.round(r.height) });
                });
                return out;
            }""")
            test_summary["targets_verified"]["landscape_header_buttons"] = hb_sizes
            pland.screenshot(path=os.path.join(ARTIFACT_DIR, "final_landscape_dashboard.png"))
        elif sec == "messages":
            pland.screenshot(path=os.path.join(ARTIFACT_DIR, "final_landscape_messages.png"))

        of = pland.evaluate("""() => {
            const doc = document.documentElement;
            const body = document.body;
            return {
                docScroll: doc.scrollWidth,
                docClient: doc.clientWidth,
                bodyScroll: body.scrollWidth,
                bodyClient: body.clientWidth,
                hasOverflow: doc.scrollWidth > doc.clientWidth || body.scrollWidth > body.clientWidth
            };
        }""")
        if of["hasOverflow"]:
            test_summary["horizontal_overflows"].append({"section": sec, "viewport": "844x390", "details": of})

    cland.close()
    browser.close()

with open(os.path.join(ARTIFACT_DIR, "final_verification_report.json"), "w") as f:
    json.dump(test_summary, f, indent=2)

print("\n================ FINAL VERIFICATION SUMMARY ================")
print(f"Total Horizontal Overflows across all viewports: {len(test_summary['horizontal_overflows'])}")
if test_summary['horizontal_overflows']:
    for h in test_summary['horizontal_overflows']:
        print("  -", h)
print("\nVerified Targets:")
for k, v in test_summary["targets_verified"].items():
    print(f"  - {k}: {v}")
