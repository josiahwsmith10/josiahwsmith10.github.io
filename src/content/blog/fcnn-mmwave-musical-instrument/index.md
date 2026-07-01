---
title: "An FCNN Super-Resolution mmWave Radar Framework for a Contactless Musical Instrument"
description: "We turn an 8-channel automotive radar into a contactless instrument, using a super-resolution neural net to track a hand to millimeter precision."
date: "2021-06-01"
tags: [mmWave, radar, deep-learning, HCI]
---

**J. W. Smith, O. Furxhi, and M. Torlak, "An FCNN-Based Super-Resolution mmWave Radar Framework for Contactless Musical Instrument Interface," *IEEE Trans. Multimedia*, vol. 24, pp. 2315–2328, 2021.** · [DOI](https://doi.org/10.1109/TMM.2021.3079695)

## The problem

A century ago, Leon Theremin built an instrument you play without touching it: move your hand near an antenna, and the pitch changes. We wanted to build a modern, contactless instrument too — but using a millimeter-wave (mmWave) radar instead of a capacitive antenna or an optical camera.

Radar is appealing here. Unlike a camera, it works in any lighting, sees through fog and occlusion, and is far less invasive of privacy. The catch is resolution. We use a commercial 8-channel automotive radar (a Texas Instruments AWR1243, 79 GHz center frequency, 4 GHz bandwidth) with a small antenna aperture. The physics of that small aperture bound its spatial resolution to roughly $\delta_y = 7.5$ cm in cross-range and $\delta_z = 3.75$ cm in range. For tracking a hand precisely enough to "play" notes, that is nowhere near good enough — naively reading the peak out of each radar image produces jittery, sporadic position estimates.

## The idea

Most deep learning work on mmWave radar *classifies* gestures: it maps a sample to one of a fixed set of poses. That throws away exactly what we need — continuous position. Classification is dimensionality reduction; we want the opposite.

So instead we treat radar processing as a *regression* problem. We train a fully convolutional neural network (FCNN — a CNN with no dense layers, so it maps an image to an image of the same size) to take a blurry, noisy radar image and produce a clean, sharp one. Because it preserves the image geometry, it can perform spatial **super-resolution**: it sharpens the hand's reflection beyond the device's theoretical resolution limit, while also suppressing clutter, device noise, and beam-pattern artifacts the analytic model can't easily remove.

## How it works

The signal chain starts with a frequency-modulated continuous-wave (FMCW) radar, which transmits a chirp whose frequency ramps linearly with time. A target's range and velocity show up as frequencies in the returned beat signal. We use time-division-multiplexed MIMO (multiple-input multiple-output) to form an 8-element virtual array, then reconstruct a 2-D image of the scene reflectivity $p(y,z)$ with the range migration algorithm (RMA), which properly handles the near-field spherical-wave geometry that simpler range-angle FFT methods get wrong.

The RMA image goes into the enhancement FCNN: four convolutional layers of decreasing kernel size, each followed by a ReLU, zero-padded so output size equals input size. The training trick is the labels. Each ground-truth image is a clean Gaussian blob, $I(y,z) = e^{-(y-y_0)^2/\sigma_y^2 - (z-z_0)^2/\sigma_z^2}$, centered on the known hand location. The inputs are a mix of **real** hand captures (512 frames at each of 45 known positions, 23,040 images) and **65,536 simulated** point targets — crucially corrupted with *real* radar noise sampled from the device, so the network learns the actual beam pattern, multistatic effects, and ambient noise rather than an idealized model.

Downstream of the enhanced image, we estimate velocity via a Doppler FFT across chirps, then track everything with a modified particle filter. Our **Doppler-corroborated** variant compares the velocity implied by recent position estimates against the directly measured Doppler velocity; when they disagree, that measurement is down-weighted as an outlier, stabilizing the range track. We map three extracted features — range (note selection), cross-range oscillation (vibrato), and velocity — to audio or MIDI output, with the whole MATLAB pipeline running around 250 Hz.

## Results

The headline is resolution. The device's theoretical bounds are $\delta_y = 7.5$ cm and $\delta_z = 3.75$ cm; with the FCNN, we measured empirical resolutions of **2.3 mm cross-range and 1.96 mm range** — well past the physical limit.

On localization root-mean-square error (RMSE) over the validation set, the FCNN cut cross-range error from 0.0154 m to 0.0085 m and range error from 0.023 m to 0.0083 m versus reading the raw RMA peak.

Comparing tracking methods on 4,096 motion profiles, the full FCNN + Doppler-corroborated particle filter (FCNN-DPF) dominated the simple baseline:

| Method | $y$ (mm) | $z$ (mm) | $v$ (mm/s) | latency (ms) |
|---|---|---|---|---|
| Simple | 7.86 | 22.0 | 72.4 | 2.29 |
| FCNN-DPF | 3.70 | 3.07 | 44.5 | 3.96 |

Against prior radar hand-tracking, our mean range error of **1.89 mm** improves on the best prior result (about 2 cm) by more than a factor of ten, and our 2-D position RMSE of 3.4 mm is competitive even with thumb-tracking work restricted to under 10 cm range. End-to-end latency from hand motion to MIDI was 3.96 ms — a small price for the accuracy gain.

## Why it matters

The reusable idea here is not the instrument — it's reframing radar processing as image-to-image regression and training on real device noise so the network *absorbs* the hardware's non-idealities. That lets a cheap, small-aperture sensor beat its own physical resolution limit by an order of magnitude.

That recipe generalizes well beyond music. Any near-field hand-tracking task — touchless interfaces, automotive cabin sensing, sensor-fusion front-ends where radar contributes depth that cameras lack — can borrow the same super-resolution-plus-tracking pipeline. mmWave gives you robustness to lighting, occlusion, and privacy concerns; the FCNN gives you the precision that small radars otherwise can't.
