# Local API

Base URL: `http://127.0.0.1:4317`. All data endpoints are scoped to a workspace id (`:brand`), created through `/api/workspaces`. The server rejects external Host and Origin values and binds only to loopback. Do not expose it publicly without adding authentication and access controls.

- Authentication: every endpoint except `/api/auth/*` and `/api/health` needs the `studio_session` cookie (from `POST /api/auth/signup` or `/api/auth/login` with `{email, password}`) or `Authorization: Bearer <.data/agent-key>`. `GET /api/auth/session` reports the state; `POST /api/auth/logout` ends it. The provider is set by `AUTH_PROVIDER` in `.env` (see `AGENTS.md`).
- `GET/POST /api/invites`, `PATCH/DELETE /api/invites/:id`: people the owner wants to share the studio with (`status`: pending, sent, joined). Invited emails may create an account even when sign-up is closed.
- `GET/POST /api/workspaces`, `PUT/DELETE /api/workspaces/:id` (delete needs `{confirm: <exact name>}`): workspaces and their brand kits. `POST /api/workspaces/draft`: AI brand-kit draft. `POST /api/workspaces/:id/image/logo|hero` and `/assets`: images.
- `GET/PUT /api/profile`: the owner's name.
- `GET /api/health`: local model, OCR, video reader and transcription readiness.
- `GET /api/:brand/state`: all workspace collections.
- `GET /api/:brand/export`: versioned JSON export.
- `POST /api/:brand/:collection`, `PUT /api/:brand/:collection/:id`, `DELETE /api/:brand/:collection/:id`: validated CRUD; see `server/schema.mjs`. Server-owned import/report collections cannot be created through generic POST.
- `POST /api/:brand/ideas/:id/media`: multipart `file` for an image or video reference.
- `POST /api/:brand/ideas/:id/analyze`: start local idea/script or visual analysis.
- `POST /api/:brand/:collection/:id/audio`: multipart audio for `ideas` or `complaints`.
- `POST /api/:brand/complaints/:id/analyze`: local complaint analysis and optional transcription.
- `POST /api/:brand/analytics/screenshot`: multipart image, creates a reviewable import.
- `POST /api/:brand/analytics/imports/:id/complete`: `{metricId}` links a verified saved snapshot to the retained import.
- `POST /api/:brand/analytics/insights`: create an asynchronous workspace report.
- `POST /api/:brand/audience/scan`: multipart image/video, extracts handle candidates for review.

Poll `state` while an asynchronous status is pending. Jobs are local to the process; interrupted jobs become failed after restart. Review failures are surfaced rather than silently fabricating results. Model execution is serialized, and generated results are validated before saving.

Metric snapshots are cumulative, with separate account/post scope and platform. `null` means unknown. `observedComments` is a partial browser sample, whereas `comments` is a visible or verified total. `evidenceUrl`, `source`, `visiblePeriod`, `date`, `created` and `updated` preserve provenance. Use the latest snapshot for each scope/post/platform; never sum repeated cumulative snapshots. Audience observations are deduplicated by brand/platform/handle/post/action. Content deletion removes associated metrics and audience observations and unlinks tasks.

Future scheduled jobs can use these local records and persist reports into `insights`. A future MCP adapter can wrap the same domain validation. Neither scheduled jobs nor MCP endpoints are enabled in phase one.
