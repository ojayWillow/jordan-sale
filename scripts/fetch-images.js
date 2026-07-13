// Auto-fetches official product image URLs for every style code in data.js
// and writes them to images.json. Run by GitHub Actions — no manual work.
// Usage: node scripts/fetch-images.js

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

const feedUrl = (code, marketplace, lang) =>
  `https://api.nike.com/product_feed/threads/v3/?filter=marketplace(${marketplace})&filter=language(${lang})&filter=channelId(${CHANNEL_ID})&filter=productInfo.merchProduct.styleColor(${code})`;

function digForImage(obj) {
  // Walk the response for the first plausible product image URL
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
      const url = digForImage(json.objects[0]);
      if (url) return url;
    } catch (e) { /* try next marketplace */ }
  }
  return null;
}

(async () => {
  const codes = [...new Set(SHOES.map(s => s.style))];
  let found = 0, skipped = 0, missing = 0;

  for (const code of codes) {
    if (existing[code]) { skipped++; continue; } // already resolved earlier
    const url = await lookup(code);
    if (url) { existing[code] = url; found++; console.log(`OK   ${code}`); }
    else { missing++; console.log(`MISS ${code}`); }
    await new Promise(r => setTimeout(r, 800)); // be polite to the API
  }

  fs.writeFileSync(OUT, JSON.stringify(existing, null, 2));
  console.log(`\nDone. New: ${found}, already had: ${skipped}, not found: ${missing}`);
  console.log(`Total images: ${Object.keys(existing).length}/${codes.length}`);
})();
