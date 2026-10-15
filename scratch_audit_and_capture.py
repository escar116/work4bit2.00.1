import os
import json
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\charles\.gemini\antigravity\brain\d019a430-b423-43ba-a56c-2d66c8583165\screenshots"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

audit_results = {
    "viewports": ["360x800", "390x844", "430x932", "844x390"],
    "overflows": [],
    "sub_44px_targets": [],
    "modals_audit": [],
    "screenshots_captured": []
}

SECTIONS = [
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

JS_CHECK_OVERFLOW = """() => {
    const doc = document.documentElement;
    const body = document.body;
    const vw = window.innerWidth;
    
    // Check root scroll
    const rootOverflow = doc.scrollWidth > doc.clientWidth + 1 || body.scrollWidth > body.clientWidth + 1;
    
    // Find specific overflowing elements
    const overflowingElements = [];
    const all = document.querySelectorAll('*');
    for (const el of all) {
        if (!el.offsetParent && el !== doc && el !== body) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.right > vw + 1) {
            // Check if inside an intentionally scrollable container
            let parent = el.parentElement;
            let insideScroll = false;
            while (parent && parent !== body && parent !== doc) {
                const style = window.getComputedStyle(parent);
                if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
                    insideScroll = true;
                    break;
                }
                parent = parent.parentElement;
            }
            if (!insideScroll) {
                overflowingElements.push({
                    tag: el.tagName,
                    id: el.id,
                    className: el.className ? String(el.className) : '',
                    rectRight: Math.round(rect.right),
                    rectWidth: Math.round(rect.width),
                    vw: vw
                });
            }
        }
    }
    return {
        rootOverflow,
        docScrollWidth: doc.scrollWidth,
        docClientWidth: doc.clientWidth,
        bodyScrollWidth: body.scrollWidth,
        bodyClientWidth: body.clientWidth,
        overflowingElements: overflowingElements.slice(0, 10)
    };
}"""

JS_CHECK_TAP_TARGETS = """() => {
    const selector = 'button, a, input, select, textarea, [role="button"], [tabindex="0"]';
    const elements = document.querySelectorAll(selector);
    const sub44 = [];
    
    for (const el of elements) {
        // Must be visible
        if (!el.offsetParent && window.getComputedStyle(el).position !== 'fixed') continue;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
        
        const rect = el.getBoundingClientRect();
        // Ignore zero size or hidden items
        if (rect.width === 0 || rect.height === 0) continue;
        
        // Exclude elements completely outside viewport
        if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
        
        // Tap targets should ideally be >= 44x44 or >= 44 in height and adequate width
        if (rect.width < 44 || rect.height < 44) {
            // Check if pseudo-element or container provides 44px
            // We record this element
            sub44.push({
                tag: el.tagName.toLowerCase(),
                id: el.id || '',
                className: (typeof el.className === 'string' ? el.className : ''),
                text: (el.textContent || '').trim().slice(0, 30),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            });
        }
    }
    return sub44;
}"""

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)

    # ================= 1. PRIMARY VIEWPORT: 390x844 =================
    print("\n--- Auditing 390x844 ---")
    ctx390 = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True
    )
    page = ctx390.new_page()
    page.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)

    # 1.1 Landing page audit
    print("Testing Landing Page...")
    page.goto("http://localhost:5173/", wait_until="domcontentloaded")
    page.wait_for_timeout(600)
    
    lp_path = os.path.join(ARTIFACT_DIR, "01_landing_hero_390.png")
    page.screenshot(path=lp_path)
    audit_results["screenshots_captured"].append(lp_path)

    # Check overflow & tap targets on landing
    lp_of = page.evaluate(JS_CHECK_OVERFLOW)
    if lp_of["rootOverflow"] or lp_of["overflowingElements"]:
        audit_results["overflows"].append({"viewport": "390x844", "section": "landing", "data": lp_of})
    
    lp_tt = page.evaluate(JS_CHECK_TAP_TARGETS)
    if lp_tt:
        audit_results["sub_44px_targets"].append({"viewport": "390x844", "section": "landing", "items": lp_tt})

    # Landing Menu toggle
    page.click("#section-landing .menu")
    page.wait_for_timeout(300)
    lp_menu_path = os.path.join(ARTIFACT_DIR, "02_landing_nav_drawer_390.png")
    page.screenshot(path=lp_menu_path)
    audit_results["screenshots_captured"].append(lp_menu_path)

    # Check landing signin modal
    page.evaluate("() => document.querySelector('#section-landing .navlinks.open a.mobile-signin')?.click()")
    page.wait_for_timeout(300)
    lp_sign_path = os.path.join(ARTIFACT_DIR, "03_landing_signin_dialog_390.png")
    page.screenshot(path=lp_sign_path)
    audit_results["screenshots_captured"].append(lp_sign_path)

    d_info = page.evaluate("""() => {
        const d = document.querySelector('#lp-sign-in');
        if (!d) return null;
        const r = d.getBoundingClientRect();
        return {
            id: 'lp-sign-in',
            width: Math.round(r.width),
            height: Math.round(r.height),
            vw: window.innerWidth,
            fits92vw: r.width <= (window.innerWidth * 0.925)
        };
    }""")
    if d_info:
        audit_results["modals_audit"].append(d_info)

    page.evaluate("() => document.querySelector('#lp-sign-in')?.close()")
    page.wait_for_timeout(200)

    # Landing scroll to cards and journey
    page.evaluate("() => document.querySelector('#lp-offers')?.scrollIntoView()")
    page.wait_for_timeout(300)
    lp_cards_path = os.path.join(ARTIFACT_DIR, "04_landing_services_cards_390.png")
    page.screenshot(path=lp_cards_path)
    audit_results["screenshots_captured"].append(lp_cards_path)

    page.evaluate("() => document.querySelector('#lp-how .steps-heading')?.scrollIntoView({block: 'start'})")
    page.wait_for_timeout(300)
    lp_how_path = os.path.join(ARTIFACT_DIR, "05_landing_journey_steps_390.png")
    page.screenshot(path=lp_how_path)
    audit_results["screenshots_captured"].append(lp_how_path)

    # 1.2 All Workspace Sections
    for sec in SECTIONS:
        if sec == "landing":
            continue
        print(f"Testing Section: {sec}...")
        page.goto(f"http://localhost:5173/?dev_preview={sec}", wait_until="domcontentloaded")
        page.wait_for_timeout(600)
        page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if (g && g.open) g.close(); }")
        
        # Check overflow
        of = page.evaluate(JS_CHECK_OVERFLOW)
        if of["rootOverflow"] or of["overflowingElements"]:
            audit_results["overflows"].append({"viewport": "390x844", "section": sec, "data": of})
        
        # Check tap targets
        tt = page.evaluate(JS_CHECK_TAP_TARGETS)
        if tt:
            audit_results["sub_44px_targets"].append({"viewport": "390x844", "section": sec, "items": tt})

        sec_img_path = os.path.join(ARTIFACT_DIR, f"06_{sec}_390.png")
        page.screenshot(path=sec_img_path)
        audit_results["screenshots_captured"].append(sec_img_path)

    # 1.3 Interactive: Sidebar Drawer Overlay
    print("Testing Sidebar Drawer interaction...")
    page.goto("http://localhost:5173/?dev_preview=dashboard", wait_until="domcontentloaded")
    page.wait_for_timeout(500)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if (g && g.open) g.close(); }")
    page.click(".workspace-menu")
    page.wait_for_timeout(300)
    drawer_path = os.path.join(ARTIFACT_DIR, "07_sidebar_drawer_open_390.png")
    page.screenshot(path=drawer_path)
    audit_results["screenshots_captured"].append(drawer_path)
    
    # Close via overlay click
    page.click("#sidebar-overlay", position={"x": 350, "y": 300})
    page.wait_for_timeout(300)

    # 1.4 Interactive: Messages transition & active chat
    print("Testing Messages transition...")
    page.goto("http://localhost:5173/?dev_preview=messages", wait_until="domcontentloaded")
    page.wait_for_timeout(500)
    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if (g && g.open) g.close(); }")
    chat_path = os.path.join(ARTIFACT_DIR, "08_messages_active_chat_390.png")
    page.screenshot(path=chat_path)
    audit_results["screenshots_captured"].append(chat_path)

    page.click("#chat-back-btn")
    page.wait_for_timeout(300)
    conv_path = os.path.join(ARTIFACT_DIR, "09_messages_conv_list_390.png")
    page.screenshot(path=conv_path)
    audit_results["screenshots_captured"].append(conv_path)

    page.click(".conversation-item")
    page.wait_for_timeout(300)

    # 1.5 Interactive: Modals & Dialogs audit
    print("Testing Dialogs...")
    dialog_triggers = [
        ("service-offers", "#btn-post-offer", "#dialog-new-request", "modal_post_offer"),
        ("service-offers", ".btn-view-details", "#dialog-service-details", "modal_service_details"),
        ("service-requests", ".apply-btn, .btn-apply", "#dialog-apply", "modal_apply"),
        ("profile", "#btn-edit-profile", "#dialog-edit-profile", "modal_edit_profile"),
        ("profile", "#btn-add-portfolio-item", "#dialog-add-portfolio", "modal_add_portfolio"),
        ("mentoring", ".btn-schedule-mentor", "#dialog-mentoring-apply", "modal_mentoring_apply"),
        ("admin", ".btn-view-applicant, [onclick*='openViewProfileDialog']", "#dialog-view-profile", "modal_view_profile")
    ]

    for sec, trig, d_sel, name in dialog_triggers:
        page.goto(f"http://localhost:5173/?dev_preview={sec}", wait_until="domcontentloaded")
        page.wait_for_timeout(500)
        page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if (g && g.open) g.close(); }")
        
        if name == "modal_view_profile":
            page.evaluate("() => window.openViewProfileDialog && window.openViewProfileDialog('user_dev_1')")
        else:
            has_elem = page.evaluate("(sel) => { const el = document.querySelector(sel); return el && el.offsetParent !== null; }", trig)
            if has_elem:
                page.click(trig)
            else:
                continue
            
        page.wait_for_timeout(500)
        d_res = page.evaluate(f"""() => {{
            const d = document.querySelector('{d_sel}');
            if (!d || !d.open) return null;
            const r = d.getBoundingClientRect();
            const closeBtn = d.querySelector('.dialog-close-btn, .modal-close-btn');
            const cbr = closeBtn ? closeBtn.getBoundingClientRect() : null;
            return {{
                dialog: '{d_sel}',
                width: Math.round(r.width),
                height: Math.round(r.height),
                vw: window.innerWidth,
                fits92vw: r.width <= (window.innerWidth * 0.925),
                closeBtnSize: cbr ? {{ width: Math.round(cbr.width), height: Math.round(cbr.height) }} : null
            }};
        }}""")
        if d_res:
            audit_results["modals_audit"].append(d_res)
            modal_img = os.path.join(ARTIFACT_DIR, f"10_{name}_390.png")
            page.screenshot(path=modal_img)
            audit_results["screenshots_captured"].append(modal_img)
            page.evaluate(f"() => {{ const d = document.querySelector('{d_sel}'); if (d && d.open) d.close(); }}")
            page.wait_for_timeout(200)

    ctx390.close()

    # ================= 2. 360px VIEWPORT =================
    print("\n--- Auditing 360x800 ---")
    ctx360 = browser.new_context(viewport={"width": 360, "height": 800}, is_mobile=True, has_touch=True)
    p360 = ctx360.new_page()
    p360.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)
    for sec in ["landing", "dashboard", "service-offers", "applications", "messages", "profile", "admin"]:
        url = "http://localhost:5173/" if sec == "landing" else f"http://localhost:5173/?dev_preview={sec}"
        p360.goto(url, wait_until="domcontentloaded")
        p360.wait_for_timeout(400)
        p360.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if (g && g.open) g.close(); }")
        of = p360.evaluate(JS_CHECK_OVERFLOW)
        if of["rootOverflow"] or of["overflowingElements"]:
            audit_results["overflows"].append({"viewport": "360x800", "section": sec, "data": of})
    ctx360.close()

    # ================= 3. 430px VIEWPORT =================
    print("\n--- Auditing 430x932 ---")
    ctx430 = browser.new_context(viewport={"width": 430, "height": 932}, is_mobile=True, has_touch=True)
    p430 = ctx430.new_page()
    p430.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)
    for sec in ["landing", "dashboard", "service-offers", "applications", "messages", "profile", "admin"]:
        url = "http://localhost:5173/" if sec == "landing" else f"http://localhost:5173/?dev_preview={sec}"
        p430.goto(url, wait_until="domcontentloaded")
        p430.wait_for_timeout(400)
        p430.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if (g && g.open) g.close(); }")
        of = p430.evaluate(JS_CHECK_OVERFLOW)
        if of["rootOverflow"] or of["overflowingElements"]:
            audit_results["overflows"].append({"viewport": "430x932", "section": sec, "data": of})
    ctx430.close()

    # ================= 4. LANDSCAPE 844x390 =================
    print("\n--- Auditing Landscape 844x390 ---")
    ctx_land = browser.new_context(viewport={"width": 844, "height": 390}, is_mobile=True, has_touch=True)
    pland = ctx_land.new_page()
    pland.add_init_script("""
        localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
        localStorage.setItem('w4a-guide-v1-guest', '5');
    """)
    for sec in ["landing", "dashboard", "messages", "admin"]:
        url = "http://localhost:5173/" if sec == "landing" else f"http://localhost:5173/?dev_preview={sec}"
        pland.goto(url, wait_until="domcontentloaded")
        pland.wait_for_timeout(400)
        pland.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if (g && g.open) g.close(); }")
        
        land_img = os.path.join(ARTIFACT_DIR, f"11_landscape_{sec}.png")
        pland.screenshot(path=land_img)
        audit_results["screenshots_captured"].append(land_img)

        of = pland.evaluate(JS_CHECK_OVERFLOW)
        if of["rootOverflow"] or of["overflowingElements"]:
            audit_results["overflows"].append({"viewport": "844x390", "section": sec, "data": of})
    ctx_land.close()

    browser.close()

report_path = os.path.join(ARTIFACT_DIR, "audit_report.json")
with open(report_path, "w") as f:
    json.dump(audit_results, f, indent=2)

print("\nAudit Complete! Report saved to:", report_path)
print(f"Total Overflows: {len(audit_results['overflows'])}")
print(f"Total Sub-44px findings sections: {len(audit_results['sub_44px_targets'])}")
print(f"Total Modals Audited: {len(audit_results['modals_audit'])}")
print(f"Total Screenshots Captured: {len(audit_results['screenshots_captured'])}")
