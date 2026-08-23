---
title: "Sterile Training: Improved Static Hand-Gesture Classification on Deep CNNs"
description: "Training a radar CNN on aluminum hand cutouts adds sharp features that real hands lack, raising static-gesture accuracy from 85% to 93%."
date: "2021-01-18"
tags: [radar, deep-learning, gesture-recognition, mmWave]
---

**J. W. Smith, S. Thiagarajan, R. Willis, Y. Makris, and M. Torlak, "Improved Static Hand Gesture Classification on Deep Convolutional Neural Networks Using a Novel Sterile Training Technique," *IEEE Access*, vol. 9, pp. 10893–10902, 2021.** · [DOI](https://doi.org/10.1109/ACCESS.2021.3051454)

## The problem

We want a radar to recognize a *static* hand gesture (palm, perpendicular, thumbs-up) held stationary rather than swiped or waved. A held pose sounds easier to classify than a moving one, but for radar it is harder.

Most gesture sensors are optical or depth cameras, and they work well until lighting or temperature conditions degrade. A millimeter-wave (mmWave) radar does not depend on lighting, sees through fog and occlusion, and ships as a cheap system-on-chip part. However, a frequency-modulated continuous-wave (FMCW) radar is a time-of-flight sensor with a tiny aperture, so it never produces a picture that resembles a hand. The pose must be learned straight from the raw return signal.

Two facts make that difficult. First, the task is to infer a three-dimensional (3-D) hand shape from low-dimensional radar data. Second, the human hand is a poor reflector: its radar cross-section (RCS) is small, so the signal-to-noise ratio (SNR) is low and the features that distinguish one gesture from another are faint and inconsistent. Moving-gesture systems sidestep this by using the Doppler shift from motion, but a stationary hand produces no Doppler. This is why static-gesture accuracy on radar has lagged.

## The idea

The idea inverts the problem: if a real hand reflects too weakly to give a convolutional neural network (CNN) clean features, train the network on a hand that reflects *strongly* instead.

We cut hand shapes out of thin aluminum sheet (backed by matching cardboard) in the three gesture poses. Aluminum is a near-perfect reflector, so a metal "hand" returns a high-SNR signal with sharp, consistent, gesture-defining features. We call these synthetic captures **sterile** data, and training a network on a mix of real and sterile data is **sterile training**.

To see why this should help, we briefly reconstructed full synthetic-aperture-radar (SAR) images of a real hand and of an aluminum cutout. The real hand is barely visible even after combining thousands of returns; the aluminum cutout shows up crisply. The sterile capture is a cleaned-up, exaggerated version of the same gesture that the radar struggles to see on a real hand. The hypothesis is that the CNN learns each gesture from those pronounced features and then applies that knowledge to the noisy real returns.

The sterile data appears only in the **training** set; we always validate on real human hands. The goal is to teach better features, not to inflate the test set.

## How it works

We collect data efficiently with a 2-D mechanical scanner: a Texas Instruments IWR1443BOOST radar (77 GHz, 4 GHz bandwidth, a 2-Tx / 4-Rx MIMO array with virtual elements spaced $\lambda/4$) rides on belt-driven rails over a 0.25 m square. The subject holds a pose while the radar moves, so one held gesture yields thousands of distinct "views" at different positions. This provides the spatial-translation variation we want the classifier to learn.

From the FMCW beat signal, target range is encoded in the beat frequency, so a fast Fourier transform (FFT) along the chirp gives a *range* profile; a second FFT across the antenna array gives a *range-angle* profile. We test both. The chirp slope $K$, duration $T$, and bandwidth $B = KT$ set the range resolution $\Delta z_{\min} = c/(2B)$.

One detail matters more than the rest: the gesture information is in the **phase** as well as the magnitude. We keep the phase by normalizing the complex image to zero mean and unit variance, then stacking the real and imaginary parts as two channels. The range images are $64 \times 8 \times 2$ and the range-angle images are $64 \times 16 \times 2$. This lets the CNN learn both pixel-to-pixel and channel-to-channel (phase) relationships.

The networks are deliberately small for real-time use: convolutional layers ($13 \times 2$ kernels for range, $13 \times 4$ for range-angle, 16 filters each) with rectified linear unit (ReLU) activations $f(x) = \max(0, x)$, then a fully connected layer to three outputs, softmax, and cross-entropy loss.

## Results

Each dataset has 80,000 samples per gesture: 40,000 real-hand and 40,000 aluminum-cutout captures, from eight participants and eight cutouts varying in size, shape, and gender. We hold out 8,000 real-hand captures as a fixed validation set used across every experiment, so only the training data changes.

The **Human Only** baseline (trained on real hands alone) reaches **84.9%** on range and **90.2%** on range-angle. Adding the sterile data, the **Combined** networks reach **93.1%** and **95.4%**, respectively. That is a gain of roughly **8.2 points** on range and **5.2 points** on range-angle from the same validation hands, changing nothing but the training set.

For context, prior static-gesture work on impulse-radio ultra-wideband radar (Kim et al.) reported around 91% but kept the hand at a fixed position and trained/tested separately on human versus model data. Our classifier handles gestures under 3-D spatial translation and unifies real and sterile data into a single robust model.

## Why it matters

The lasting contribution is the training technique. When a sensor's real-world targets are too weak or noisy to teach a network clean features, you can manufacture an idealized, high-SNR version of the same target and train on it. Synthetic-data augmentation is well established, but using a physical, high-reflectivity surrogate captured by the *same* sensor, validated only on real targets, is a simple and cheap way to give the network the features it needs. For static mmWave gesture recognition it closed most of the gap to camera-based systems, and the recipe generalizes to any modality where the real signal is harder to read than an idealized stand-in.
