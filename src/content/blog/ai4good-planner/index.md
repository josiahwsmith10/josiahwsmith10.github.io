---
title: "Le Grand Horaire: a calendar view for the AI for Good Summit"
description: >
  The AI for Good Summit programme is a list, but planning a multi-track day is a scheduling
  problem, so I built the calendar view it was missing.
date: "2026-07-01"
tags: [open-source, TypeScript, web, data-viz, tools, AI-for-Good]
---

The [AI for Good Global Summit](https://aiforgood.itu.int/summit26/programme/) runs four days at
Palexpo in Geneva (7–10 July 2026) across dozens of parallel stages: keynotes, panels,
workshops, and demos, most of them overlapping. The official programme is thorough, but it is a
*list*: you scroll it one session at a time. The question that matters when you plan a day at a
multi-track conference is what is happening at the same time, and what you give up to attend a
given session. A list cannot answer that.

So I built [**Le Grand Horaire**](https://josiahwsmith10.github.io/ai4good-planner/) ("the
grand timetable," a nod to French-speaking Geneva), a small, unofficial **calendar view** of the
whole programme. Every session sits in its stage's column, placed by its start and end time, the
way a week view lays out a personal calendar. The calendar shows conflicts directly: two
sessions that overlap sit side by side, so you can compare them at a glance.

> **Unofficial, and not affiliated with the ITU.** It mirrors a snapshot of the official
> programme; always verify against the [official version](https://aiforgood.itu.int/summit26/programme/).

## What it does

Everything in the interface serves one goal: see your day at a glance and share it.

- **The calendar itself.** Every session placed in its stage's column by start and end time, so
  overlapping sessions sit literally side by side. A live keyline tracks the current time in
  Zurich.
- **Filters that compose.** Day, stage, topic, and event type, plus free-text search and a
  toggle to hide invitation-only sessions, so you can narrow the 300-session programme down to
  the handful you plan to attend.
- **Shareable views.** The selected day and every active filter live in the URL, so a link
  reproduces exactly what you see. No account, no back-end.
- **The right layout on every screen.** The full calendar suits a laptop; on a phone it falls
  back to a single-column agenda automatically, and either view can be forced.

## The layout problem underneath it

The one hard problem is packing overlapping sessions into a single stage's column
without stacking them on top of each other or wasting the column on whitespace. The naïve
fix, sizing every block against the worst overlap of the day, wastes most of the width the
moment two sessions collide, even during the hours when nothing else does.

Instead of reasoning about the day globally, I let each overlap cluster reason about itself.
[`layoutGrid.ts`](https://github.com/josiahwsmith10/ai4good-planner/blob/main/src/selectors/layoutGrid.ts)
sweeps the day's sessions in time order, drops each into the first free lane, and computes the
lane *count* over each maximal run of mutually overlapping sessions, not across the whole day.
A session in a quiet stretch reclaims the full column width; only the sessions that actually
overlap one another get split. It is a few dozen lines, covered by unit tests, and it is what
keeps a dense day legible.

## Keeping the data correct

A conference programme keeps changing right up to the event: sessions are added, shifted, and
cancelled. A planner that is confidently wrong is worse than no planner. So I built the data
path to check itself:

- **A scraper, not hand-entry.** A Node/TypeScript scraper reads the server-rendered programme
  HTML and emits `public/data/2026.json`.
- **One schema for both halves.** The scraper and the browser import the same
  [`zod` schema](https://github.com/josiahwsmith10/ai4good-planner/blob/main/shared/schema.ts);
  the data is validated on write and the TypeScript types are inferred from it, so the producer
  and the consumer cannot drift apart.
- **Self-updating, with guardrails.** A scheduled GitHub Action re-scrapes daily and opens a
  pull request only when the programme actually changes; small, safe diffs auto-merge. A scrape
  that returns zero events, or fewer than a sanity floor, *fails* instead of overwriting good
  data, so a network hiccup cannot silently blank the calendar.
- **Evergreen by construction.** The year is data, not code. Next year's summit is one more
  `public/data/<year>.json` file and a manifest entry, not a rewrite.

## Deliberately small

I kept the stack deliberately small: Vite, vanilla TypeScript, and
[`lit-html`](https://lit.dev/docs/libraries/standalone-templates/) for rendering, shipped as a
static GitHub Pages site: a fast bundle and a JSON file behind a CDN, with nothing to run and
nothing to pay for. The complexity went where it matters most: the layout math and the
scrape-and-validate loop.

## Try it

- **Live:** <https://josiahwsmith10.github.io/ai4good-planner/>
- **Source:** <https://github.com/josiahwsmith10/ai4good-planner>

If you'll be in Geneva in July, open the calendar, filter to your day, and send the link to
whoever you're coordinating with. If you spot the calendar drifting from the official
programme, a pull request is welcome.
