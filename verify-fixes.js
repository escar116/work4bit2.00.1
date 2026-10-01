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
    '--remote-debugging-port=9230',
    '--user-data-dir=C:\\temp\\edge_verify_' + Date.now(),
    '--disable-gpu',
    '--no-first-run'
  ]);

  let version = null;
  for (let i = 0; i < 20; i++) {
    await sleep(400);
    try {
      const res = await fetch('http://127.0.0.1:9230/json/version');
      version = await res.json();
      break;
    } catch (e) {}
  }

  if (!version) {
    console.error('Edge CDP failed');
    edge.kill();
    process.exit(1);
  }

  async function openMobilePage(url) {
    const targetRes = await fetch(`http://127.0.0.1:9230/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
    const target = await targetRes.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

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

    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await sleep(1500);
    return { ws, send, target };
  }

  try {
    // 1. Verify Services Gap Fix
    console.log('Verifying services gap fix...');
    const pageServices = await openMobilePage('http://localhost:4173/?dev_preview=services');
    await sleep(500);
    const shotServices = await pageServices.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'verify_services_gap_fixed.png'), Buffer.from(shotServices.data, 'base64'));
    console.log('Saved verify_services_gap_fixed.png');
    pageServices.ws.close();

    // 2. Verify Messages Broken Header Fix
    console.log('Verifying messages chat header fix...');
    const pageMessages = await openMobilePage('http://localhost:4173/?dev_preview=messages');
    
    // Wait for initial loadMessages to complete
    await sleep(2500);

    // Inject active conversation UI simulating the user's scenario
    await pageMessages.send('Runtime.evaluate', {
      expression: `(() => {
        const container = document.getElementById('messages-container');
        if (container) container.classList.add('chat-open');
        
        const chatPanel = document.getElementById('chat-panel');
        if (chatPanel) {
          chatPanel.innerHTML = \`
            <div class="chat-header">
              <button type="button" id="chat-back-btn" class="btn btn-outline btn-sm mobile-only">←</button>
              <div id="chat-header-content" class="chat-header-content">
                <div class="chat-header-user-info">
                  <div class="avatar avatar-sm cursor-pointer flex-shrink-0">T</div>
                  <div class="chat-header-user-text">
                    <strong class="cursor-pointer hover:underline">test4</strong>
                    <div style="display: flex; align-items: center; gap: 0.4rem; margin-top: 2px; flex-wrap: wrap;">
                      <small class="text-muted">3D Printing of Enclosure Case</small>
                      <span class="badge badge-request" style="font-size: 10px; padding: 2px 7px;">Service Request</span>
                    </div>
                  </div>
                </div>
                <div class="chat-header-actions">
                  <button type="button" class="btn btn-terminate" id="btn-terminate">Terminate</button>
                  <button type="button" class="btn btn-complete" id="btn-complete">Complete</button>
                </div>
              </div>
            </div>
            <div id="chat-messages" class="chat-messages">
              <div class="message outgoing">
                <div class="message-bubble">sdas</div>
                <span class="text-xs text-muted" style="margin-top: 4px; align-self: flex-end;">Sep 4, 02:28 PM</span>
              </div>
            </div>
            <div class="chat-input-row">
              <button type="button" id="chat-attach-btn" class="chat-attach-btn" title="Attach">📎</button>
              <input type="text" id="chat-input" class="form-control" placeholder="Type a message...">
              <button type="button" id="chat-send-btn" class="btn btn-purple">Send</button>
            </div>
          \`;
        }
      })()`
    });

    await sleep(500);
    const shotMessages = await pageMessages.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'verify_messages_fixed.png'), Buffer.from(shotMessages.data, 'base64'));
    console.log('Saved verify_messages_fixed.png');
    pageMessages.ws.close();

  } finally {
    edge.kill();
  }

  console.log('Verification completed successfully!');
}

run().catch(console.error);
