import sys
from pathlib import Path
from PIL import Image

# Configuration
SOURCE_NAME = "Abstraktní strom.png"  # Unicode filename supported on Windows
OUTPUTS = {
    "favicon-16x16.png": (16, 16),
    "favicon-32x32.png": (32, 32),
    "apple-touch-icon.png": (180, 180),
    "android-chrome-192x192.png": (192, 192),
    "android-chrome-512x512.png": (512, 512),
    "mstile-150x150.png": (150, 150),
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
    # PIL expects a single image with sizes specified
    ico_path = project_root / "favicon.ico"
    sizes = [img.size for img in sizes_imgs]
    sizes_imgs[0].save(ico_path, format="ICO", sizes=sizes)
    print(f"Wrote {ico_path} (sizes: {sizes})")


def main() -> int:
    root = Path(__file__).resolve().parent
    source_path = root / SOURCE_NAME
    if not source_path.exists():
        print(f"Source image not found: {source_path}")
        return 1

    src = load_source_image(source_path)
    save_pngs(src, root)
    save_ico(src, root)
    print("All favicon assets generated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
