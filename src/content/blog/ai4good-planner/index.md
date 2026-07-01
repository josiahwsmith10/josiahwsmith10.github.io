---
title: "Le Grand Horaire: a conflict-view planner for the AI for Good Summit"
description: >
  The official summit programme is a scrolling list that hides the one thing you actually
  need — which sessions collide. So I built a two-axis board that makes conflicts obvious at
  a glance, fed by a self-updating scraper.
date: "2026-07-01"
tags: [open-source, TypeScript, web, data-viz, tools, AI-for-Good]
---

The [AI for Good Global Summit](https://aiforgood.itu.int/summit26/programme/) runs four days
at Palexpo in Geneva (7–10 July 2026) with dozens of stages going at once — keynotes, panels,
workshops, demos. The official programme is excellent, but it's a **vertical list**: you scroll
through it one session at a time. The single most important question when you're planning a day
at a multi-track conference — *which of these things are happening simultaneously, and what do I
have to give up to attend this one?* — is exactly the question a list can't answer. You end up
with fifteen browser tabs and a paper grid.

[**Le Grand Horaire**](https://josiahwsmith10.github.io/ai4good-planner/) is a small, unofficial
tool that answers it directly. It renders the whole programme on a **two-axis board**: stages
run across, time runs down. A session that overlaps another isn't a line you have to remember —
it's a block sitting *next to* the thing it collides with. Conflicts become spatial, and you plan
your day the way you'd read a train timetable. (Hence the name — "the grand timetable," a nod to
Geneva.)

> **Unofficial, and not affiliated with the ITU.** It mirrors a snapshot of the official
> programme; always verify against the [official version](https://aiforgood.itu.int/summit26/programme/).

## What it does

- **Time-grid board.** Every session placed by start/end time in its stage's column, so
  overlaps are literally side by side. A live "now" line tracks the current time in Zurich.
- **Filters that narrow the noise.** Day, stage, topic, and event type, plus free-text search
  and a toggle to hide invitation-only sessions — all composable.
- **Shareable views.** The selected day and every active filter live in the URL hash, so a link
  reproduces exactly the filtered board you're looking at. No account, no server.
- **Responsive.** The board is the right shape for a laptop; on a phone it falls back to a
  single-column agenda automatically, or you can force either view.

## The layout problem underneath it

The interesting part is placing overlapping blocks in a single stage's column without either
overlapping them or wasting horizontal space. Naïvely you'd size every block to `1 / max
overlap for the day` and lose most of the column to whitespace whenever a couple of sessions
happen to collide.

Instead the board does **interval-lane packing per overlap cluster**: it sweeps the day's
sessions in time order, assigns each to the first free lane, and — this is the trick — computes
the lane *count* over each maximal run of mutually-overlapping sessions rather than globally. A
block in a stretch where nothing collides reclaims the full column width; only the sessions
actually tangled up with each other get split. It's a few dozen lines
([`layoutGrid.ts`](https://github.com/josiahwsmith10/ai4good-planner/blob/main/src/selectors/layoutGrid.ts)),
covered by unit tests, and it's what makes a dense day legible instead of a wall of slivers.

## Keeping it correct without babysitting it

A conference programme is a moving target — sessions get added, moved, and cancelled right up to
the doors. A planner that's wrong is worse than no planner, so the data pipeline is built to keep
itself honest:

- **A scraper, not hand-entry.** A Node/TypeScript scraper reads the server-rendered programme
  HTML and emits `public/data/2026.json`.
- **One schema, no drift.** Both the scraper and the browser import the same
  [`zod` schema](https://github.com/josiahwsmith10/ai4good-planner/blob/main/shared/schema.ts).
  The data contract is validated on write and the TypeScript types are inferred from it, so the
  producer and the consumer physically can't disagree about the shape of an event.
- **Self-updating, safely.** A scheduled GitHub Action re-scrapes daily and opens a pull request
  only when the programme actually changes; small, safe diffs auto-merge. A scrape that comes
  back with zero events (or fewer than a floor) *fails* rather than overwriting good data with a
  blank — a network hiccup can't silently wipe the board.
- **Evergreen envelope.** The year is data, not code. Next year's summit is one more
  `public/data/<year>.json` file and a manifest entry, not a rewrite.

## Deliberately small

No framework: it's Vite + vanilla TypeScript + [`lit-html`](https://lit.dev/docs/libraries/standalone-templates/)
for rendering, deployed as a static GitHub Pages site. The whole thing is a fast static bundle
and a JSON file behind a CDN — nothing to run, nothing to pay for, nothing to page you at 2 a.m.
The interesting complexity is in the layout math and the scrape-and-validate loop, which is
exactly where it should be.

## Try it

- **Live:** <https://josiahwsmith10.github.io/ai4good-planner/>
- **Source:** <https://github.com/josiahwsmith10/ai4good-planner>

If you're going to be in Geneva in July, open the board, filter to your day, and share the link
with whoever you're trying to coordinate with. And if you spot the programme drifting from the
official one, the scraper is on a leash — but a pull request is always welcome.
