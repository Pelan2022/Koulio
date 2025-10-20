import sys
from pathlib import Path
from PIL import Image, ImageChops

# Configuration
DEFAULT_SOURCE = "Abstraktní strom.png"  # Fallback if new file not present
PREFERRED_SOURCE = "novy_favicon.png"    # New requested source
# Padding ratio keeps a small safe margin so the icon doesn't touch edges
PADDING_RATIO = 0.01  # 1% of target size for larger visible icon
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


def trim_transparent_borders(image: Image.Image) -> Image.Image:
    """Trim fully transparent borders to maximize visible area."""
    if image.mode != "RGBA":
        return image
    alpha = image.split()[-1]
    bbox = alpha.getbbox()
    if bbox:
        return image.crop(bbox)
    return image


def make_square(image: Image.Image, size: int) -> Image.Image:
    """
    Fit the source image into a square canvas while preserving aspect ratio.
    Trims transparent borders first, then applies a small padding.
    """
    trimmed = trim_transparent_borders(image)
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
