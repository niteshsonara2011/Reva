# Geyvak

A friendly shopping companion that helps people compare products and find better value. Real-time AI replies, mobile-first design, installable as a phone app.

Built with Next.js 15, Tailwind v4, the Anthropic API, and a small amount of taste.

---

## What you get

- A streaming chat UI that calls Claude (Sonnet 4.6 by default)
- Server-side proxy so your API key is never exposed to the browser
- 24-hour local chat history (auto-clears after inactivity)
- PWA-ready — users can install it to their home screen with no app store

---

## Project layout

```
geyvak/
├─ app/
│  ├─ api/chat/route.ts   ← server proxy (streams from Anthropic)
│  ├─ globals.css
│  ├─ layout.tsx          ← page metadata, PWA + iOS tags
│  ├─ manifest.ts         ← PWA manifest
│  └─ page.tsx
├─ components/
│  └─ GeyvakChat.tsx      ← the chat UI
├─ public/                ← icons (192, 512, maskable, apple-touch, favicon)
├─ .env.local.example
└─ package.json
```

---

## 1. Run it locally first

You need Node 18.18+ (20+ recommended).

```bash
npm install
cp .env.local.example .env.local
```

Open `.env.local`, paste your Anthropic key (get one at <https://console.anthropic.com/>):

```
ANTHROPIC_API_KEY=sk-ant-...
```

Then:

```bash
npm run dev
```

Visit <http://localhost:3000>. Tap a quick prompt or type a question. You should see streaming text appear within a second.

---

## 2. Deploy to Vercel (the live URL)

This is the step that turns "running on my laptop" into "anyone on the internet can use it."

### A. Push to GitHub

```bash
cd geyvak
git init
git add .
git commit -m "Initial commit"
```

Create an empty repo at <https://github.com/new> (don't check "add README" — you already have one), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/geyvak.git
git branch -M main
git push -u origin main
```

### B. Import into Vercel

1. Go to <https://vercel.com/new>
2. Click **Import** next to your `geyvak` repo (sign in with GitHub if you haven't)
3. Vercel detects Next.js automatically — leave the build settings alone
4. **Expand the "Environment Variables" section** and add:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: your `sk-ant-...` key
5. Click **Deploy**

About 60 seconds later you'll have a URL like `https://geyvak-abc123.vercel.app`. That's your live app. Share that URL.

### C. (Optional) Custom domain

In your Vercel project: **Settings → Domains → Add**. Point your domain's DNS to Vercel and you're at `https://geyvak.com` (or whatever).

### D. Updating

Push to `main` and Vercel auto-redeploys. There is no step 4.

---

## 3. How users install it as an app

Because the app has a manifest and icons, visitors can install it like a native app — no app store, no review process, no fees. Send them the URL and tell them:

**On iPhone (Safari):**
1. Open the URL
2. Tap the Share button (square with arrow)
3. Scroll down → **Add to Home Screen** → **Add**

**On Android (Chrome):**
1. Open the URL
2. Chrome shows an "Install app" banner — tap it
3. Or: tap the **⋮** menu → **Install app** / **Add to Home screen**

**On desktop (Chrome / Edge):**
1. Open the URL
2. Click the **install icon** in the address bar (a small monitor with an arrow)
3. Or: **⋮** menu → **Install Geyvak**

Once installed, it opens in its own window with no browser chrome — looks and feels like a native app. The icon you generated is the launcher icon.

---

## Customizing

| Want to change... | Edit this |
|---|---|
| Assistant's personality | `SYSTEM_PROMPT` in `app/api/chat/route.ts` |
| Model | `model: "claude-sonnet-4-6"` (try `claude-haiku-4-5-20251001` for cheaper/faster) |
| Welcome quick-prompts | `prompts` array in `WelcomeState`, `components/GeyvakChat.tsx` |
| App name shown when installed | `name` / `short_name` in `app/manifest.ts` |
| Icon | replace files in `public/` (or rerun the included icon script with new colors) |
| Color palette | search-replace `#31544c`, `#dbeee8`, etc. across `components/GeyvakChat.tsx` |

---

## Cost

Each conversation is roughly cents on Sonnet 4.6, fractions of a cent on Haiku 4.5. Set a hard cap in the Anthropic console under **Billing → Usage limits** so a runaway loop or a viral moment can't blindside you.

---

## Privacy & retention

Conversations are stored only in the user's browser `localStorage` (key: `geyvak.chat.v1`). The server proxy forwards each message to Anthropic for a reply and keeps no record. Stored history clears automatically after **24 hours of user inactivity**, and tapping the **+** button in the header clears it immediately.

---

## What's not here yet

- The Compare / Saved / Alerts tabs (placeholder)
- Offline support (service worker) — the app needs a connection to chat anyway
- Push notifications

Holler if you want any of these.
