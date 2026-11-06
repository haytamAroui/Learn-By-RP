// A loopback-only server for the standalone design artifact. No application I/O.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const studio = process.argv.includes('--studio');
const port = studio ? 4376 : 4375;
const artifacts = new Map([
  ['/', studio ? 'lingo-ux-studio-v5.html' : 'lingo-original3-refined.html'],
  ['/lingo-original3-refined.html', 'lingo-original3-refined.html'],
  ['/lingo-ux-studio-v5.html', 'lingo-ux-studio-v5.html'],
]);
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, `http://127.0.0.1:${port}`).pathname;
  const filename = artifacts.get(pathname);
  if (!filename) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  try {
    const html = await readFile(new URL(`../docs/design-2026-10-10/${filename}`, import.meta.url));
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(html);
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('The design artifact could not be opened.');
  }
});
server.on('error', error => {
  console.error(`Design preview could not start: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`Lingo ${studio ? '142-screen Studio' : 'design preview'}: http://127.0.0.1:${port}`));
