import { spawn } from 'child_process';

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  '--remote-debugging-port=9229',
  '--user-data-dir=C:\\temp\\edge_inspect',
  '--disable-gpu',
  '--no-first-run'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9229/json/new?http%3A%2F%2Flocalhost%3A4173%2F%3Fdev_preview%3Dservices', { method: 'PUT' });
    const target = await res.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    ws.onopen = async () => {
      let id = 1;
      const send = (method, params = {}) => new Promise(resolve => {
        const curId = id++;
        const onMsg = (evt) => {
          const d = JSON.parse(evt.data);
          if (d.id === curId) { ws.removeEventListener('message', onMsg); resolve(d.result); }
        };
        ws.addEventListener('message', onMsg);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });

      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
      await new Promise(r => setTimeout(r, 2000));

      const code = `(() => {
        const getBox = sel => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const cs = window.getComputedStyle(el);
          return {
            tag: el.tagName,
            top: r.top, bottom: r.bottom, height: r.height,
            marginTop: cs.marginTop, marginBottom: cs.marginBottom,
            paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom,
            minHeight: cs.minHeight,
            display: cs.display,
            flex: cs.flex,
            className: el.className
          };
        };
        return {
          wrapper: getBox('.services-header-wrapper'),
          top: getBox('.services-header-top'),
          info: getBox('.services-header-info'),
          title: getBox('#section-services .page-title'),
          sub: getBox('#services-header-subtitle'),
          actions: getBox('.services-header-actions'),
          btn: getBox('#btn-post-offer'),
          tabs: getBox('#services-marketplace-tabs')
        };
      })()`;

      const evalRes = await send('Runtime.evaluate', { expression: code, returnByValue: true });
      console.log('BOXES:', JSON.stringify(evalRes.result.value, null, 2));
      edge.kill();
      process.exit(0);
    };
  } catch (err) {
    console.error(err);
    edge.kill();
    process.exit(1);
  }
}, 1500);
