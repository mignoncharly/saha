#!/bin/bash
# Generate VAPID keys and print them
python -c "
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
private_key = ec.generate_private_key(ec.SECP256R1())
public_key = private_key.public_key()
priv = private_key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()).decode('utf-8')
pub = public_key.public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo).decode('utf-8')
print(f'VAPID_PRIVATE_KEY={priv}')
print(f'VAPID_PUBLIC_KEY={pub}')
"