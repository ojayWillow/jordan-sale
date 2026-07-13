// Auto-fetches official product image galleries for every style code in data.js
// and writes them to images.json as { style: [url, url, ...] }. Run by GitHub
// Actions — no manual work.  Usage: node scripts/fetch-images.js

const fs = require('fs');
const path = require('path');
const SHOES = require('../data.js');

const OUT = path.join(__dirname, '..', 'images.json');
const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json'
};

// Nike.com storefront channel — required by the product_feed API, else it 400s.
const CHANNEL_ID = 'd9a5bc42-4b9c-4976-858a-f159cf99c647';
const MAX_IMAGES = 8; // gallery angles to keep per shoe

const feedUrl = (code, marketplace, lang) =>
  `https://api.nike.com/product_feed/threads/v3/?filter=marketplace(${marketplace})&filter=language(${lang})&filter=channelId(${CHANNEL_ID})&filter=productInfo.merchProduct.styleColor(${code})`;

// The PDP gallery lives in publishedContent.nodes -> a "carousel" node whose
// child image nodes each carry a squarishURL/portraitURL.
function galleryFrom(obj) {
  const nodes = (obj && obj.publishedContent && obj.publishedContent.nodes) || [];
  const carousel = nodes.find(n => (n.subType || n.type) === 'carousel');
  const out = [];
  if (carousel && Array.isArray(carousel.nodes)) {
    for (const n of carousel.nodes) {
      const p = n.properties || {};
      const url = p.squarishURL || p.portraitURL || (p.image && p.image.url) || p.url;
      if (url && !out.includes(url)) out.push(url);
      if (out.length >= MAX_IMAGES) break;
    }
  }
  return out;
}

// Fallback: walk the response for the first plausible single product image.
function digForImage(obj) {
  const found = [];
  (function walk(o) {
    if (!o || typeof o !== 'object' || found.length) return;
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string' && /^https:\/\/.*(nike|scene7).*\.(jpg|jpeg|png|webp)?/i.test(v)
          && /(squarish|portrait|productImage|images\/t_)/i.test(k + v)) {
        found.push(v);
        return;
      }
      if (typeof v === 'object') walk(v);
    }
  })(obj);
  return found[0] || null;
}

async function lookup(code) {
  for (const [mp, lang] of [['US', 'en'], ['GB', 'en-GB'], ['DE', 'de']]) {
    try {
      const res = await fetch(feedUrl(code, mp, lang), { headers: HEADERS });
      if (!res.ok) continue;
      const json = await res.json();
      if (!json.objects || !json.objects.length) continue;
      const gallery = galleryFrom(json.objects[0]);
      if (gallery.length) return gallery;
      const single = digForImage(json.objects[0]);
      if (single) return [single];
    } catch (e) { /* try next marketplace */ }
  }
  return null;
}

(async () => {
  const codes = [...new Set(SHOES.map(s => s.style))];
  let found = 0, skipped = 0, missing = 0;

  for (const code of codes) {
    // Skip only if we already have a proper gallery array; re-fetch old
    // single-string entries so they get upgraded to multi-image galleries.
    if (Array.isArray(existing[code]) && existing[code].length) { skipped++; continue; }
    const gallery = await lookup(code);
    if (gallery) { existing[code] = gallery; found++; console.log(`OK   ${code}  (${gallery.length} img)`); }
    else { missing++; console.log(`MISS ${code}`); }
    await new Promise(r => setTimeout(r, 800)); // be polite to the API
  }

  fs.writeFileSync(OUT, JSON.stringify(existing, null, 2));
  console.log(`\nDone. New: ${found}, already had: ${skipped}, not found: ${missing}`);
  console.log(`Total: ${Object.keys(existing).length}/${codes.length} styles with images`);
})();
