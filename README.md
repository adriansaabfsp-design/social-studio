# Social Studio

A private, local social media studio for any business. Add as many workspaces as you like (a café, a clinic, a shop, your clients); each has its own brand kit, team, calendar, ideas and analytics, and nothing mixes.

## Open the app

Double-click **Start Social Studio.command**, or run `npm run dev` in this folder, then open <http://localhost:4317>. Node 24 is required for the built-in SQLite database. To run the production version: `npm run build`, then `npm start`.

## First run

1. Welcome, then the database screen: after cloning, ask your own AI agent to set up the database and sign-in. It follows `AGENTS.md` and asks how you want to log in. Then log in (out of the box: email and password stored on this computer).
2. Onboarding: your name, your business name, a long "about you" (type, dictate or upload files), a long "about your business" with photos and documents, your social links, look & feel, then voice & content pillars (AI can draft them).
3. After onboarding, pop-ups walk through three steps your AI agent does in its own browser and writes back through the local API: a first **AI overview** of your social media, a **competitor comparison** (you add competitor links), then adding your **team**. Each step just asks you to tell your AI; `AGENTS.md` tells the agent what to do.

You can update **Personal files** and **Business files** at any time; your AI reads them.

## Studio and AI brain

The sidebar has two sides. **Studio** is what people work with every day: the overview, calendar, tasks, campaigns, ideas, scripts and teleprompter, team, analytics and feedback. **AI brain** is what the AI knows and follows: the departments, what it saw (AI overview, competitors, audience, AI analysis), and memory and rules (personal files, business files, brand kit).

**Departments** are AI specialists, each owning one job: Video editor, Video editor supervisor (coaches the editor on storytelling and watchability), Instagram, TikTok, LinkedIn, Facebook, YouTube, Copywriter, Graphic designer, Content strategist, Community manager, or your own. Use **Teach your AI** (top bar) to paste links, notes or files into a department. The built-in local AI learns from each one right away (six sampled frames for videos, the text for articles and documents), coaches add their notes, and every department keeps a playbook, a journal and an Ask box. Your own AI agent goes deeper, watches accounts and keeps playbooks current (`AGENTS.md`, section 5).

## Included in phase one

- Unlimited workspaces, created with a setup wizard and industry templates (restaurant, clinic, real estate, retail, fitness, beauty, agency, education, other) that prefill content pillars, voice and review rules. Optional starter plan.
- Editable brand kit per workspace: logo, cover photo, colors (the whole interface re-themes), tagline, audience, voice, always/never rules, review rule, pillars, languages, time zone, social handles and a shared media library. "Draft with AI" fills voice, audience and pillars from one sentence.
- Every AI feature reads the workspace's brand kit, so suggestions match each business.
- Team & personalities: on-camera profiles, AI speaker suggestions, script tailoring, reference photos and ElevenLabs voice cloning.
- Content calendar with week/month views, filming briefs, channels, statuses, scripts, captions and calendar export.
- Tasks, campaigns, idea collection from text, links, local media and voice recordings.
- Script editing and a teleprompter with countdown, playback, speed, text size, mirror and full screen.
- Post and account analytics, screenshot OCR with human review, manual entry, CSV import/export, cumulative snapshots and per-format averages.
- Feedback and complaints with audio recording/upload, local transcription and AI recommendations when the local dependencies are ready.
- Audience evidence from screenshots or short screen recordings. OCR candidates must be reviewed and linked to a post; repeated frames are deduplicated.
- Local AI idea development, visual reference analysis and workspace insight boards when the model is installed.
- JSON workspace export. Original uploads and the SQLite database remain in `.data/`.

## Analytics workflow

1. Create the content item and mark its actual publication date, format and channel.
2. Open **Analytics → Import screenshots** and upload an Insights screenshot.
3. Check the source image alongside the extracted metrics. Select the matching post or account and capture date. Correct missing or uncertain numbers before saving.
4. Save verified metrics. The source image remains attached to the snapshot. Repeat later to keep historical snapshots; totals use the latest snapshot per post/platform rather than adding cumulative snapshots together.

An unknown metric is blank, never zero. Account totals are kept separate from post totals. The aggregate engagement rate is withheld when contributing records lack the required fields. Public comment totals and the partial sample of observed commenters are different fields. Format averages exclude missing values; small samples, post age, promotion and collaboration can affect comparisons.


## Local tools

- Apple Vision OCR: `tools/ocr.swift`, compiled to `.data/bin/studio-ocr`.
- Ollama vision/text model: `qwen3-vl:2b`; model download must finish before generative analysis is available.
- FFmpeg/FFprobe: local media preparation and sampled frames.
- yt-dlp in `.venv`: public reference links. Some platforms require sign-in and may block downloads; upload a local copy when that happens.
- MLX Whisper in `.voice-venv`: `mlx-community/whisper-large-v3-turbo`, using the existing model cache on this Mac. Dependency installation must finish before transcription is available.

Run **Prepare Local AI.command** to install/resume these local dependencies. The Settings page shows current readiness. OCR can extract clearly labeled English metrics without the language model. It can miss isolated digits, icon-only metrics, layouts or languages; always review the extraction. Voice audio is transcribed for up to ten minutes. Video analysis reviews six sampled visual frames, not continuous motion; it does not claim to understand audio unless a transcript is present. Audience screen recordings are sampled at up to 24 frames over three minutes.

## Local storage and future automation

The server binds only to `127.0.0.1`. It is designed for one Mac owner, with no public hosting or multi-user authentication. No Instagram credentials are stored and no content is automatically published. The interface uses locally saved media. Model and dependency downloads need an internet connection.

Back up the entire `.data/` directory while the app is stopped to preserve the database and attachments together. JSON exports contain records and media paths, not the media files themselves. Treat complaint recordings and screenshots as private workspace material.

Daily AI jobs, an MCP interface and direct social account sync are reserved for phase two. The existing local HTTP API and structured evidence records are a suitable foundation; a separate MCP server is not needed to use phase one. See `API.md` for the local contract.

## Validation

`npm test` verifies workspace isolation, durable storage, cascading content removal, validation, allowed video hosts, unknown-vs-zero metrics and OCR label matching. `npm run build` checks the production bundle. Browser checks cover saved content, scripts, teleprompter controls, brand switching and analytics import.
