"""Adds the open-reader ingress to the shared cloudflared config, safely.

Idempotent, keeps a timestamped backup and refuses to touch a config that does
not end with the http_status:404 catch-all.
"""

import shutil
import sys
import time

CONFIG = "/home/atopnuc/.cloudflared/config.yml"
HOST = "open-library.eridu.top"
SERVICE = "http://localhost:5177"
CATCH_ALL = "  - service: http_status:404"

text = open(CONFIG).read()

if HOST in text:
    print("already there")
    sys.exit(0)

if CATCH_ALL not in text:
    print("refusing: no catch-all rule found")
    sys.exit(1)

backup = CONFIG + ".bak-" + time.strftime("%Y%m%d-%H%M%S")
shutil.copy(CONFIG, backup)
block = f"  - hostname: {HOST}\n    service: {SERVICE}\n"
open(CONFIG, "w").write(text.replace(CATCH_ALL, block + CATCH_ALL))
print("added, backup at", backup)
