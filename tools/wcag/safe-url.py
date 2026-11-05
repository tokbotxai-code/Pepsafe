#!/usr/bin/env python3
"""Exit 0 only if the URL is http(s) and its host resolves to public addresses (blocks private, loopback, link-local, reserved)."""
import ipaddress, socket, sys, urllib.parse
u = urllib.parse.urlparse(sys.argv[1])
if u.scheme not in ("http", "https") or not u.hostname or "." not in u.hostname:
    sys.exit(1)
try:
    infos = socket.getaddrinfo(u.hostname, None)
except Exception:
    sys.exit(1)
for i in infos:
    ip = ipaddress.ip_address(i[4][0])
    if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast or ip.is_unspecified:
        sys.exit(1)
sys.exit(0)
