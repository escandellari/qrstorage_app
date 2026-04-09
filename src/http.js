export function sendHtml(response, statusCode, html, headers = {}) {
  response.writeHead(statusCode, {
    'content-type': 'text/html; charset=utf-8',
    ...headers,
  });
  response.end(html);
}

export function redirect(response, location, headers = {}) {
  response.writeHead(302, { location, ...headers });
  response.end();
}

export function sendNotFound(response) {
  response.writeHead(404);
  response.end('Not found');
}

export async function readFormBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  return new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
}

export function normalizeBaseUrl(baseUrl) {
  return String(baseUrl).replace(/\/$/, '');
}
