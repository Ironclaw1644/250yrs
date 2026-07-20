# TV-Spot rendering — how it works now (fal.ai, in-app)

The original out-of-band worker contract is retired: rendering is fully
in-app and serverless as of the Ad Studio build.

## Pipeline

1. Owner completes the Ad Studio wizard (`AdStudioWizard`): preset → one
   photo → tagline → tier. No free-form prompts exist anywhere.
2. `submitAiVideo` (src/lib/actions/videos.ts): ownership + daily cap (3/day
   per business) → atomic credit debit → inserts the `business_videos` row
   (`status='pending'`, `thumbnail_url` = source photo, brief carries preset/
   prompt vars/fal model) → submits to the fal queue with our webhook URL
   attached. Submit failure ⇒ auto-refund + rejected row.
3. fal renders (2–5 min) and POSTs `/api/webhooks/fal?token=…&video=…`.
4. `finalizeAiVideo` (src/lib/video-finalize.ts): re-fetches the result from
   fal's API (never trusts the webhook body), downloads the mp4 into
   `taw-media/business/{id}/videos/gen-{videoId}.mp4`, sets `url`, and leaves
   `status='pending'` so the spot lands in the existing `/admin/videos`
   approval queue. Owner + admin notified. FAILED renders ⇒ rejected +
   credits refunded + owner notified.
5. Missed webhooks self-heal: the owner's TV Ads page runs
   `reconcilePendingVideos` on load for pending rows older than 2 minutes.

## Models & knobs (env-overridable, see src/lib/fal.ts)

| Tier | Credits | Default model | Length |
|---|---|---|---|
| Motion | 1 | `fal-ai/kling-video/v2.1/standard/image-to-video` | 5s, silent |
| Premium | 3 | `fal-ai/veo3/fast/image-to-video` | 8s, with audio |

Override with `FAL_MODEL_MOTION` / `FAL_MODEL_PREMIUM`.

## Env

- `FAL_KEY` — fal.ai API key. Absent ⇒ studio shows "warming up", nothing
  can be submitted, no credits at risk.
- `FAL_WEBHOOK_TOKEN` — random secret baked into the webhook URL.

## Activation checklist for a new key

1. Paste `FAL_KEY=` into `.env.local`.
2. Verify: `curl -s -o /dev/null -w "%{http_code}" -X POST
   https://queue.fal.run/fal-ai/flux/schnell -H "Authorization: Key $FAL_KEY"
   -H "Content-Type: application/json" -d '{}'` → **422** means the key is
   live (401 = dead).
3. Probe the two tier models the same way (422 = model id valid).
4. Push `FAL_KEY` to Vercel production + redeploy.
