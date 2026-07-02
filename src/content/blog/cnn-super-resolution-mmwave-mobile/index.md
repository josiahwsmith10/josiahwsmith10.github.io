---
title: "Efficient CNN-Based Super-Resolution for mmWave Mobile Radar Imaging"
description: "A 79K-parameter GAN that sharpens freehand smartphone radar images, beating the gold-standard reconstruction in quality while running 1000x faster."
date: "2022-10-16"
tags: [mmWave, super-resolution, deep-learning, edge-computing]
---

**C. Vasileiou, J. W. Smith, S. Thiagarajan, M. Nigh, Y. Makris, and M. Torlak, "Efficient CNN-Based Super-Resolution Algorithms for mmWave Mobile Radar Imaging," *Proc. IEEE ICIP*, pp. 3803–3807, 2022.** · [DOI](https://doi.org/10.1109/ICIP46576.2022.9897190)

This is a write-up of a paper led by Christos Vasileiou, with my contribution centered on the radar signal-processing pipeline — the EMPM reconstruction and SAR dataset generation — that feeds the network. The work below is described in the collective "we."

## The problem

Millimeter-wave (mmWave) radar — the same 5G-band sensing now arriving in phones — can produce surprisingly detailed images of nearby objects. The technique is **near-field synthetic aperture radar (SAR)**: sweep a small radar across space and the collection of measurements acts as one large virtual antenna, a synthetic aperture whose size sets the sharpness of the image.

High resolution, however, has traditionally demanded a large and *mechanically precise* aperture. A new modality flips that constraint: **freehand smartphone SAR**, in which a person simply waves a phone-mounted radar through the air. Freehand scanning is cheap and convenient, but it violates every assumption the fast reconstruction algorithms rely on — the hand never traces a flat plane, the samples land on an irregular multi-planar geometry, and the phone's position estimate (from its cameras/IMU) carries error. The result is a blurred, defocused image.

The existing algorithms offer no escape from that degradation, only a trade-off. The **back-projection algorithm (BPA)** is the gold standard for image quality and handles arbitrary geometries, but it is computationally prohibitive — far too slow for a mobile device. The **range migration algorithm (RMA)** is a fast Fourier-based method, but it requires strictly co-planar samples, so it does not apply to freehand data at all. A middle ground, the **efficient multi-planar multistatic (EMPM)** algorithm, projects the irregular samples onto a virtual planar array so the fast RMA can be used — but it introduces defocusing and, like the BPA, has no defense against position-estimation error.

## The idea

Rather than chasing a single perfect reconstruction algorithm, we split the job into two inexpensive steps: recover a *medium-fidelity* image fast, then *learn* to restore it. Step one runs the EMPM to produce a quick but distorted reconstruction. Step two passes that image through a convolutional neural network (CNN) trained for super-resolution — sharpening structure, removing the artifacts of undersampling and position error, and recovering an image competitive with the slow BPA. To our knowledge, this is the first CNN-based super-resolution algorithm built for near-field *freehand* SAR.

Two design choices make the approach practical. First, the model must run on a phone, so it has to be tiny and fast. Second, whereas prior radar super-resolution networks were trained only on randomly placed point scatterers — which do not resemble real objects — we train on realistic targets (solid and hollow objects, plus point scatterers) so the network generalizes to real scenes.

## How it works

The model, **Mobile-SRGAN**, is a conditional generative adversarial network (cGAN). A *generator* $G$ learns to map the distorted low-resolution EMPM image to a clean high-resolution image, and a *discriminator* $D$ — a patch discriminator that splits the input into $16 \times 16$ patches and scores each — pushes $G$ toward outputs indistinguishable from ideal targets.

Training combines three losses. An adversarial loss based on binary cross-entropy, $\mathcal{L}_{advG} = \mathrm{BCE}(D(g), 1)$, drives realism; a perceptual loss $\mathcal{L}_{perc} = \sum_i \lVert F_{D_i}(y) - F_{D_i}(g) \rVert_1$ matches intermediate discriminator features between the generated image $g$ and target $y$; and a pixel-wise loss $\mathcal{L}_{p2p} = \lambda_{p2p}\lVert y - g \rVert_1$ penalizes per-pixel error.

The generator is an encoder–decoder (U-Net-style, with residual connections so detail is not lost across bottlenecks). The efficiency lever is **depthwise separable convolution**: each standard $3 \times 3$ convolution is factorized into a $3 \times 3$ depthwise convolution (DWC), which captures spatial correlations, and a $1 \times 1$ pointwise convolution (PWC), which mixes channels. Separating "where" from "what" cuts parameters dramatically — applying a DWC to the first 32-channel layer alone reduces that layer's size by up to **75%** — and the full generator lands at just **79,233 parameters**, small enough for smartphone deployment.

## Results

Training ran for 50 epochs with ADAM on a single 16 GB TESLA P100, using 4096 synthetic samples for training and 1024 for evaluation — about 8.5 hours total, with **14 ms inference per sample**. Evaluation used 1027 never-seen images (1024 synthetic + 3 real).

Measured by peak signal-to-noise ratio (PSNR) and root-mean-square error (RMSE) against ideal targets, Mobile-SRGAN beats every baseline — including the gold-standard BPA — on quality, and beats the BPA dramatically on speed:

| Metric | Mobile-SRGAN | BPA | EMPM | RMA |
|---|---|---|---|---|
| PSNR (dB) | **34.926** | 26.33 | 20.20 | 10.158 |
| RMSE | **0.019** | 0.044 | 0.105 | 0.276 |
| Time (s) | 1.117 | 1324.8 | 1.103 | 1.103 |

The net result: Mobile-SRGAN reaches **34.9 dB PSNR vs. 26.3 dB for the BPA**, at **1.1 s vs. 1325 s** — roughly a **1000x** speedup over the gold standard while *improving* image quality — and its overhead relative to the bare EMPM/RMA (1.117 s vs. 1.103 s) is negligible. Qualitatively, on both synthetic and real data, the network removes distortion, reinforces local structure, and recovers clean object outlines.

## Why it matters

A slow, exhaustive reconstruction is not the price of high-quality near-field radar imaging. A fast approximate reconstruction followed by a small learned correction yields *better* images than the gold standard at a tiny fraction of the compute — and the 79K-parameter, 14 ms model is light enough to run where it belongs: on the mobile device doing the scanning.

More broadly, the work is a clean example of interleaving signal-processing fundamentals with learned layers — porting CNN super-resolution from the optical domain into the electromagnetic one, and treating the learned stage as a first-class part of the imaging pipeline rather than an afterthought. For freehand and other irregular near-field SAR — gesture interfaces, security screening, contactless sensing — it makes high-resolution imaging on cheap, power-constrained, handheld hardware genuinely feasible.
