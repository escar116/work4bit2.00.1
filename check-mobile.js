import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\charles\\.gemini\\antigravity\\brain\\2dcbce95-d155-4f78-82c5-cabf4dd81ced';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9228',
    '--user-data-dir=C:\\temp\\edge_mobile_' + Date.now(),
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check'
  ]);

  let version = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9228/json/version');
      version = await res.json();
      break;
    } catch (e) {}
  }

  if (!version) {
    console.error('Failed to connect to Edge CDP on port 9228');
    edge.kill();
    process.exit(1);
  }

  console.log('Edge CDP ready:', version.Browser);

  async function openMobilePage(url) {
    const targetRes = await fetch(`http://127.0.0.1:9228/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
    const target = await targetRes.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        const handler = (evt) => {
          const data = JSON.parse(evt.data);
          if (data.id === id) {
            ws.removeEventListener('message', handler);
            resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    // Set mobile device metrics (390 x 844, scale 2)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    // Wait for content render
    await sleep(2000);

    return { ws, send, target };
  }

  async function captureFullPage(page, filename) {
    // Scroll down to trigger any lazy loaders/transitions
    await page.send('Runtime.evaluate', { expression: 'window.scrollTo(0, document.body.scrollHeight)' });
    await sleep(800);
    await page.send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
    await sleep(400);

    const shot = await page.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true
    });

    const buf = Buffer.from(shot.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buf);
    console.log(`Saved full page mobile screenshot: ${filename} (${buf.length} bytes)`);
  }

  async function captureBottomView(page, filename) {
    await page.send('Runtime.evaluate', { expression: 'window.scrollTo(0, document.body.scrollHeight)' });
    await sleep(600);

    const shot = await page.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false
    });

    const buf = Buffer.from(shot.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buf);
    console.log(`Saved scrolled-bottom mobile screenshot: ${filename} (${buf.length} bytes)`);
  }

  async function closePage(page) {
    page.ws.close();
    await fetch(`http://127.0.0.1:9228/json/close/${page.target.id}`);
  }

  const sections = [
    { name: 'landing', url: 'http://localhost:4173/' },
    { name: 'dashboard', url: 'http://localhost:4173/?dev_preview=dashboard' },
    { name: 'services', url: 'http://localhost:4173/?dev_preview=services' },
    { name: 'mentoring', url: 'http://localhost:4173/?dev_preview=mentoring' },
    { name: 'applications', url: 'http://localhost:4173/?dev_preview=applications' },
    { name: 'messages', url: 'http://localhost:4173/?dev_preview=messages' },
    { name: 'transactions', url: 'http://localhost:4173/?dev_preview=transactions' },
    { name: 'logs', url: 'http://localhost:4173/?dev_preview=logs' },
    { name: 'profile', url: 'http://localhost:4173/?dev_preview=profile' },
    { name: 'admin', url: 'http://localhost:4173/?dev_preview=admin' }
  ];

  try {
    for (const sec of sections) {
      console.log(`Checking mobile view: ${sec.name}...`);
      const page = await openMobilePage(sec.url);
      await captureFullPage(page, `mobile_full_${sec.name}.png`);
      await captureBottomView(page, `mobile_bottom_${sec.name}.png`);
      await closePage(page);
    }

    // Also check Mobile Drawer (open sidebar menu)
    console.log('Checking mobile drawer...');
    const drawerPage = await openMobilePage('http://localhost:4173/?dev_preview=dashboard');
    await drawerPage.send('Runtime.evaluate', { expression: 'document.querySelector(".workspace-menu")?.click()' });
    await sleep(600);
    const drawerShot = await drawerPage.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'mobile_sidebar_drawer.png'), Buffer.from(drawerShot.data, 'base64'));
    console.log('Saved mobile drawer screenshot');
    await closePage(drawerPage);

  } finally {
    edge.kill();
  }

  console.log('ALL MOBILE CHECKS COMPLETE!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
