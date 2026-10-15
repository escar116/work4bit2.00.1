import os
import json
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\charles\.gemini\antigravity\brain\4ad8e8d7-2053-4918-9958-a5b7bb1e6e92\mobile_screenshots"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

viewports = [
    {"name": "mobile_360", "width": 360, "height": 780},
    {"name": "mobile_390", "width": 390, "height": 844},
    {"name": "mobile_430", "width": 430, "height": 932},
    {"name": "mobile_landscape_844x390", "width": 844, "height": 390},
]

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

audit_results = {
    "overflows": [],
    "tap_target_issues": [],
    "element_overflows": [],
    "screenshots": [],
    "modal_checks": {},
    "messages_checks": {},
    "drawer_checks": {}
}

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)

    for vp in viewports:
        print(f"\n--- Checking Viewport: {vp['name']} ({vp['width']}x{vp['height']}) ---")
        context = browser.new_context(
            viewport={"width": vp["width"], "height": vp["height"]},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True
        )
        page = context.new_page()
        page.add_init_script("""
            localStorage.setItem('w4a-guide-v1-dev_student_1', '5');
            localStorage.setItem('w4a-guide-v1-guest', '5');
        """)

        # 1. Landing Page
        try:
            page.goto("http://localhost:5173/", wait_until="domcontentloaded")
            page.wait_for_timeout(600)
            
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
                audit_results["overflows"].append({
                    "viewport": vp["name"],
                    "section": "landing",
                    "details": of
                })
                print(f"[OVERFLOW] Landing {vp['name']}: doc={of['docScroll']}/{of['docClient']}, body={of['bodyScroll']}/{of['bodyClient']}")

            # Check overflowing child elements
            bad_elems = page.evaluate("""(cw) => {
                const bad = [];
                document.querySelectorAll('*').forEach(el => {
                    if (el.tagName === 'HTML' || el.tagName === 'BODY' || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
                    const r = el.getBoundingClientRect();
                    if (r.width > 0 && r.height > 0 && r.right > cw + 2) {
                        bad.push({
                            tag: el.tagName,
                            id: el.id,
                            className: el.className,
                            right: Math.round(r.right),
                            cw: cw
                        });
                    }
                });
                return bad.slice(0, 10);
            }""", vp["width"])
            if bad_elems:
                audit_results["element_overflows"].append({
                    "viewport": vp["name"],
                    "section": "landing",
                    "bad_elements": bad_elems
                })
                print(f"  Overflowing elements on landing: {len(bad_elems)}")

            # Check tap targets on landing (buttons and links)
            small_targets = page.evaluate("""() => {
                const issues = [];
                document.querySelectorAll('#section-landing button, #section-landing a, #section-landing input').forEach(el => {
                    const r = el.getBoundingClientRect();
                    if (r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44)) {
                        // ignore hidden or tiny text links inside footnotes if styled appropriately, but note them
                        const text = (el.innerText || el.getAttribute('aria-label') || el.id || '').trim().slice(0, 30);
                        issues.push({
                            tag: el.tagName,
                            id: el.id,
                            class: el.className,
                            text: text,
                            width: Math.round(r.width),
                            height: Math.round(r.height)
                        });
                    }
                });
                return issues;
            }""")
            if small_targets:
                audit_results["tap_target_issues"].append({
                    "viewport": vp["name"],
                    "section": "landing",
                    "count": len(small_targets),
                    "samples": small_targets[:8]
                })

            if vp["name"] == "mobile_390":
                page.screenshot(path=os.path.join(ARTIFACT_DIR, "390_landing_hero.png"))
                # Scroll down to services
                page.evaluate("() => document.querySelector('#lp-offers')?.scrollIntoView()")
                page.wait_for_timeout(300)
                page.screenshot(path=os.path.join(ARTIFACT_DIR, "390_landing_services.png"))
                # Scroll down to how it works / journey
                page.evaluate("() => document.querySelector('#lp-how')?.scrollIntoView()")
                page.wait_for_timeout(300)
                page.screenshot(path=os.path.join(ARTIFACT_DIR, "390_landing_journey.png"))

        except Exception as e:
            print(f"Error on landing: {e}")

        # Check all workspace sections
        for sec in sections:
            if sec == "landing":
                continue
            url = f"http://localhost:5173/?dev_preview={sec}"
            try:
                page.goto(url, wait_until="domcontentloaded")
                page.wait_for_timeout(500)
                page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
                
                # Check overflow
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
                    audit_results["overflows"].append({
                        "viewport": vp["name"],
                        "section": sec,
                        "details": of
                    })
                    print(f"[OVERFLOW] {sec} {vp['name']}: doc={of['docScroll']}/{of['docClient']}, body={of['bodyScroll']}/{of['bodyClient']}")

                # Check overflowing elements
                bad_elems = page.evaluate("""(cw) => {
                    const bad = [];
                    document.querySelectorAll('.main-content *, .workspace-header *').forEach(el => {
                        const r = el.getBoundingClientRect();
                        if (r.width > 0 && r.height > 0 && r.right > cw + 2) {
                            bad.push({
                                tag: el.tagName,
                                id: el.id,
                                className: String(el.className).slice(0, 50),
                                right: Math.round(r.right),
                                cw: cw
                            });
                        }
                    });
                    return bad.slice(0, 10);
                }""", vp["width"])
                if bad_elems:
                    audit_results["element_overflows"].append({
                        "viewport": vp["name"],
                        "section": sec,
                        "bad_elements": bad_elems
                    })
                    print(f"  Overflowing elements on {sec}: {len(bad_elems)}")

                # Check tap targets
                small_targets = page.evaluate("""(sec) => {
                    const issues = [];
                    const sel = `#section-${sec} button, #section-${sec} a.btn, #section-${sec} .icon-button, #section-${sec} select, .workspace-header button, .workspace-header .icon-button`;
                    document.querySelectorAll(sel).forEach(el => {
                        const r = el.getBoundingClientRect();
                        if (r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44)) {
                            const text = (el.innerText || el.getAttribute('aria-label') || el.id || '').trim().slice(0, 30);
                            issues.push({
                                tag: el.tagName,
                                id: el.id,
                                class: String(el.className).slice(0, 40),
                                text: text,
                                width: Math.round(r.width),
                                height: Math.round(r.height)
                            });
                        }
                    });
                    return issues;
                }""", sec)
                if small_targets:
                    audit_results["tap_target_issues"].append({
                        "viewport": vp["name"],
                        "section": sec,
                        "count": len(small_targets),
                        "samples": small_targets[:8]
                    })

                # Screenshot at 390
                if vp["name"] == "mobile_390":
                    page.screenshot(path=os.path.join(ARTIFACT_DIR, f"390_portrait_{sec}.png"))
                elif vp["name"] == "mobile_landscape_844x390" and sec in ["dashboard", "messages", "admin"]:
                    page.screenshot(path=os.path.join(ARTIFACT_DIR, f"landscape_{sec}.png"))

            except Exception as e:
                print(f"Error on {sec}: {e}")

        # Interactive check: Sidebar Drawer (at 390)
        if vp["name"] == "mobile_390":
            try:
                page.goto("http://localhost:5173/?dev_preview=dashboard", wait_until="domcontentloaded")
                page.wait_for_timeout(400)
                page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
                page.click(".workspace-menu")
                page.wait_for_timeout(300)
                drawer_open = page.evaluate("""() => {
                    const sb = document.querySelector('#sidebar');
                    const overlay = document.querySelector('.sidebar-overlay');
                    return {
                        sidebarHasClass: sb?.classList.contains('sidebar-open'),
                        overlayVisible: overlay ? window.getComputedStyle(overlay).display !== 'none' : false,
                        sidebarRect: sb ? sb.getBoundingClientRect() : null
                    };
                }""")
                audit_results["drawer_checks"]["mobile_390"] = drawer_open
                page.screenshot(path=os.path.join(ARTIFACT_DIR, "390_sidebar_drawer_open.png"))
                # Close drawer
                page.evaluate("() => document.querySelector('.sidebar-overlay')?.click() || document.querySelector('.workspace-menu')?.click()")
                page.wait_for_timeout(200)
            except Exception as e:
                audit_results["drawer_checks"]["error"] = str(e)

        # Interactive check: Messages transition (at 390)
        if vp["name"] == "mobile_390":
            try:
                page.goto("http://localhost:5173/?dev_preview=messages", wait_until="domcontentloaded")
                page.wait_for_timeout(600)
                page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
                page.screenshot(path=os.path.join(ARTIFACT_DIR, "390_messages_conversations.png"))
                
                # Click first conversation
                conv_clicked = page.evaluate("""() => {
                    const item = document.querySelector('.conversation-item');
                    if (item) {
                        item.click();
                        return true;
                    }
                    return false;
                }""")
                page.wait_for_timeout(500)
                msg_state = page.evaluate("""() => {
                    const list = document.querySelector('.conversations-panel');
                    const chat = document.querySelector('.chat-panel');
                    const backBtn = document.querySelector('#btn-back-to-convs');
                    return {
                        listDisplay: list ? window.getComputedStyle(list).display : 'none',
                        chatDisplay: chat ? window.getComputedStyle(chat).display : 'none',
                        backBtnVisible: backBtn ? window.getComputedStyle(backBtn).display !== 'none' : false,
                        backBtnRect: backBtn ? backBtn.getBoundingClientRect() : null
                    };
                }""")
                audit_results["messages_checks"]["mobile_390"] = msg_state
                page.screenshot(path=os.path.join(ARTIFACT_DIR, "390_messages_active_chat.png"))
                
                # Click back button
                page.evaluate("() => document.querySelector('#btn-back-to-convs')?.click()")
                page.wait_for_timeout(300)
                page.screenshot(path=os.path.join(ARTIFACT_DIR, "390_messages_after_back.png"))
            except Exception as e:
                audit_results["messages_checks"]["error"] = str(e)

        # Interactive check: Modals sizing and viewport fit (at 390)
        if vp["name"] == "mobile_390":
            modal_triggers = [
                ("service-offers", "#btn-post-offer", "#dialog-new-request", "modal_post_offer"),
                ("service-offers", ".btn-view-details", "#dialog-service-details", "modal_service_details"),
                ("profile", "#btn-edit-profile", "#dialog-edit-profile", "modal_edit_profile"),
                ("profile", "#btn-add-portfolio-item", "#dialog-add-portfolio", "modal_add_portfolio"),
                ("mentoring", ".btn-schedule-mentor", "#dialog-mentoring-apply", "modal_mentoring_apply")
            ]
            for sec, trig, d_sel, m_name in modal_triggers:
                try:
                    page.goto(f"http://localhost:5173/?dev_preview={sec}", wait_until="domcontentloaded")
                    page.wait_for_timeout(500)
                    page.evaluate("() => { const g = document.querySelector('dialog.workspace-guide'); if(g && g.open) g.close(); }")
                    has_trig = page.evaluate(f"() => !!document.querySelector('{trig}')")
                    if has_trig:
                        page.click(trig)
                        page.wait_for_timeout(400)
                        diag_metrics = page.evaluate(f"""() => {{
                            const d = document.querySelector('{d_sel}');
                            if (!d) return null;
                            const r = d.getBoundingClientRect();
                            const content = d.querySelector('.modal-content') || d;
                            const cr = content.getBoundingClientRect();
                            const closeBtn = d.querySelector('.btn-close, .modal-close, button[aria-label=\"Close\"], .btn-modal-close');
                            return {{
                                dialogWidth: Math.round(r.width),
                                dialogHeight: Math.round(r.height),
                                contentWidth: Math.round(cr.width),
                                viewportWidth: window.innerWidth,
                                widthRatio: (r.width / window.innerWidth).toFixed(2),
                                closeBtnSize: closeBtn ? {{ w: Math.round(closeBtn.getBoundingClientRect().width), h: Math.round(closeBtn.getBoundingClientRect().height) }} : null
                            }};
                        }}""")
                        audit_results["modal_checks"][m_name] = diag_metrics
                        page.screenshot(path=os.path.join(ARTIFACT_DIR, f"390_{m_name}.png"))
                        page.evaluate(f"() => {{ const d = document.querySelector('{d_sel}'); if (d && d.open) d.close(); }}")
                except Exception as e:
                    audit_results["modal_checks"][m_name] = str(e)

        context.close()

    browser.close()

