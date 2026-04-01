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

// Production: set CORS_ORIGIN in Vercel to your frontend origin, e.g. https://upisense.app (no trailing slash)
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://upi-sense.vercel.app';

async function handler(req, res) {
  // ✅ Set CORS headers on every response
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // ✅ Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const app = await getApp();
  // Use path only: Vercel may send full URL or path; Fastify expects path + query
  let url = req.url || '/';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const u = new URL(url);
      url = u.pathname + (u.search || '');
    } catch (_) {}
  }
  if (!url.startsWith('/')) url = '/' + url;
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

if (process.env.VERCEL === '1') {
  module.exports = handler;
} else {
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