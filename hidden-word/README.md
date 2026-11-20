# Hidden Word

A Bible memorization app: learn verses by subject, keep them with spaced review, organize your own collections, and share verse cards.

- **Works right away** with the King James Version (built in, works offline).
- **More versions** (NKJV, NLT, CSB, WEB and others) appear once you connect your API.Bible key.
- **Private by design:** each person's progress is saved on their own phone. No accounts, no tracking.

## What's in this folder

| File | What it does |
| --- | --- |
| `public/index.html` | The whole app |
| `public/manifest.webmanifest`, `icon-192.png`, `icon-512.png` | Lets people add it to their home screen like an app |
| `public/sw.js` | Lets the app open without internet |
| `netlify/functions/bible.mjs` | The private connector to API.Bible. Your key stays here, hidden. |
| `netlify.toml` | Tells Netlify how to put it online |

## Put it online (about 20 minutes, free)

1. **Make a GitHub account** at github.com (free).
2. **Create a new repository** called `hidden-word`. Choose "uploading an existing file" and drag in everything from this folder (keep the folders as they are). Click **Commit changes**.
3. **Make a Netlify account** at netlify.com and sign in with GitHub.
4. Click **Add new site → Import an existing project → GitHub**, pick `hidden-word`, and click **Deploy**. Leave the build settings as they are.
5. **Add your key:** in Netlify go to **Site configuration → Environment variables → Add a variable**.
   - Key: `API_BIBLE_KEY`
   - Value: your API.Bible key
   Then go to **Deploys → Trigger deploy → Deploy site** so the key takes effect.
6. Open your new web address on your phone. In Safari tap **Share → Add to Home Screen**; in Chrome tap **⋮ → Add to Home screen**.

### Your own web address
In Netlify: **Domain management → Add a domain** (for example `hiddenword.app`, about $15/year).

## Making changes later
Edit a file on GitHub and click **Commit**. Netlify updates the live app within a minute.

## Notes
- If API.Bible gives you a different web address for their service, add a second environment variable `API_BIBLE_BASE` with that address (default is `https://rest.api.bible/v1`).
- API.Bible's free Starter plan is for non-commercial apps. Ads, subscriptions or paid upgrades need their paid plan first.
- Before publishing to the App Store or Google Play you'll need a privacy policy page. A simple one is fine: "Hidden Word stores your progress only on your device and does not collect personal information."
