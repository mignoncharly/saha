#!/bin/bash
# Generate a VAPID keypair for web push and print it as .env lines.
#
# Output format is base64url-encoded RAW keys (NOT PEM), which is what this
# app uses: the backend passes VAPID_PRIVATE_KEY straight to pywebpush and
# serves VAPID_PUBLIC_KEY (the uncompressed EC point) to the browser via
# /api/notifications/vapid-public-key/, where it becomes the
# `applicationServerKey`. Emitting PEM here would break push subscriptions.
#
#   VAPID_PRIVATE_KEY -> base64url(32-byte private scalar)        ~43 chars
#   VAPID_PUBLIC_KEY  -> base64url(65-byte uncompressed point)    ~87 chars
#
# Copy the two printed lines into your .env, then restart saha-api/worker.
python3 -c "
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import base64

def b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b'=').decode('utf-8')

key = ec.generate_private_key(ec.SECP256R1())
priv = key.private_numbers().private_value.to_bytes(32, 'big')
pub = key.public_key().public_bytes(
    serialization.Encoding.X962,
    serialization.PublicFormat.UncompressedPoint,
)
print(f'VAPID_PRIVATE_KEY={b64url(priv)}')
print(f'VAPID_PUBLIC_KEY={b64url(pub)}')
"
