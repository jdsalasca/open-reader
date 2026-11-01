"""Renames an ingress hostname in the shared cloudflared config.

Usage: python3 rename-host.py old.eridu.top new.eridu.top [service-url]
Keeps a timestamped backup and refuses to touch the file if the block is missing.
"""

import shutil
import sys
import time

CONFIG = "/home/atopnuc/.cloudflared/config.yml"

if len(sys.argv) < 3:
    print("usage: rename-host.py OLD NEW [service]")
    sys.exit(1)

old, new = sys.argv[1], sys.argv[2]
service = sys.argv[3] if len(sys.argv) > 3 else "http://localhost:5177"

text = open(CONFIG).read()

if f"hostname: {new}" in text:
    print("already there")
    sys.exit(0)

old_block = f"  - hostname: {old}\n    service: {service}\n"
new_block = f"  - hostname: {new}\n    service: {service}\n"

if old_block not in text:
    print("refusing: block not found for", old, "with", service)
    sys.exit(1)

backup = CONFIG + ".bak-" + time.strftime("%Y%m%d-%H%M%S")
shutil.copy(CONFIG, backup)
open(CONFIG, "w").write(text.replace(old_block, new_block))
print("renamed", old, "->", new, "| backup:", backup)
