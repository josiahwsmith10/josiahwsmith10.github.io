---
title: "Le Grand Horaire: a conflict-view planner for the AI for Good Summit"
description: >
  Why does the AI for Good Summit programme not have a calendar view? I don't know. So I built
  my own.
date: "2026-07-01"
tags: [open-source, TypeScript, web, data-viz, tools, AI-for-Good]
---

The [AI for Good Global Summit](https://aiforgood.itu.int/summit26/programme/) runs four days at
Palexpo in Geneva (7–10 July 2026) across dozens of parallel stages — keynotes, panels,
workshops, and demos, most of them overlapping. The official programme is thorough, but it's a
*list*: you scroll it one session at a time. And a list is the wrong shape for the only question
that matters when you're planning a day at a multi-track conference — *what is happening at the
same time, and what do I give up to attend this one?* You can't answer a scheduling question by
reading. You end up with fifteen browser tabs and a hand-drawn grid.

So I built the grid. [**Le Grand Horaire**](https://josiahwsmith10.github.io/ai4good-planner/) is
a small, unofficial planner that puts the whole programme on a **two-axis board**: stages run
across, time runs down. A session that collides with another isn't a line you have to remember —
it's a block sitting *next to* the thing it conflicts with. Rather than flattening a
two-dimensional problem into a one-dimensional feed, I matched the shape of the tool to the shape
of the question, and the conflicts fall out as geometry. (Hence the name — "the grand timetable,"
a nod to French-speaking Geneva.)

> **Unofficial, and not affiliated with the ITU.** It mirrors a snapshot of the official
> programme; always verify against the [official version](https://aiforgood.itu.int/summit26/programme/).

## What it does

Everything on the board serves one goal — see your day at a glance and share it:

- **The time-grid itself.** Every session placed by its start and end time in its stage's column,
  so overlaps are literally side by side. A live keyline tracks the current time in Zurich.
- **Filters that cut the noise.** Day, stage, topic, and event type — plus free-text search and a
  toggle to drop invitation-only sessions — all composable, so you can carve the 300-session
  programme down to the handful you actually care about.
- **Shareable views.** The day you're on and every filter you've set live in the URL, so a link
  reproduces the exact board you're looking at. No account, no back-end.
- **The right shape on every screen.** The board suits a laptop; on a phone it falls back to a
  single-column agenda automatically, or you can force either view.

## The layout problem underneath it

The one genuinely tricky piece is packing overlapping sessions into a single stage's column
without either stacking them on top of each other or wasting the whole column to whitespace. The
naïve fix — size every block to one-over-the-worst-overlap-of-the-day — surrenders most of the
width the moment two sessions collide, even in the hours where nothing else does.

Rather than reason about the day globally, I let each overlap cluster reason about itself.
[`layoutGrid.ts`](https://github.com/josiahwsmith10/ai4good-planner/blob/main/src/selectors/layoutGrid.ts)
sweeps the day's sessions in time order, drops each into the first free lane, and computes the
lane *count* over each maximal run of mutually-overlapping sessions — not across the whole day. A
block in a stretch where nothing collides reclaims the full column; only the sessions genuinely
tangled with each other get split. It's a few dozen lines, pinned down by unit tests, and it's
the difference between a legible dense day and a wall of slivers.

## Keeping it correct without babysitting it

A conference programme moves right up to the doors — sessions get added, shifted, and cancelled —
and a planner that's confidently wrong is worse than no planner at all. So I built the data path
to keep itself honest rather than trusting me to re-check it:

- **A scraper, not hand-entry.** A Node/TypeScript scraper reads the server-rendered programme
  HTML and emits `public/data/2026.json`.
- **One schema, so the two halves can't drift.** The scraper and the browser import the same
  [`zod` schema](https://github.com/josiahwsmith10/ai4good-planner/blob/main/shared/schema.ts);
  the data is validated on write and the TypeScript types are inferred from it, so the producer
  and the consumer physically cannot disagree about what an event is.
- **Self-updating, but on a leash.** A scheduled GitHub Action re-scrapes daily and opens a pull
  request only when the programme actually changes; small, safe diffs auto-merge. A scrape that
  comes back with zero events — or fewer than a floor — *fails* instead of overwriting good data,
  so a network hiccup can never silently blank the board.
- **Evergreen by construction.** The year is data, not code. Next year's summit is one more
  `public/data/<year>.json` file and a manifest entry — not a rewrite.

## Deliberately small

No framework: Vite, vanilla TypeScript, and [`lit-html`](https://lit.dev/docs/libraries/standalone-templates/)
for rendering, shipped as a static GitHub Pages site. The whole thing is a fast bundle and a JSON
file behind a CDN — nothing to run, nothing to pay for, nothing to page me at 2 a.m. I spent the
complexity where it earns its keep: the layout math and the scrape-and-validate loop. Everything
else stays out of the way.

## Try it

- **Live:** <https://josiahwsmith10.github.io/ai4good-planner/>
- **Source:** <https://github.com/josiahwsmith10/ai4good-planner>

If you'll be in Geneva in July, open the board, filter to your day, and send the link to whoever
you're trying to coordinate with. And if you catch the board drifting from the official
programme, the scraper is on a leash — but a pull request is always welcome.
