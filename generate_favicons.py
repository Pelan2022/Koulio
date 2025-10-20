import sys
from pathlib import Path
from PIL import Image

# Configuration
DEFAULT_SOURCE = "Abstraktní strom.png"  # Fallback if new file not present
PREFERRED_SOURCE = "novy_favicon.png"    # New requested source
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


def make_square(image: Image.Image, size: int) -> Image.Image:
    """
    Fit the source image into a square canvas while preserving aspect ratio.
    Uses transparent background so it looks good in dark/light themes.
    """
    src_w, src_h = image.size
    scale = min(size / src_w, size / src_h)
    new_w, new_h = int(src_w * scale), int(src_h * scale)
    resized = image.resize((new_w, new_h), Image.LANCZOS)

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
