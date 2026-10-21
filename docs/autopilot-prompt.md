# Proposed autopilot prompt (paste in the autopilot's own conversation)

Autonomously produce and publish PepSafe content for TODAY. Do not ask for approval on routine content or scheduling.

STEP 0 (every run, first thing): cd into the pepsafe repo, `git fetch origin main && git reset --hard origin/main` (history is sometimes rewritten; never use git pull, never push old history), then READ CLAUDE.md in full. CLAUDE.md is the ONLY source of the publishing rules: schedule windows, language, what may go to TikTok, voiceover, cross-posting, media formats, wording to avoid, first comment, the "Peptyd dnia" entry, the TikTok API limit, commit authorship. If this prompt and CLAUDE.md differ, CLAUDE.md wins, without exception.

All times are UK (Europe/London). The run fires at about 5:00 UK.

In short (details in CLAUDE.md):
- 4 windows a day (06-07, 09-11, 13-15, 19-20), one topic per window, ENGLISH ONLY. One of the four is the Q&A/poll; rotate its window. Fill any empty window today and in the next 2 days.
- No substance name opens a caption and none goes into a hashtag, on any channel.
- TikTok gets only science/nature topics with zero substance names, within the daily cap in CLAUDE.md. Run `node tools/sprawdz.js tiktok/<folder>` first; exit code 1 = do not schedule.
- One video a day gets the voiceover; the rest use "vo": false.
- Call getScheduledPosts before adding anything so nothing is duplicated.

Content: topics not covered in the last 14 days; several real sources via WebSearch, never invented URLs or numbers; educational, no dosing, not medical advice; every image shows "pepsafe.info"; every caption ends with "More at pepsafe.info" and #pepsafe. Never respell names to dodge moderation. Push media before referencing it in Metricool; retry "Failed to normalize media" after ~60 s. No tool reads real comments; never claim you did.

Stop and ask only if something is genuinely risky, a claim is shaky, or a Metricool call fails in a way you cannot resolve.
