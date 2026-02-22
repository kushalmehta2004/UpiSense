/**
 * Entry: local server (node index.js) or Vercel serverless (exported handler)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { buildApp } = require('./app.js');

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

let appPromise = null;
function getApp() {
  if (!appPromise) appPromise = buildApp();
  return appPromise;
}

/**
 * Vercel serverless handler: one handler for all routes (GET webhook verify, POST webhook, etc.)
 */
async function handler(req, res) {
  const app = await getApp();
  const url = req.url || '/';
  const method = req.method || 'GET';
  let payload;
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      const raw = await readBody(req);
      payload = raw && raw.length > 0 ? raw : undefined;
    } catch (e) {
      payload = undefined;
    }
  }
  const headers = { ...req.headers };
  if (payload && !headers['content-type']) {
    headers['content-type'] = 'application/json';
  }
  const response = await app.inject({
    method,
    url,
    headers,
    payload
  });
  res.statusCode = response.statusCode;
  Object.keys(response.headers).forEach((k) => {
    const v = response.headers[k];
    if (v !== undefined) res.setHeader(k, v);
  });
  res.end(response.rawPayload && response.rawPayload.length > 0 ? response.rawPayload : response.payload);
}

// When running on Vercel, export the handler
if (process.env.VERCEL === '1') {
  module.exports = handler;
} else {
  // Local: start HTTP server
  const start = async () => {
    try {
      const app = await buildApp();
      await app.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
      console.log(`✅ Server running on http://localhost:${process.env.PORT || 3000}`);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  };
  start();
}
