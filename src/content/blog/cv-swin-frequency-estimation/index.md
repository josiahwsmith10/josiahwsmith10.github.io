---
title: "Frequency Estimation with a Complex-Valued Shifted Window (Swin) Transformer"
description: "A fully complex-valued 1-D Swin transformer for line-spectra frequency estimation that beats cResFreq with fewer parameters."
date: "2024-02-01"
tags: [complex-valued, transformers, signal-processing, frequency-estimation]
---

**J. W. Smith and M. Torlak, "Frequency Estimation Using a Complex-Valued Shifted Window Transformer," *IEEE Geosci. Remote Sens. Lett.*, vol. 21, Art. 4012005, 2024.** · [Code](https://github.com/josiahwsmith10/spectral-super-resolution-swin) · [complextorch](https://github.com/josiahwsmith10/complextorch)

## The problem

Estimating closely spaced frequency components of a signal is a foundational problem in statistical signal processing. In radar, communications, sonar, and remote sensing, the demodulated signal is often modeled as a multisinusoidal signal whose distinct frequency components correspond to scatterers at different ranges or directions. Recovering those frequencies accurately is the basis for ranging, target recognition, and navigation.

The classical workhorse, the periodogram (a windowed Fourier transform), suffers from limited resolution because of mutual interference and the sinc-effect: limiting samples to $n = 0, 1, \dots, N-1$ imposes a rectangular window, which convolves the spectrum with a Dirichlet kernel of width $1/N$ and blurs closely spaced peaks. Subspace methods such as MUSIC (MUltiple SIgnal Classification) and sparse-recovery methods such as OMP (orthogonal matching pursuit) surpass the Rayleigh limit under good conditions, but MUSIC degrades sharply at low signal-to-noise ratio (SNR), OMP produces biased estimates for closely spaced frequencies or low SNR, and both require knowing the number of frequency components $L$ a priori. Deep-learning approaches (DeepFreq, ResFreq) improved on this, and the state-of-the-art cResFreq introduced a complex-valued matched filter, but its super-resolution stage still computes the signal modulus and reverts to purely real-valued operations, discarding phase.

## The idea

We introduce **SwinFreq** and **CVSwinFreq**: 1-D real-valued and complex-valued shifted window (Swin) transformers for line-spectra frequency estimation on 1-D complex-valued signals. While 2-D Swin transformers have become popular for optical image super-resolution, we introduce — for the first time, to our knowledge — a complex-valued Swin module, and the first 1-D Swin transformer suited to vector-valued signal-processing problems.

Why does complex-valued (CV) computation matter? Signals like radar returns carry information jointly in magnitude and phase. cResFreq is only *partially* complex-valued; CVSwinFreq is the first frequency-estimation network to be *fully* complex-valued end to end, so the network never throws away phase relationships before the final reconstruction. This work connects to the broader complex-valued neural network (CVNN) effort behind [complextorch](https://github.com/josiahwsmith10/complextorch), which supplies the CV layers, initialization, and activations used here.

## How it works

Following cResFreq, both models pair a matched filter (MF) module with a super-resolution (SR) module. Given a complex time series $X \in \mathbb{C}^N$, the MF module — whose learned weights approximate complex exponentials — produces spectral features $F_0 = H_{\text{CVConv2d}}(H_{\text{CVLinear}}(X))$. We compute the CV linear and convolution layers efficiently using Gauss's multiplication trick and use robust CV weight initialization.

The SR module is where the Swin contribution lives. It stacks $B$ Signal Swin Transformer Blocks (SSTB / CVSSTB), each composed of $D$ Signal Swin Transformer Layers (SSTL / CVSSTL), with a residual connection passing the MF features forward: $\hat{Y} = H_{\text{UpConv1d}}(F_0 + F_B)$. Each SSTL applies shifted-window multi-head self-attention (MSA): the length-$M$ feature is split into $M/W$ non-overlapping windows of size $W$, attention is computed within each window as $\text{Attention}(Q,K,V) = S(QK^T/\sqrt{d} + B)V$, and consecutive layers shift the partition by $\lfloor W/2 \rfloor$ so adjacent windows exchange information — analogous to forward-backward averaging in array processing. Windowed attention keeps complexity linear rather than quadratic in signal length.

Making attention complex-valued required two key changes. First, the real softmax is undefined for complex values, so we introduce a complex softmax that applies the real softmax to the modulus while preserving phase: $S_{\mathbb{C}}(X) = S_{\mathbb{R}}(|X|)\,\frac{X}{|X|}$. Second, the relative positional encoding $B$ becomes complex-valued. The CVSSTL also uses complex linear layers, a complex activation (CPReLU), and complex layer normalization with proper whitening.

## Results

Both models are compact: with attention dimension $d=4$ (SwinFreq) and $d=2$ (CVSwinFreq), they have **249.7k and 260.2k parameters** respectively — fewer than cResFreq — making them well suited to edge and mobile deployment. Models were trained on 500,000 synthetic samples ($N=64$, super-resolved size $N_{\text{SR}}=4096$, AWGN SNRs from $-10$ to $40$ dB, $L \in [1,10]$) with AdamW and MSE loss.

On reconstruction fidelity measured by peak SNR (PSNR) across SNR, both SwinFreq and CVSwinFreq considerably outperform cResFreq, with **up to a 4.3 dB PSNR improvement** at medium-to-high SNR. For resolution, a Monte Carlo study at 20 dB SNR (1000 samples per separation from $0.3/N_{\text{SR}}$ to $1/N_{\text{SR}}$) shows both Swin models resolve closely spaced frequencies better than cResFreq, while MUSIC and OMP often return biased, incorrectly located peaks. On sidelobe suppression, all methods are comparable at 20 dB, but at 0 dB SNR cResFreq's sidelobe mitigation degrades markedly for closely spaced tones, whereas our models hold up.

A notable finding runs against typical CVNN expectations: the real-valued SwinFreq outperforms the complex-valued CVSwinFreq on most tasks while using fewer parameters, and SwinFreq beats cResFreq in every category. CVSwinFreq's edge is specifically the resolution of closely spaced frequencies. On real data — inverse synthetic aperture radar (ISAR) imagery and high-resolution range profiles (HRRP) from an LFM radar spanning 213.6 to 226.4 GHz — both Swin models sharpen the aircraft wings and reduce sidelobes relative to cResFreq and the periodogram, with the advantage clearest in the HRRPs.

## Why it matters

This is the first complex-valued Swin transformer and the first 1-D Swin transformer for statistical signal processing, plus the first fully complex-valued frequency-estimation network. It establishes a new state of the art for line-spectra super-resolution — better fidelity, resolution, and low-SNR sidelobe control than classical periodogram, MUSIC, and OMP and the deep-learning baseline cResFreq — while shrinking the model. The shifted-window mechanism transfers cleanly from images to 1-D vector data, and the complex-valued building blocks (complex softmax, complex positional encoding, complex layer norm) are reusable for any phase-bearing signal task via [complextorch](https://github.com/josiahwsmith10/complextorch). The compact footprint makes these models practical for edge and mobile radar applications.
