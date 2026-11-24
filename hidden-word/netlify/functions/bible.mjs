// Hidden Word: private connector to API.Bible.
// Your API key lives ONLY in Netlify's environment settings (API_BIBLE_KEY),
// never in the app the public downloads.

const BASE = process.env.API_BIBLE_BASE || 'https://rest.api.bible/v1';
const SAFE = /^[A-Za-z0-9._-]{1,80}$/;

const reply = (body, status = 200, maxAge = 86400) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': status === 200 ? `public, max-age=${maxAge}` : 'no-store'
    }
  });

export default async (req) => {
  const key = (globalThis.Netlify && Netlify.env.get('API_BIBLE_KEY')) || process.env.API_BIBLE_KEY;
  if (!key) return reply({ error: 'API_BIBLE_KEY is not set in Netlify' }, 500);

  const p = new URL(req.url).searchParams;
  const action = p.get('action');
  const bible = p.get('bible') || '';
  let target;

  if (action === 'bibles') {
    target = `${BASE}/bibles?language=eng`;
  } else if (action === 'passage') {
    const ref = p.get('ref') || '';
    if (!SAFE.test(bible) || !SAFE.test(ref)) return reply({ error: 'bad request' }, 400);
    target = `${BASE}/bibles/${bible}/passages/${ref}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false&include-verse-spans=false`;
  } else if (action === 'chapter') {
    const chapter = p.get('chapter') || '';
    if (!SAFE.test(bible) || !SAFE.test(chapter)) return reply({ error: 'bad request' }, 400);
    target = `${BASE}/bibles/${bible}/chapters/${chapter}/verses`;
  } else if (action === 'search') {
    const q = (p.get('q') || '').slice(0, 100);
    if (!SAFE.test(bible) || !q.trim()) return reply({ error: 'bad request' }, 400);
    target = `${BASE}/bibles/${bible}/search?query=${encodeURIComponent(q)}&limit=10`;
  } else {
    return reply({ error: 'unknown action' }, 400);
  }

  try {
    const r = await fetch(target, { headers: { 'api-key': key } });
    const text = await r.text();
    return reply(text, r.status, action === 'search' ? 3600 : 86400);
  } catch (e) {
    return reply({ error: 'Could not reach API.Bible' }, 502);
  }
};

export const config = { path: '/api/bible' };
