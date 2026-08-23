---
title: "complextorch: complex-valued neural networks that read like torch.nn"
description: >
  A lightweight PyTorch library for phase-aware deep learning. Port a real-valued
  model to complex-valued by changing the import, then use the parts torch.nn
  doesn't have: complex initializers, Type-A/B activations, and U(1)-symmetry modules.
date: "2026-06-21"
tags: [complex-valued, PyTorch, open-source, deep-learning, signal-processing, SAR]
---

Most deep-learning pipelines that touch radar, MRI, or wireless data throw away half the
signal before the first layer. A synthetic-aperture-radar pixel, an MR k-space sample, and
a received comms symbol are each natively a **complex number**, and the *phase* carries
structure that the magnitude alone does not: coherence between passes, sub-wavelength
displacement, the geometry of the scene. If you stack real and imaginary parts into two
channels and feed them to a standard CNN, the network can still learn something, but it
treats real and imaginary as unrelated features rather than two coordinates of one
rotating quantity.

[**complextorch**](https://github.com/josiahwsmith10/complextorch) is a lightweight
PyTorch library I built so networks can stay complex-valued end to end. The design goal
is simple: `complextorch.nn.*` mirrors `torch.nn.*` name-for-name, so porting
a real-valued model is often a one-line import change.

```python
import torch
import complextorch as cT

x = torch.randn(64, 5, 7, dtype=torch.cfloat)   # (batch, channels, length)
model = cT.nn.Conv1d(5, 16, kernel_size=3)
y = model(x)                                     # complex in, complex out
```

There is no custom tensor wrapper to learn; the library operates directly on PyTorch's
complex dtypes (`torch.cfloat` / `torch.cdouble`). Gradients flow exactly as they do
through any `torch.nn` module.

## Why complex-valued, and why now

Two developments make a library like this worth using rather than rolling your own
real/imag split.

First, **the signal is genuinely complex.** Phase-aware tasks (InSAR coherence, biomass
under canopy, frequency estimation, MR reconstruction) degrade when you decouple the two
components, because operations like a phase rotation $z \mapsto e^{j\psi} z$ become a
linear mixing of your two "independent" channels that the network has to relearn from
scratch.

Second, **PyTorch ≥ 2.1 ships fast native complex kernels.** The recommended layers in
`complextorch` are thin wrappers around the corresponding `torch.nn` module constructed
with `dtype=torch.cfloat`:

```python
# native cfloat — the recommended path
cT.nn.Conv1d(5, 16, kernel_size=3)        # wraps torch.nn.Conv1d(dtype=cfloat)
cT.nn.Linear(128, 4)                       # wraps torch.nn.Linear(dtype=cfloat)
```

The library also keeps the original hand-rolled implementations under
`complextorch.nn.gauss`. These split each tensor into real/imag and apply Gauss'
three-multiply trick,

$$
(R + jI)(x + jy) = (Rx - Iy) + j(Ry + Ix),
$$

exposing `conv_r` / `conv_i` as separate child modules. They predate native complex
support and no longer carry a speed advantage (they used to be prefixed `Slow*`), so
their role today is twofold: a readable reference for the real/imag math, and a place to
hang different parameterizations or constraints on each half. A round-trip test suite
checks the native and Gauss paths agree to floating-point tolerance on shared weights.

## Three primitives, then everything else

Almost every non-convolutional layer is built on three composition helpers in
`complextorch.nn.functional`, which is also the cleanest way to understand complex
activations:

- **`apply_complex`**: the naive complex-linear lift,
  $(R(x_r) - I(x_i)) + j(R(x_i) + I(x_r))$.
- **`apply_complex_split`** (**Type-A**): apply two real functions to the real and
  imaginary parts independently: $G(z) = G_\mathbb{R}(x) + j\,G_\mathbb{I}(y)$. This is
  `CVSplitReLU`, `CVSplitTanh`, `CELU`, dropout, softmax.
- **`apply_complex_polar`** (**Type-B**): apply functions to magnitude and phase, then
  recombine: $G(z) = G_{|\cdot|}(|z|)\,\exp\!\big(j\,G_\angle(\arg z)\big)$. This is
  `modReLU`, `AdaptiveModReLU`, the polar activations.

The Type-A/Type-B distinction is the central design decision for complex nonlinearities.
`CVSplitReLU` zeroes the real and imaginary components independently; it does **not**
preserve phase. `modReLU` thresholds magnitude as $(|z| - b)^+$ and leaves phase
untouched. Which one you want depends on whether phase is signal or nuisance for
your task.

## What ships in v2.0

By v2.0 the library has grown well past drop-in conv/linear into a fairly complete
complex-valued toolkit:

- **Core layers**: `Conv{1,2,3}d`, `ConvTranspose{1,2,3}d`, `Linear`, `Bilinear`, and
  layout-conversion modules (`InterleavedToComplex`, `ComplexToConcatenated`, …) for
  bridging real-valued I/O.
- **Sequence & attention**: `GRU`/`LSTM` (cell-based, with optional batchnorm for deep
  stacks), a full `Transformer` stack, and a `MultiheadAttention` that uses the
  **Hermitian** inner product $QK^H$ (fixing a `$QK^T$` math bug in earlier versions).
- **Normalization**: `BatchNorm`, `LayerNorm`, `GroupNorm`, `RMSNorm`, built on public
  2×2-whitening helpers (`whiten2x2_batch_norm`, `inv_sqrtm2x2`, …) that handle the full
  complex covariance rather than normalizing components separately.
- **Pooling**: `MagMaxPool` (magnitude-argmax, since `>` isn't defined on complex),
  `AvgPool`, and `SpectralPool{1,2,3}d`, which downsamples by truncating the centered DFT
  spectrum (Rippel 2015 / Trabelsi 2018) and exactly preserves the DC bin, and thus the
  spatial mean.
- **Initialization**: `complextorch.nn.init` with variance-correct complex initializers
  (`trabelsi_standard_`, Kaiming/Xavier variants). PyTorch's built-ins treat real and
  imaginary parts independently, which gets the magnitude variance wrong.
- **Activations**: a wide family: Type-A `CVSplit*`, Type-B `modReLU`/`AdaptiveModReLU`,
  and the quadrant-gating `zReLU` / `zAbsReLU` / `zLeakyReLU`.
- **Learned sparsity**: `complextorch.nn.relevance` (complex Variational Dropout and
  Automatic Relevance Determination) and `complextorch.nn.masked` (fixed-mask sparsified
  layers), with deploy/extract helpers for pruning workflows.
- **Beyond `nn`**: `complextorch.signal` (a differentiable torch port of Welch's PSD,
  usable as a spectral loss), `complextorch.transforms` (torchcvnn-style dataloader
  transforms: `LogAmplitude`, `FFT2`, `PolSAR`, `RandomPhase`, …),
  `complextorch.datasets` (SAR/MRI readers; `SAMPLE` and `SLCDataset` are full
  implementations), and `complextorch.models` (a complex Vision Transformer with
  `vit_t/s/b/l/h` presets).

## The part I'm most interested in: co-domain symmetry

Complex data usually has a **co-domain symmetry**: the *absolute* phase of a signal is
arbitrary. The time origin of a radar pulse, the global phase of an MR coil, the carrier
phase of a comms symbol: none of these should change the answer. A model that respects
this should either ignore the global phase (**U(1)-invariance**) or rotate its features
along with the input (**U(1)-equivariance**), and never silently break it.

For a global rotation $x \mapsto e^{j\psi} x$, an operator $M$ is

- **U(1)-equivariant** if $M(e^{j\psi} x) = e^{j\psi} M(x)$, and
- **U(1)-invariant** if $M(e^{j\psi} x) = M(x)$.

`complextorch` provides a coherent set of building blocks for both regimes, ported from
two papers: **SurReal** ([Chakraborty et al., 2019](https://arxiv.org/abs/1910.11334)),
which treats $\mathbb{C}\setminus\{0\}$ as the manifold $\mathbb{R}^+ \times SO(2)$, and
**Co-Domain Symmetry / CDS** ([Singhal et al., CVPR
2022](https://arxiv.org/abs/2112.01525)). The strictly equivariant pieces (`PhaseShift`,
`ComplexScaling`, `MagBatchNorm`, `EquivariantPhaseReLU`, and the paper-faithful
`wFMConvStrict2d` with convex weights, $\sum w = 1$, $w \ge 0$) compose into equivariant
blocks. An invariant `PrototypeDistance` head with a co-rotating reference closes the
network into a fully phase-invariant classifier:

```python
import complextorch.nn as cnn

equivariant_block = nn.Sequential(
    cnn.wFMConvStrict2d(in_ch, out_ch, kernel_size=3, padding=0),
    cnn.ComplexScaling(out_ch),
    cnn.EquivariantPhaseReLU(out_ch),
    cnn.MagBatchNorm2d(out_ch),
)
```

The equivariance and invariance claims are checked, not just asserted. Every module in
this family has a correctness test in `tests/invariants/test_equivariance.py`, and the
docs state where the math breaks down (positive convolution padding zero-pads
magnitudes, and a zero magnitude has no well-defined phase to rotate, so strict
equivariance holds only at `padding=0`). Reference networks (`CDSInvariant`,
`CDSEquivariant`, `CDSMSTAR`) live under `complextorch.models`.

## Engineering

The library is deliberately small and heavily tested. The suite mirrors the package tree
1:1 under `tests/` (~490 tests) and CI enforces **100% line coverage** on Python 3.10,
3.11, and 3.12 — any PR that drops coverage fails. Beyond unit tests, there are
Hypothesis-driven round-trip invariants (native↔Gauss numerical equivalence, polar and
casting round-trips, FFT round-trips), a full loss-reduction matrix, and `gradcheck` on
the custom autograd pieces. The docs ship an executable Getting Started notebook that
re-runs on every build, so the public-API examples stay current, plus an API
reference generated from docstrings.

## Install, use, cite

PyTorch is intentionally **not** a hard dependency. Install the wheel matching your
CUDA/CPU target [from pytorch.org](https://pytorch.org/get-started/locally/) first, then:

```sh
pip install complextorch
```

Optional extras pull in dataset readers (`complextorch[datasets]` → `h5py`,
`complextorch[datasets-alos]` → `rasterio`). Requires Python ≥ 3.10, PyTorch ≥ 2.1;
Apache-2.0 licensed.

- **Repository** — <https://github.com/josiahwsmith10/complextorch>
- **Documentation** — <https://josiahwsmith10.github.io/complextorch/latest/>
- **PyPI** — <https://pypi.org/project/complextorch/>
- **Paper** — [arXiv:2309.07948](https://arxiv.org/abs/2309.07948)

If it helps your research, a citation is appreciated:

```bibtex
@misc{smith2023complextorch,
  author = {Smith, Josiah W.},
  title  = {complextorch: Complex-Valued Neural Networks for Data-Driven
            Signal Processing and Signal Understanding},
  year   = 2023,
  eprint = {2309.07948},
  archivePrefix = {arXiv},
  url    = {https://github.com/josiahwsmith10/complextorch}
}
```

complextorch is the open-source foundation for most of the phase-aware work elsewhere on
this site. See the [Projects](/projects) page for where it's in use.
