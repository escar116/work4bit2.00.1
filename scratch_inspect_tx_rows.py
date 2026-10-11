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
    page.wait_for_timeout(1500)

    # Let's inspect listApplicationsByApplicant
    res = page.evaluate('''async () => {
        // Let's call loadTransactions which calls listApplicationsByApplicant
        document.querySelector('.nav-btn[data-target="transactions"]')?.click();
        await new Promise(r => setTimeout(r, 2000));
        
        // Let's check what applications are completed
        const rows = Array.from(document.querySelectorAll('#transactions-tbody tr')).map(tr => {
            const cells = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
            return cells;
        });
        return rows;
    }''')
    for r in res:
        print("ROW:", [c.encode('ascii', errors='replace').decode('ascii') for c in r])
    browser.close()
