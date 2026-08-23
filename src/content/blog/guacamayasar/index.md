---
title: "GuacamayaSAR: a SAR companion for deforestation monitoring under cloud cover"
description: >
  The Colombian Amazon is cloud-covered half the year, and optical alerts go quiet.
  Does a Sentinel-1 SAR companion catch what they miss?
date: "2026-06-21"
tags: [SAR, InSAR, deforestation, remote-sensing, complex-valued]
draft: true
---

> **Status: draft.** Seeded from the project notes. Flip `draft: true` to publish when ready.

## The problem

Project Guacamaya (Microsoft AI for Good) runs operationally with Colombia's IDEAM using
Planet Labs and Sentinel-2 **optical** imagery. The Colombian Amazon, however, is
cloud-covered for roughly half the year, and during those months optical alerts go
quiet. An operational SAR alert (Wageningen RADD) exists, but it misses real events.

This project asks whether a **SAR companion catches them**. We curated **66
RADD-missed deforestation events** over the last 12 months around Florencia, Caquetá, and
measure recall against that set.

## The system

A two-branch Sentinel-1 design feeding a single fused change-detection model:

1. **Amplitude branch**: [OlmoEarth](https://allenai.org/blog/olmoearth-models) (Ai2) as a
   frozen geo-foundation backbone over Sentinel-1 RTC scenes from the Microsoft Planetary
   Computer STAC catalog. Per-patch feature vectors; per-pair L2 distance is a naïve change score.
2. **Coherence branch**: ASF HyP3 burst-InSAR pairs at ≤12-day baselines, producing
   interferometric coherence $\gamma_{t,t+\Delta}$ plus unwrapped phase, wired into a
   `torch.complex64` tensor. Per-pair $1 - |\gamma|$ is a naïve coherence-loss change score.

The coherence branch is the new contribution: a complex-valued, **phase-preserving** SAR
head that complements the amplitude branch with a structurally different signal.
Coherence collapses on disturbance independently of brightness.

## Why coherence helps

Optical and amplitude-only SAR both respond to *reflectance/brightness*. Interferometric
coherence responds to *whether the scene's scattering geometry stayed stable* between
passes. Forest disturbance destroys that stability even when brightness barely moves, so
the two branches fail on different events. That complementarity is what a fused detector
needs.

## Results

<!-- TODO: train the two-branch fused model and report recall on the 66-event RADD-miss set. -->
*Coming soon: recall on the RADD-miss set, by event type.*

## Try it

```bash
git clone https://github.com/josiahwsmith10/GuacamayaSAR.git
cd GuacamayaSAR
uv sync --extra dev --extra geo --extra ml --extra asf --extra modal
```

Full setup is in the [repository README](https://github.com/josiahwsmith10/GuacamayaSAR).
