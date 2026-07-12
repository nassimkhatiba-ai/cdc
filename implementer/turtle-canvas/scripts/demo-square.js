#!/usr/bin/env node
/** Quick self-test: draw a colored square + circle via in-process tool calls. */
'use strict';

const { spawn } = require('child_process');
const path = require('path');

const server = path.join(__dirname, '..', 'bin', 'turtle-canvas-mcp.js');

function rpc(child, id, method, params) {
  return new Promise((resolve, reject) => {
    const onData = (buf) => {
      for (const line of buf.toString().split('\n')) {
        if (!line.trim()) continue;
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          continue;
        }
        if (msg.id === id) {
          child.stdout.off('data', onData);
          if (msg.error) reject(new Error(JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      }
    };
    child.stdout.on('data', onData);
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}

(async () => {
  const child = spawn(process.execPath, [server], {
    stdio: ['pipe', 'pipe', 'inherit'],
    env: { ...process.env, TURTLE_CANVAS_DIR: path.join(__dirname, '..', 'canvases') },
  });
  await rpc(child, 1, 'initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'demo', version: '1' },
  });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

  const call = async (id, name, args) => {
    const r = await rpc(child, id, 'tools/call', { name, arguments: args });
    const text = r.content?.[0]?.text || JSON.stringify(r);
    return JSON.parse(text);
  };

  let id = 2;
  console.log(await call(id++, 'canvas_new', { name: 'demo_square', width: 400, height: 400, overwrite: true }));
  console.log(
    await call(id++, 'turtle_batch', {
      name: 'demo_square',
      commands: [
        { op: 'penup' },
        { op: 'goto', x: 120, y: 280 },
        { op: 'pendown' },
        { op: 'pencolor', color: '#2563eb' },
        { op: 'pensize', size: 4 },
        { op: 'setheading', heading: 0 },
        // square
        { op: 'forward', distance: 160 },
        { op: 'right', angle: 90 },
        { op: 'forward', distance: 160 },
        { op: 'right', angle: 90 },
        { op: 'forward', distance: 160 },
        { op: 'right', angle: 90 },
        { op: 'forward', distance: 160 },
        // sun
        { op: 'penup' },
        { op: 'goto', x: 300, y: 80 },
        { op: 'pendown' },
        { op: 'pencolor', color: '#f59e0b' },
        { op: 'fillcolor', color: '#fbbf24' },
        { op: 'circle', radius: 40 },
        { op: 'text', text: 'turtle-canvas', x: 20, y: 30, size: 18, color: '#111' },
      ],
    }),
  );
  console.log(await call(id++, 'canvas_snapshot', { name: 'demo_square' }));
  child.kill();
  console.log('SVG:', path.join(__dirname, '..', 'canvases', 'demo_square.svg'));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
