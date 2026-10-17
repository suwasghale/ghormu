"""
Image processing utilities.

Responsible for preparing uploaded images before they are stored.

Features
--------
- Validates image files.
- Guards against decompression bombs.
- Converts to RGB.
- Applies EXIF orientation, then discards remaining metadata.
- Center crops.
- Resizes.
- Converts to WebP.
"""

from __future__ import annotations

from io import BytesIO

from django.core.files.base import ContentFile
from PIL import Image, ImageOps, UnidentifiedImageError

# core/ stays app-agnostic: importing an app's constants here would
# make this module unusable by any other app and invert the dependency
# direction. Callers pass their own sizing.
DEFAULT_OUTPUT_SIZE = (512, 512)
DEFAULT_OUTPUT_QUALITY = 85
DEFAULT_OUTPUT_FORMAT = "WEBP"

# ------------------------------------------------------------------------------
# Safety limits
# ------------------------------------------------------------------------------

# A "decompression bomb" is a small file that expands to an enormous
# bitmap: a 1000x1000 pixel PNG of one colour is a few KB, but a
# 50000x50000 one is still small on disk and needs ~7 GB of RAM once
# decoded. Pillow warns above its own threshold and raises above twice
# that; both are set here rather than left at the library default.
MAX_IMAGE_PIXELS = 40_000_000  # ~6300x6300

Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS

# Formats accepted from a client. Anything else - including formats
# Pillow can technically decode, such as those with external references
# - is rejected.
ALLOWED_INPUT_FORMATS = frozenset(
    {
        "JPEG",
        "PNG",
        "WEBP",
        "GIF",
    }
)


class InvalidImage(ValueError):
    """
    Raised when an upload is not a usable image.
    """


# =============================================================================
# Public API
# =============================================================================


def process_image(
    *,
    image_file,
    size: tuple[int, int] = DEFAULT_OUTPUT_SIZE,
    quality: int = DEFAULT_OUTPUT_QUALITY,
    output_format: str = DEFAULT_OUTPUT_FORMAT,
    fit: str = "cover",
) -> ContentFile:
    """
    Process an uploaded image.

    Workflow
    --------
        1. Verify the file really is a supported image.
        2. Reject oversized bitmaps.
        3. Apply EXIF orientation.
        4. Convert to RGB, dropping transparency and metadata.
        5. Crop or bound to ``size``.
        6. Re-encode.

    Args:
        fit:
            ``"cover"`` crops to exactly ``size``, which is what an
            avatar wants — a fixed square, subject centred.

            ``"contain"`` scales down to fit *within* ``size`` and keeps
            the aspect ratio, which is what editorial images want. A
            landscape gallery photo run through ``"cover"`` at a square
            size loses most of the frame, so content uploads must not
            use the avatar path.

    Raises
    ------
    InvalidImage
        The upload is not a supported image, or is too large to decode
        safely.
    """

    # -------------------------------------------------------------------------
    # Verify
    #
    # verify() checks structural integrity without decoding the pixels,
    # so a malformed or disguised file is rejected before any
    # allocation. It leaves the image unusable afterwards, hence the
    # rewind and second open.
    # -------------------------------------------------------------------------

    try:
        image_file.seek(0)

        probe = Image.open(image_file)
        probe.verify()

        image_format = probe.format

    except (UnidentifiedImageError, OSError, SyntaxError) as exc:
        raise InvalidImage(
            "The uploaded file is not a valid image.",
        ) from exc

    except Image.DecompressionBombError as exc:
        raise InvalidImage(
            "The uploaded image is too large to process.",
        ) from exc

    if image_format not in ALLOWED_INPUT_FORMATS:
        # The client-supplied Content-Type is not consulted anywhere:
        # it is attacker controlled and says nothing about the bytes.
        raise InvalidImage(
            "Supported image formats are JPEG, PNG, WebP and GIF.",
        )

    # -------------------------------------------------------------------------
    # Decode
    # -------------------------------------------------------------------------

    try:
        image_file.seek(0)

        image = Image.open(image_file)

        if (image.width * image.height) > MAX_IMAGE_PIXELS:
            raise InvalidImage(
                "The uploaded image has too many pixels.",
            )

        image.load()

    except Image.DecompressionBombError as exc:
        raise InvalidImage(
            "The uploaded image is too large to process.",
        ) from exc

    except (UnidentifiedImageError, OSError) as exc:
        raise InvalidImage(
            "The uploaded image could not be read.",
        ) from exc

    # -------------------------------------------------------------------------
    # Respect phone camera orientation
    # -------------------------------------------------------------------------

    image = ImageOps.exif_transpose(image)

    # -------------------------------------------------------------------------
    # Convert transparency / palette images
    #
    # Re-encoding through a plain RGB buffer also strips EXIF, which on
    # phone photos routinely carries GPS coordinates. Serving that back
    # from a public avatar URL would publish the user's location.
    # -------------------------------------------------------------------------

    if image.mode != "RGB":
        image = image.convert("RGB")

    # -------------------------------------------------------------------------
    # Crop or bound
    # -------------------------------------------------------------------------

    if fit == "contain":
        # Scales down only: an image already smaller than the box is
        # left alone rather than upscaled into a blurry larger file.
        image.thumbnail(size, resample=Image.Resampling.LANCZOS)
    else:
        image = ImageOps.fit(
            image,
            size,
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.5),
        )

    # -------------------------------------------------------------------------
    # Encode
    # -------------------------------------------------------------------------

    output = BytesIO()

    image.save(
        output,
        format=output_format,
        quality=quality,
        optimize=True,
    )

    output.seek(0)

    return ContentFile(output.read())
