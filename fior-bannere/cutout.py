"""Cut a Fior packshot out of its plain white background and save it as a transparent PNG.

Usage:
    python3 cutout.py <input> <output.png> [--box x0 y0 x1 y1] [--threshold 30]

--box crops the input first (e.g. one bottle out of a group shot).
The white background is flood-filled from the image border, so light areas inside
the bottle (clear glass, white label print) stay untouched. The thin rim around the
bottle is un-mixed from white, which removes the white halo on coloured backgrounds.
"""
import argparse

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

MARKER = (1, 254, 3)  # a colour that does not occur in the photos
RIM_PX = 5


def cutout(image, threshold):
    rgb_img = image.convert("RGB")
    width, height = rgb_img.size

    filled = rgb_img.copy()
    for x, y in [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]:
        if filled.getpixel((x, y)) != MARKER:
            ImageDraw.floodfill(filled, (x, y), MARKER, thresh=threshold)
    background = np.all(np.asarray(filled) == MARKER, axis=-1)

    rgb = np.asarray(rgb_img).astype(np.float32)
    alpha = np.where(background, 0.0, 1.0)

    grown = Image.fromarray((background * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * RIM_PX + 1))
    rim = (np.asarray(grown) > 0) & ~background
    rim_alpha = np.clip((255 - rgb.min(axis=-1)) / 255 * 2.2, 0, 1)
    alpha[rim] = rim_alpha[rim]

    safe_alpha = np.maximum(alpha, 1e-3)[..., None]
    unmixed = np.clip((rgb - 255 * (1 - safe_alpha)) / safe_alpha, 0, 255)
    rgb = np.where(rim[..., None], unmixed, rgb)

    result = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")
    return result.crop(result.getbbox())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--box", type=int, nargs=4)
    parser.add_argument("--threshold", type=int, default=30)
    args = parser.parse_args()

    image = Image.open(args.input)
    if args.box:
        image = image.crop(tuple(args.box))
    cutout(image, args.threshold).save(args.output, optimize=True)


if __name__ == "__main__":
    main()
