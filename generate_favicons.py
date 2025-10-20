import sys
from pathlib import Path
from PIL import Image, ImageChops

# Configuration
DEFAULT_SOURCE = "Abstraktní strom.png"  # Fallback if new file not present
PREFERRED_SOURCE = "novy_favicon.png"    # New requested source
# Padding ratio keeps a small safe margin so the icon doesn't touch edges
PADDING_RATIO = 0.0  # 0% padding to maximize visible size
OUTPUTS = {
    "favicon-16x16.png": (16, 16),
    "favicon-32x32.png": (32, 32),
    "apple-touch-icon.png": (180, 180),
    "android-chrome-192x192.png": (192, 192),
    "android-chrome-512x512.png": (512, 512),
    "mstile-150x150.png": (150, 150),
    # maskable icon (transparent padding around) commonly 512x512
    "maskable-icon-512x512.png": (512, 512),
}
ICO_SIZES = [(16, 16), (32, 32), (48, 48), (64, 64)]


def load_source_image(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    return image


def color_distance(c1, c2) -> int:
    return sum((c1[i] - c2[i]) ** 2 for i in range(3))


def make_background_transparent(image: Image.Image, tolerance: int = 30) -> Image.Image:
    """
    Make uniform dark background transparent by sampling the four corners and
    removing pixels near that color. Keeps white ring and colored logo.
    """
    if image.mode != "RGBA":
        image = image.convert("RGBA")
    rgb = image.convert("RGB")
    width, height = image.size

    # Sample corners to estimate background color
    samples = [
        rgb.getpixel((0, 0)),
        rgb.getpixel((width - 1, 0)),
        rgb.getpixel((0, height - 1)),
        rgb.getpixel((width - 1, height - 1)),
    ]
    # Average corner color
    avg = tuple(sum(c[i] for c in samples) // 4 for i in range(3))

    # If average is dark, assume it is the background
    if sum(avg) / 3 > 40:
        return image  # not a dark background

    px = image.load()
    for y in range(height):
        for x in range(width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if color_distance((r, g, b), avg) <= tolerance * tolerance:
                # make pixel transparent
                px[x, y] = (r, g, b, 0)
    return image


def trim_transparent_borders(image: Image.Image) -> Image.Image:
    """Trim fully transparent borders to maximize visible area."""
    if image.mode != "RGBA":
        return image
    alpha = image.split()[-1]
    bbox = alpha.getbbox()
    if bbox:
        return image.crop(bbox)
    return image


def trim_uniform_border(image: Image.Image, tolerance: int = 6) -> Image.Image:
    """If the image has no transparency, trim borders that match the corner color.
    This helps remove solid background rings/boxes (e.g., black background).
    """
    if image.mode not in ("RGB", "RGBA"):
        return image
    rgb = image.convert("RGB")
    width, height = rgb.size
    corner_color = rgb.getpixel((0, 0))

    def is_similar(c1, c2) -> bool:
        return all(abs(c1[i] - c2[i]) <= tolerance for i in range(3))

    left = 0
    while left < width:
        col = rgb.crop((left, 0, left + 1, height))
        if any(not is_similar(px, corner_color) for px in col.getdata()):
            break
        left += 1

    right = width - 1
    while right >= 0:
        col = rgb.crop((right, 0, right + 1, height))
        if any(not is_similar(px, corner_color) for px in col.getdata()):
            break
        right -= 1

    top = 0
    while top < height:
        row = rgb.crop((0, top, width, top + 1))
        if any(not is_similar(px, corner_color) for px in row.getdata()):
            break
        top += 1

    bottom = height - 1
    while bottom >= 0:
        row = rgb.crop((0, bottom, width, bottom + 1))
        if any(not is_similar(px, corner_color) for px in row.getdata()):
            break
        bottom -= 1

    # If crop would remove everything or nothing, return original
    if left >= right or top >= bottom:
        return image
    if left == 0 and right == width - 1 and top == 0 and bottom == height - 1:
        return image
    return image.crop((left, top, right + 1, bottom + 1))


def make_square(image: Image.Image, size: int) -> Image.Image:
    """
    Fit the source image into a square canvas while preserving aspect ratio.
    Trims background and borders first, then applies padding (currently 0%).
    """
    # Remove dark background -> transparent
    processed = make_background_transparent(image)
    # First trim transparent borders, then attempt to trim a uniform border color
    trimmed = trim_transparent_borders(processed)
    trimmed = trim_uniform_border(trimmed)
    src_w, src_h = trimmed.size

    # Leave a small padding so content doesn't touch edges
    inner_size = int(size * (1.0 - 2 * PADDING_RATIO))
    inner_size = max(1, inner_size)

    scale = min(inner_size / src_w, inner_size / src_h)
    new_w, new_h = max(1, int(src_w * scale)), max(1, int(src_h * scale))
    resized = trimmed.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    offset = ((size - new_w) // 2, (size - new_h) // 2)
    canvas.paste(resized, offset, resized)
    return canvas


def save_pngs(src: Image.Image, project_root: Path) -> None:
    for filename, (w, h) in OUTPUTS.items():
        out_img = make_square(src, max(w, h))
        out_path = project_root / filename
        out_img.save(out_path, format="PNG")
        print(f"Wrote {out_path} ({w}x{h})")


def save_ico(src: Image.Image, project_root: Path) -> None:
    sizes_imgs = [make_square(src, s[0]) for s in ICO_SIZES]
    ico_path = project_root / "favicon.ico"
    sizes = [img.size for img in sizes_imgs]
    sizes_imgs[0].save(ico_path, format="ICO", sizes=sizes)
    print(f"Wrote {ico_path} (sizes: {sizes})")


def resolve_source(root: Path, cli_arg: str | None) -> Path:
    if cli_arg:
        p = (root / cli_arg)
        if p.exists():
            return p
        print(f"Provided source not found: {p}")
    pref = root / PREFERRED_SOURCE
    if pref.exists():
        return pref
    fallback = root / DEFAULT_SOURCE
    return fallback


def main() -> int:
    root = Path(__file__).resolve().parent
    cli_source = sys.argv[1] if len(sys.argv) > 1 else None
    source_path = resolve_source(root, cli_source)
    if not source_path.exists():
        print(f"Source image not found: {source_path}")
        return 1

    print(f"Using source: {source_path.name}")
    src = load_source_image(source_path)
    save_pngs(src, root)
    save_ico(src, root)
    print("All favicon assets generated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
