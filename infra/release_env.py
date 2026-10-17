"""Persist reviewed image references without rewriting any production secrets."""
import argparse
import os
from pathlib import Path
import re
import stat
import tempfile

IMAGE_KEYS = frozenset({"BACKEND_IMAGE", "FRONTEND_IMAGE", "BACKUP_IMAGE"})
ASSIGNMENT = re.compile(r"^\s*(?:export\s+)?([A-Z_]+)\s*=")
REFERENCE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._:/@-]+$")


def read_images(text):
    images = {}
    for line in text.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        key, separator, value = line.partition("=")
        if separator != "=" or key not in IMAGE_KEYS or not REFERENCE.fullmatch(value):
            raise ValueError("Invalid release image assignment")
        if key in images:
            raise ValueError("Duplicate release image assignment")
        images[key] = value
    if not {"BACKEND_IMAGE", "FRONTEND_IMAGE"}.issubset(images):
        raise ValueError("Both backend and frontend image references are required")
    return images


def update_environment(environment, images):
    lines = []
    for line in environment.splitlines(keepends=True):
        match = ASSIGNMENT.match(line)
        if not match or match.group(1) not in images:
            lines.append(line)
    text = "".join(lines)
    if text and not text.endswith("\n"):
        text += "\n"
    return text + "".join(f"{key}={images[key]}\n" for key in sorted(images))


def persist(environment_path, images):
    original = environment_path.read_text(encoding="utf-8")
    updated = update_environment(original, images)
    # A failed write never truncates the live environment. Preserve its mode;
    # temporary files are created alongside it for an atomic rename.
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", newline="\n",
                                         dir=environment_path.parent, delete=False) as temporary:
            temporary_path = Path(temporary.name)
            os.chmod(temporary_path, stat.S_IMODE(environment_path.stat().st_mode))
            temporary.write(updated)
            temporary.flush()
            os.fsync(temporary.fileno())
        os.replace(temporary_path, environment_path)
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--environment", type=Path, default=Path("backend/.env.production"))
    parser.add_argument("--images", type=Path, required=True)
    args = parser.parse_args()
    images = read_images(args.images.read_text(encoding="utf-8"))
    persist(args.environment, images)
    print(f"Persisted {len(images)} release image references; other settings retained")


if __name__ == "__main__":
    main()
