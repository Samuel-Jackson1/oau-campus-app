// serve.mjs - a tiny local web server for testing on your own computer.
//
// Run:  npm start      then open http://localhost:8000
//
// (Opening index.html by double-clicking does NOT work: browsers block
// loading the JSON files from a file:// address.)

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 8000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.mp3': 'audio/mpeg'
};

http.createServer(async (req, res) => {
  let urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403).end('Forbidden'); return; }
  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end(`Not found: ${urlPath}`);
  }
}).listen(PORT, () => {
  console.log(`Serving ${ROOT}`);
  console.log(`Open http://localhost:${PORT}  (Ctrl+C to stop)`);
});
