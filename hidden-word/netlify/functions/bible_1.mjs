// Hidden Word: private connector to the Bible services.
// Keys live ONLY in Netlify's settings ("Keys and secrets"), never in the app people download:
//   API_BIBLE_KEY  - from api.bible (most versions)
//   ESV_API_KEY    - from api.esv.org (the ESV, from Crossway)

const BASE = process.env.API_BIBLE_BASE || 'https://rest.api.bible/v1';
const ESV = 'https://api.esv.org/v3/passage';
const SAFE = /^[A-Za-z0-9._-]{1,80}$/;
const env = name => (globalThis.Netlify && Netlify.env.get(name)) || process.env[name];

const reply = (body, status = 200, maxAge = 86400) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': status === 200 ? `public, max-age=${maxAge}` : 'no-store'
    }
  });

async function esv(path, params) {
  const key = env('ESV_API_KEY');
  if (!key) return reply({ error: 'ESV_API_KEY is not set in Netlify' }, 500);
  const r = await fetch(`${ESV}/${path}/?${new URLSearchParams(params)}`, { headers: { Authorization: `Token ${key}` } });
  if (!r.ok) return reply({ error: 'ESV service error', status: r.status }, r.status);
  return r.json();
}

export default async (req) => {
  const p = new URL(req.url).searchParams;
  const action = p.get('action');
  const bible = p.get('bible') || '';
  const key = env('API_BIBLE_KEY');

  try {
    // ---- ESV (Crossway) ----
    if (bible === 'ESV') {
      if (action === 'passage') {
        const label = (p.get('label') || '').slice(0, 80);
        if (!label) return reply({ error: 'bad request' }, 400);
        const j = await esv('text', { q: label, 'include-passage-references': 'false', 'include-verse-numbers': 'false', 'include-first-verse-numbers': 'false', 'include-footnotes': 'false', 'include-footnote-body': 'false', 'include-headings': 'false', 'include-short-copyright': 'false', 'include-selahs': 'true', 'indent-paragraphs': '0', 'indent-poetry': 'false', 'indent-declares': '0', 'indent-psalm-doxology': '0' });
        if (j instanceof Response) return j;
        return reply({ data: { content: (j.passages || []).join(' ').replace(/\s+/g, ' ').trim(), reference: j.canonical } });
      }
      if (action === 'search') {
        const q = (p.get('q') || '').slice(0, 100);
        const j = await esv('search', { q, 'page-size': '10' });
        if (j instanceof Response) return j;
        return reply({ data: { verses: (j.results || []).map(x => ({ id: x.reference, reference: x.reference, text: x.content })) } }, 200, 3600);
      }
      return reply({ error: 'unknown action' }, 400);
    }

    // ---- API.Bible ----
    if (!key) return reply({ error: 'API_BIBLE_KEY is not set in Netlify' }, 500);
    let target;
    if (action === 'bibles') {
      const r = await fetch(`${BASE}/bibles?language=eng`, { headers: { 'api-key': key } });
      const j = await r.json().catch(() => ({ data: [] }));
      const data = Array.isArray(j.data) ? j.data : [];
      if (env('ESV_API_KEY')) data.unshift({ id: 'ESV', abbreviation: 'ESV', abbreviationLocal: 'ESV', name: 'English Standard Version', nameLocal: 'English Standard Version' });
      return reply({ data }, r.ok ? 200 : r.status);
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
    const r = await fetch(target, { headers: { 'api-key': key } });
    return reply(await r.text(), r.status, action === 'search' ? 3600 : 86400);
  } catch (e) {
    return reply({ error: 'Could not reach the Bible service' }, 502);
  }
};

export const config = { path: '/api/bible' };
