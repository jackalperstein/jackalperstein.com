#!/usr/bin/env python3
"""Strip EXIF/GPS metadata from the site's photos.

Run this before committing any new or updated image so location data,
timestamps, and camera info never ship to the live site. JPEGs are re-saved
losslessly (quality='keep'), so dimensions and image quality are unchanged --
only metadata is dropped.

Usage:
    python scripts/strip-exif.py            # clean assets/ (default)
    python scripts/strip-exif.py --check    # report only, change nothing
    python scripts/strip-exif.py path/...   # clean specific files/folders

Requires Pillow:  pip install Pillow
"""

import os
import sys
from PIL import Image, ExifTags

EXTS = (".jpg", ".jpeg")


def find_jpegs(paths):
    """Collect JPEGs from the given files/dirs, de-duped for case-insensitive
    filesystems (Windows/macOS match *.jpg and *.JPG to the same file)."""
    seen, out = set(), []
    for p in paths:
        candidates = []
        if os.path.isdir(p):
            for root, _, files in os.walk(p):
                candidates += [os.path.join(root, f) for f in files]
        elif os.path.isfile(p):
            candidates = [p]
        for f in candidates:
            if f.lower().endswith(EXTS):
                key = os.path.normcase(os.path.abspath(f))
                if key not in seen:
                    seen.add(key)
                    out.append(f)
    return sorted(out)


def metadata_summary(img):
    """Return (tag_count, has_gps) for an open image."""
    exif = img.getexif()
    if not exif:
        return 0, False
    gps = exif.get_ifd(ExifTags.IFD.GPSInfo)
    return len(exif), bool(gps)


def main(argv):
    check_only = "--check" in argv
    targets = [a for a in argv if not a.startswith("--")] or ["assets"]

    files = find_jpegs(targets)
    if not files:
        print("No JPEG files found under:", ", ".join(targets))
        return 0

    cleaned = gps_found = 0
    for f in files:
        img = Image.open(f)
        tags, has_gps = metadata_summary(img)
        if has_gps:
            gps_found += 1
        if tags == 0:
            continue
        flag = " [GPS]" if has_gps else ""
        if check_only:
            print(f"would strip {tags} tag(s){flag}: {f}")
        else:
            img.save(f, format="JPEG", quality="keep")  # drops EXIF, no recompress
            print(f"stripped {tags} tag(s){flag}: {f}")
            cleaned += 1

    print("-" * 48)
    verb = "carry" if check_only else "cleaned"
    print(f"{len(files)} JPEGs scanned, {cleaned if not check_only else '?'} "
          f"{verb} metadata, {gps_found} had GPS.")
    if check_only and gps_found:
        return 1  # non-zero so CI/pre-commit can flag it
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
