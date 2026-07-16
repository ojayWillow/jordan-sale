# Project status — Jordan sale

_Snapshot of where things stand, so any session can pick up cleanly._

## Live now (on `main`, deployed via Vercel + GitHub Pages)
- **Catalog** — `index.html` + `data.js`. 101 models; **43 have sizes** shown as US·EU chips on cards and in the pop-up gallery. Photos auto-fetched by the image bot (`scripts/fetch-images.js`).
- **Personal chat** — floating "💬 Čats" button. Each visitor gets their **own private thread**, no name/email needed (token stored in their browser). `thread.html` = a buyer's private conversation.
- **Reservations** — the Reserve button opens the same private chat, tagged with the shoe + size. Name is optional.
- **Admin** — `admin.html`, email/password login. Lists every conversation separately (filter chips + **search by name / model / payment reference**), unread dots, reply inline, set status. Polls every ~3s.
- **Bank-transfer payments** — code is live but **OFF** until configured (see below).

## Backend
- **Supabase** project connected in `supabase-config.js` (anon key is public by design).
- Schema + security in `supabase.sql` (already run once). Tables: `reservations`, `messages`.
- Anonymous buyers reach data only via 4 SECURITY DEFINER RPCs: `create_reservation`, `start_chat`, `get_thread`, `post_message`. Admin (authenticated) has full access via RLS.

## Config checklist (the only things a human must do)
- [x] Supabase project created, `supabase.sql` run, admin user added, keys in `supabase-config.js`.
- [ ] **Payments:** fill `payment-config.js` (`iban`, `recipient`) and set `enabled: true`. Until then no payment info shows. IBAN appears only inside a buyer's private chat, plus a 6-char reference the admin can search by.

## Not built yet / next steps
1. **Item locking (agreed, not built)** — reserving should mark the pair as taken, show "Rezervēts" to others, and auto-release if unpaid. Needs a DB availability model (inventory + hold with expiry) + atomic hold in `create_reservation` + availability shown on the catalog. **Open decision:** hold length for bank transfers (5 min is too short — likely a few hours or 24h).
2. **Away notifications** — admin currently only sees new messages when `admin.html` is open. Optional add: email/push when away (needs a Supabase Edge Function or email provider).
3. **Remaining sizes** — 58 models still have none; add from stock export rows when available.

## Branches
- `main` — live, source of truth.
- `claude/reservation-system` — feature branch, currently fully merged into `main`.
- `claude/sneaker-sizes-jordan-sale-2jpu3s` — sizes work, merged into `main`.

## Local preview
```
python -m http.server 5178   # then open http://localhost:5178
```
(External CDNs/Supabase may be blocked in some sandboxes; test the live Vercel URL for the full flow.)
