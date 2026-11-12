"""Turn the LGTM icon drawn on black into transparent PNGs at the sizes Chrome uses for extension icons.

Usage: python make-icons.py <source image> <output dir>
Needs Pillow, NumPy and SciPy.

Glow drawn over black can be un-premultiplied exactly (alpha = brightest channel, color = pixel / alpha),
so the neon glow survives on any toolbar color. That alone would also make the bubble and the dark check
circle see-through, so they are pinned opaque:

- The bubble is whatever its bright outline encloses. Inside it, a pixel is pinned when it is bright or has
  the fill's hue (R/G about 0.2, B/G about 0.55, where glow is about 0.1 and 0.42). Dim glow pockets the
  outline also encloses, such as the gaps beside the thumb, are neither, so they stay glow.
- The circle has glow-like brightness and hue, so it is cut out as a disk.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_fill_holes

SIZES = (16, 32, 48, 128)
BLACK_NOISE = 6.0
BRIGHT = 140
FILL_MIN_BRIGHTNESS = 120
FILL_RED_RATIO = 0.13
FILL_BLUE_RATIO = 0.47
CHECK_CIRCLE = (1595.0, 1511.0, 270.0)
CROP_ALPHA = 0.15


def cut_out(rgb):
    h, w, _ = rgb.shape
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    brightness = rgb.max(axis=2)
    glow = np.clip((brightness - BLACK_NOISE) / (255 - BLACK_NOISE), 0, 1)
    green = np.maximum(g, 1)
    fill_hue = (r / green >= FILL_RED_RATIO) & (b / green >= FILL_BLUE_RATIO) & (brightness >= FILL_MIN_BRIGHTNESS)
    bubble = binary_fill_holes(brightness >= BRIGHT) & ((brightness >= BRIGHT) | fill_hue)
    cx, cy, radius = CHECK_CIRCLE
    ys, xs = np.mgrid[0:h, 0:w]
    circle = np.clip((radius - np.hypot(xs - cx, ys - cy)) / 3 + 0.5, 0, 1)
    alpha = np.maximum.reduce([glow, bubble.astype(float), circle])[..., None]
    color = np.clip(rgb / np.where(alpha > 0, alpha, 1), 0, 255)
    return np.concatenate([color, alpha * 255], axis=2).astype(np.uint8)


def square_crop(rgba):
    ys, xs = np.nonzero(rgba[..., 3] > CROP_ALPHA * 255)
    top, bottom, left, right = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    side = max(bottom - top, right - left)
    canvas = np.zeros((side, side, 4), np.uint8)
    oy, ox = (side - (bottom - top)) // 2, (side - (right - left)) // 2
    canvas[oy:oy + bottom - top, ox:ox + right - left] = rgba[top:bottom, left:right]
    return Image.fromarray(canvas, "RGBA")


def main(source, out_dir):
    rgb = np.asarray(Image.open(source).convert("RGB")).astype(float)
    icon = square_crop(cut_out(rgb)).convert("RGBa")
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        path = out / f"icon{size}.png"
        icon.resize((size, size), Image.LANCZOS).convert("RGBA").save(path, optimize=True)
        print(path)


if __name__ == "__main__":
    main(*sys.argv[1:3])