with open(os.path.join(ARTIFACT_DIR, "mobile_targets_audit.json"), "w") as f:
    json.dump(audit_results, f, indent=2)

print("\n================== TARGETS AUDIT SUMMARY ==================")
print(f"Total Page Overflows detected: {len(audit_results['overflows'])}")
for o in audit_results["overflows"]:
    print(f"  - [{o['viewport']}] {o['section']}: {o['details']}")

print(f"\nTotal Element Overflows detected: {len(audit_results['element_overflows'])}")
for eo in audit_results["element_overflows"]:
    print(f"  - [{eo['viewport']}] {eo['section']}: {len(eo['bad_elements'])} bad elements")
    for be in eo["bad_elements"][:3]:
        print(f"      <{be['tag']} id='{be['id']}' class='{be['className']}'> right={be['right']} cw={be['cw']}")

print(f"\nTap Target Issues detected: {len(audit_results['tap_target_issues'])}")
for tti in audit_results["tap_target_issues"]:
    print(f"  - [{tti['viewport']}] {tti['section']}: {tti['count']} targets < 44px")
    for s in tti["samples"][:3]:
        print(f"      [{s['width']}x{s['height']}px] {s['tag']} #{s['id']} .{s['class']} '{s['text']}'")

print(f"\nDrawer checks: {audit_results['drawer_checks']}")
print(f"Messages checks: {audit_results['messages_checks']}")
print(f"Modal checks: {json.dumps(audit_results['modal_checks'], indent=2)}")
