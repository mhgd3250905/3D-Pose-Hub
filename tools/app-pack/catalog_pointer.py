"""Validate channel pointers before a pack builder writes them to disk."""

import argparse
import re
from datetime import datetime, timedelta, timezone
from urllib.parse import urlsplit


_PUBLISHED_AT = re.compile(
    r"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}"
    r"(?:\.[0-9]+)?(?:Z|[+-](?:[01][0-9]|2[0-3]):[0-5][0-9])"
)


def published_at(value):
    """Argparse type: ISO-8601 timestamp with an explicit time zone."""
    try:
        if not isinstance(value, str) or not _PUBLISHED_AT.fullmatch(value):
            raise ValueError()
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.utcoffset() is None:
            raise ValueError()
    except ValueError:
        raise argparse.ArgumentTypeError(
            "--published-at must be ISO-8601 with a time zone, "
            "e.g. 2026-11-07T10:45:00+08:00"
        ) from None
    return value


def default_published_at():
    return datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds")


def validate_catalog_pointer(pointer):
    """Match the SDK's required pointer fields; publication time is stricter.

    The SDK tolerates absent or unparseable publication metadata for existing
    pointers. Builders always emit a valid timestamp to prevent new bad data.
    """
    if not isinstance(pointer, dict):
        raise ValueError("Pointer must be an object")
    if type(pointer.get("schema")) is not int or pointer["schema"] != 1:
        raise ValueError("Unsupported pointer schema")
    pack = pointer.get("pack")
    if not isinstance(pack, str) or len(pack) > 64 or not re.fullmatch(
        r"[a-z0-9]+(?:-[a-z0-9]+)*", pack
    ):
        raise ValueError("pointer.pack invalid")
    catalog = pointer.get("catalog")
    try:
        uri = urlsplit(catalog) if isinstance(catalog, str) else None
        valid_url = (
            uri is not None
            and uri.scheme == "https"
            and bool(uri.hostname)
            and uri.path.endswith(".json")
        )
    except ValueError:
        valid_url = False
    if not valid_url:
        raise ValueError("pointer.catalog must be an https JSON URL")
    digest = pointer.get("catalog_sha256")
    if not isinstance(digest, str) or not re.fullmatch(r"[a-f0-9]{64}", digest):
        raise ValueError("pointer.catalog_sha256 invalid")
    size = pointer.get("catalog_bytes")
    if type(size) is not int or not 1 <= size <= 64 * 1024 * 1024:
        raise ValueError("pointer.catalog_bytes invalid")
    min_sdk = pointer.get("min_sdk")
    if not isinstance(min_sdk, str) or not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", min_sdk):
        raise ValueError("pointer.min_sdk invalid")
    published_at(pointer.get("published_at"))
