#!/usr/bin/env python3
"""Prints a scannable URL (stdout) and exits 0, or exits 1.
Only http(s); host must resolve to public addresses only (blocks private, loopback, link-local, reserved).
If the host does not resolve, tries the same host with 'www.' added or removed."""
import ipaddress, socket, sys, urllib.parse

def public_ips(host):
    try:
        infos = socket.getaddrinfo(host, None)
    except Exception:
        return None
    for i in infos:
        ip = ipaddress.ip_address(i[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast or ip.is_unspecified:
            return False
    return True

u = urllib.parse.urlparse(sys.argv[1])
if u.scheme not in ("http", "https") or not u.hostname or "." not in u.hostname:
    sys.exit(1)
hosts = [u.hostname]
hosts.append(u.hostname[4:] if u.hostname.startswith("www.") else "www." + u.hostname)
for h in hosts:
    r = public_ips(h)
    if r is True:
        print(u._replace(netloc=h + (":%d" % u.port if u.port else "")).geturl())
        sys.exit(0)
    if r is False:
        sys.exit(1)
sys.exit(1)
