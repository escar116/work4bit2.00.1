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

    # Let's inspect reviews from Firestore and applications from Data Connect
    info = page.evaluate('''async () => {
        // Let's navigate to Services tab which runs loadServices
        document.querySelector('.nav-btn[data-target="services"], .nav-btn[data-target="service-offers"]')?.click();
        await new Promise(r => setTimeout(r, 2500));

        // Let's inspect reviews and completedTxCountsMap
        return {
            providerRatings: window.providerRatingsMap,
            completedTxCountsMap: window.completedTxCountsMap
        };
    }''')
    print("INFO:", info)

    # Let's also check transactions tab
    txs = page.evaluate('''async () => {
        document.querySelector('.nav-btn[data-target="transactions"]')?.click();
        await new Promise(r => setTimeout(r, 2500));
        const rows = Array.from(document.querySelectorAll('#transactions-tbody tr')).map(tr => tr.textContent.replace(/\\s+/g, ' ').trim());
        return rows;
    }''')
    for r in txs:
        print("TX:", r.encode('ascii', errors='replace').decode('ascii'))

    browser.close()
