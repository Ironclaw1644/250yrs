# TV-Spot Render Worker — contract (NOT implemented yet)

The site never calls a video-generation API. Owners buy credits, submit a
production brief (`taw.business_videos` row, `status='pending'`,
`source='ai_motion'|'ai_premium'`, inputs in `brief` jsonb), and this worker —
run out-of-band, when the business decides to turn it on — renders the video
and flips the row to ready. This keeps generation costs at exactly $0 until
the client opts in.

## Poll loop

```sql
select id, business_id, source, brief
from taw.business_videos
where status = 'pending' and source like 'ai_%' and url is null
order by created_at
limit 1;
```

Use the service key (`SUPABASE_SECRET_KEY`), schema `taw`. Guard the whole
worker behind `VIDEO_WORKER_ENABLED=1` so it can never run by accident.

## Tier 1 — Motion (`ai_motion`, 1 credit, ~$0 marginal cost)

1. Fetch the photos in `brief.photo_ids` from `taw.business_photos`.
2. Render a 20–30s slideshow: Ken Burns zoom/pan per photo (ffmpeg `zoompan`
   or Remotion), crossfades, navy/gold lower-third with the business name +
   `brief.tagline`, closing card with the site URL. Royalty-free bed track.
3. Encode: H.264 MP4, 1280×720, ~24fps, target ≤ 15MB. Extract a poster JPEG
   from ~2s in.

## Tier 2 — Premium (`ai_premium`, 3 credits, ~$6–12 COGS)

1. Build a prompt from `brief.details` + `brief.tagline` + the business
   category/city (query `businesses`).
2. Veo 3.1 via `GOOGLE_API_KEY` (precedent: `scripts/generate-images-gemini.mjs`
   uses the same key family). Generate 2–4 8s clips, stitch to 15–30s with the
   same branded lower-third + end card as Tier 1.
3. Same encode/poster step.

## Publish (both tiers)

1. Upload to storage: `business/{business_id}/videos/gen-{video_id}.mp4` and
   `.../gen-{video_id}-poster.jpg` in the public `taw-media` bucket.
2. Update the row: `url`, `thumbnail_url`, `duration_seconds`,
   `status = 'ready'` — or leave `pending` and let an admin approve via
   `/admin/videos` if human review of AI output is wanted (recommended at
   first: set `status='pending'` + `url` filled; the admin Approve button
   already handles exactly this state).
3. Insert a `taw.notifications` row for `businesses.owner_id`
   (`type='video_status'`, href `/dashboard/{business_id}/videos`) — or POST
   the site's notify helper if running inside the app.

## Failure policy

On unrecoverable render failure: set `status='rejected'`,
`rejection_reason='Production failed — credits refunded.'`, and insert a
`taw.video_credits` refund row (`delta = credits_spent`,
`reason = 'refund:render_failed:{video_id}'`). Never leave a brief pending
forever.

## Cost guardrails

- Per-business cap: refuse more than N premium renders/day (start N=3).
- Global monthly budget env (`VIDEO_WORKER_MONTHLY_BUDGET_USD`); stop when hit.
- Always render Motion locally first to validate the pipeline before enabling
  Veo spending.
