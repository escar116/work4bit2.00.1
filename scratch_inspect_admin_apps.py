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

    # Call listAllApplicationsAdmin
    res = page.evaluate('''async () => {
        // Navigate to Admin tab
        document.querySelector('.nav-btn[data-target="admin"]')?.click();
        await new Promise(r => setTimeout(r, 2000));
        
        // Click Applications tab
        document.querySelector('.admin-tab-btn[data-admintab="applications"]')?.click();
        await new Promise(r => setTimeout(r, 2000));

        const appRows = Array.from(document.querySelectorAll('#admin-applications-tbody tr')).map(tr => ({
            text: tr.textContent.replace(/\s+/g, ' ').trim()
        }));
        
        return {
            appRowsCount: appRows.length,
            sampleRows: appRows
        };
    }''')
    print("ADMIN APPS RESULT:", res)
    browser.close()
