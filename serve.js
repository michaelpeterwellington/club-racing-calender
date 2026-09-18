// Tiny static server for dist/. Not for production — just for looking at the site.
//   node serve.js            -> first free port from 4321
//   node serve.js 5000       -> start looking at 5000
//   PORT=5000 node serve.js
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const ROOT = 'dist';
const START = Number(process.argv[2] || process.env.PORT || 4321);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.ics': 'text/calendar; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let path = normalize(join(ROOT, url));
  if (!path.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }
  if (!extname(path)) path = join(path, 'index.html');
  try {
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end('<h1>404</h1><p>Nothing at <code>' + url.replace(/[<&]/g, '') + '</code>. <a href="/">Back to the calendar</a>.</p>');
  }
});

let port = START;
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && port < START + 20) {
    console.log(`  port ${port} is busy, trying ${port + 1}…`);
    server.listen(++port);
  } else if (err.code === 'EADDRINUSE') {
    console.error(`\nCouldn't find a free port between ${START} and ${port}. Pass one: node serve.js 9000\n`);
    process.exit(1);
  } else {
    console.error(err.message);
    process.exit(1);
  }
});
server.listen(port, () => console.log(`\n  UK Race Calendar running at  http://localhost:${port}\n  Ctrl-C to stop.\n`));
