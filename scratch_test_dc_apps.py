from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page()
    page.goto("http://localhost:4173/#landing", wait_until="networkidle")
    page.evaluate('''() => {
        const btn = document.querySelector("#landing-open-login, #hero-login-btn, .landing-nav-login");
        if (btn) btn.click();
        else document.querySelector("#dialog-login, .landing-dialog")?.showModal();
    }''')
    page.wait_for_selector("#landing-login-email")
    page.fill("#landing-login-email", "test4@email.com")
    page.fill("#landing-login-password", "12345678")
    page.click("#landing-login-btn")
    page.wait_for_selector("#app-views:not(.hidden)", timeout=25000)
    page.wait_for_timeout(1500)

    # Call listAllApplicationsAdmin via evaluate
    res = page.evaluate('''async () => {
        try {
            // Let's call loadAdmin or call the function
            // We can check if listAllApplicationsAdmin works
            // In main.js, let's see what happens in loadAdmin
            // Let's inspect adminAppsData after loadAdmin or call it
            return "ready";
        } catch(e) {
            return { error: e.toString() };
        }
    }''')
    print("RES:", res)
    browser.close()
