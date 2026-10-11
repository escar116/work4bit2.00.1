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
    page.fill("#landing-login-email", "charlesjanparaggua@gmail.com")
    page.fill("#landing-login-password", "12345678")
    page.click("#landing-login-btn")
    page.wait_for_selector("#app-views:not(.hidden)", timeout=25000)
    page.wait_for_timeout(2000)

    # Let's inspect listAllApplicationsAdmin
    apps = page.evaluate('''async () => {
        // Navigate to Admin to load applications or check dc directly if accessible
        document.querySelector('.nav-btn[data-target="admin"]')?.click();
        await new Promise(r => setTimeout(r, 2000));
        // Check window or inspect applications
        return {
            adminApps: window.adminAppsData || []
        };
    }''')
    print("ADMIN APPS DATA:", len(apps['adminApps']))
    for a in apps['adminApps']:
        print("APP:", {
            "id": a.get("id"),
            "status": a.get("status"),
            "priceOffer": a.get("priceOffer"),
            "applicant": a.get("applicant"),
            "helpRequest": a.get("helpRequest")
        })

    browser.close()
