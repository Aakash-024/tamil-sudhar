<div align="center">

# தமிழ் சுடர் · Tamil Sudhar

**கதைகளில் தமிழின் ஒளி** — an offline-first storytelling PWA that makes Tamil folk tales
fun to **listen to**, **read** and **remember**.

[![Live demo](https://img.shields.io/badge/▶-Live%20demo-orange?style=for-the-badge)](https://aakash-024.github.io/tamil-sudhar/index.html)
![PWA](https://img.shields.io/badge/PWA-offline%20ready-7c4ddb?style=for-the-badge)
![Stack](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JS-1e293b?style=for-the-badge)
![No build step](https://img.shields.io/badge/build-none-16a34a?style=for-the-badge)

</div>

---

## What it is

Tamil Sudhar is a small, carefully crafted web app for learning Tamil through stories.
Every tale comes with a recorded narration, the original Tamil text, an English translation,
and a three-question comprehension quiz. It works on a phone, on a laptop, and — thanks to
a service worker — even when the internet drops.

> **15 stories · 45 questions · 15 audio tracks · zero dependencies**

---

## ✨ Features

| | Feature | What it does |
|---|---|---|
| 🎧 | **Audio narration** | 15 MP3 tracks with follow-along line highlighting synced to playback |
| 🇮🇳 | **Bilingual reading** | Switch between **தமிழ்**, **English**, or **இரண்டும்** (both) at any time |
| 🧠 | **Comprehension quizzes** | 3 multiple-choice questions per story, instant scoring and retry |
| ⭐ | **Bookmarks** | Save favourites with one tap; filter the library to saved stories only |
| 📈 | **Progress tracking** | Best quiz scores are stored locally and shown as a completion ring |
| 🔍 | **Search & filter** | Find stories by Tamil/English title, theme, tag, or story text; filter by category |
| 🌗 | **Day / night themes** | Warm dark default with a soft daylight mode, both persisted |
| 📱 | **Installable PWA** | Manifest + service worker cache every page, script and audio file for offline use |
| ⌨️ | **Keyboard friendly** | `/` focuses search, `Esc` closes the reader, cards are fully keyboard-operable |
| 🔗 | **Deep links** | Every story has a shareable URL such as `#story-7` |

---

## 🚀 Quick start

No npm, no build, no framework. Just open it.

```bash
git clone https://github.com/Aakash-024/tamil-sudhar.git
cd tamil-sudhar
```

Then either:

- open `index.html` directly in a browser, **or**
- serve it locally so the service worker and audio behave exactly like production:

```bash
python -m http.server 8000
# visit http://localhost:8000
```

> On Windows PowerShell, use `python` — or `py -3` if `python` is not on your PATH.

---

## 🗂 Project structure

```
tamil-sudhar/
├── index.html          # Semantic app shell: hero, library, reader, quiz
├── styles.css          # Full design system, themes, responsive layout, animations
├── app.js              # State, rendering, search, bookmarks, quizzes, audio sync
├── stories.js          # All story content (generated data, safe to edit directly)
├── manifest.json       # PWA metadata (name, colours, icon)
├── service-worker.js   # Offline cache for assets + all 15 audio files
├── icon.png            # 1024×1024 app icon
├── Story-01.mp3 …      # Narration audio
│   Story-15.mp3
└── scripts/
    ├── stories.json    # Canonical, human-editable content dump
    ├── extract-stories.py  # Pulls content out of the legacy single-file app
    └── build-stories.py    # Generates stories.js from stories.json
```

---

## 🧩 How it fits together

```text
stories.js  ──▶  app.js  ──▶  index.html  ──▶  styles.css
   │               │
   │               ├─ render cards, reader and quizzes
   │               ├─ persist bookmarks / scores / preferences in localStorage
   │               └─ sync narration time with highlighted text lines
   │
   └─ each story: { id, title, audio, tamil[], english[], quiz[], category, tag, glyph }

service-worker.js caches: HTML · CSS · JS · manifest · icon · every MP3
```

Everything is static. There is no backend, no analytics, and no tracking.

---

## ➕ Adding a story

1. Add the narration file, e.g. `Story-16.mp3`, next to the existing audio files.
2. Add the story object to `scripts/stories.json` with `tamil`, `english` and `quiz` arrays
   (copy an existing entry as a template).
3. Add its metadata to the `META` map in `scripts/build-stories.py`:
   category key, category label, tag, English title and card emoji.
4. Regenerate the runtime data:

   ```bash
   python scripts/build-stories.py
   ```

5. Increase the track count in `service-worker.js` (the `length: 15` in `CORE_ASSETS`)
   so the new MP3 is cached offline too.

---

## 🌐 Deployment

The app is currently published with GitHub Pages at
**[aakash-024.github.io/tamil-sudhar](https://aakash-024.github.io/tamil-sudhar/index.html)**.

To deploy your own copy:

1. Push the repo to GitHub.
2. Go to **Settings → Pages**.
3. Set **Source** to *Deploy from a branch*, pick `main` / `/ (root)`, and save.
4. Open the generated URL. All paths are relative, so it also works in a subdirectory.

Because it is static, any host works — Netlify, Vercel, Cloudflare Pages, or a plain
`nginx` box. Remember to bump `CACHE_NAME` in `service-worker.js` after a release so
returning visitors receive the new version.

---

## ♿ Accessibility details

- Tamil-first markup (`<html lang="ta">`) with proper labels for controls
- Visible focus rings and full keyboard operation of cards, tabs and quizzes
- `prefers-reduced-motion` support disables floating/spin animations
- A separate `A+` control enlarges story text for comfortable reading
- Quiz answers are revealed after submission so each attempt teaches something

---

## 🗺 Ideas for later

- [ ] Per-story reading-time and audio duration labels
- [ ] Word-level narration sync (currently line-level)
- [ ] Shareable quiz results
- [ ] More folk tales, with themes and difficulty levels
- [ ] Voice recording mode for children retelling a story

---

## 📄 License

No license file has been added yet. Add one (for example MIT) if you plan to share or
fork this project publicly.

<div align="center">

Made with ❤️ for the next generation of Tamil readers.

</div>
