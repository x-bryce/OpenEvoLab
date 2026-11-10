"""OpenEvoLab CLI. No vehicle-state-changing operations are implemented."""
from __future__ import annotations

import argparse
import socket
import sys

from .hsfz import classify_response, make_read_id_request, read_frame

DISCOVERY_MESSAGE = bytes.fromhex("000000000011")


def discover(broadcast: str, timeout: float) -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        s.settimeout(timeout)
        s.sendto(DISCOVERY_MESSAGE, (broadcast, 6811))
        try:
            data, addr = s.recvfrom(1024)
        except socket.timeout:
            print("No ENET discovery response received.")
            return 1
    # Avoid printing response bytes because they often include a full VIN.
    is_bmw = b"DIAGADR10" in data and b"BMWVIN" in data
    print(f"Discovery response from {addr[0]}")
    print(f"BMW gateway identification markers: {'present' if is_bmw else 'not confirmed'}")
    return 0 if is_bmw else 1


def check_port(host: str, port: int, timeout: float) -> int:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            pass
    except OSError as exc:
        print(f"TCP connection failed to {host}:{port}: {exc}")
        return 1
    print(f"TCP connection succeeded: {host}:{port}")
    print("This confirms a diagnostic socket, not vehicle coding access.")
    return 0


def identify(host: str, port: int, timeout: float) -> int:
    try:
        with socket.create_connection((host, port), timeout=timeout) as s:
            s.settimeout(timeout)
            s.sendall(make_read_id_request())
            for _ in range(16):
                kind, body = read_frame(s)
                result = classify_response(kind, body)
                if result is None or result == "pending":
                    continue
                if result == "success":
                    print("SUCCESS: NBT EVO (0x63) answered read-only identifier F190.")
                    print("VIN content suppressed for privacy.")
                    return 0
                if result.startswith("negative:"):
                    print(f"Head unit rejected read-only identification: {result}")
                    return 1
                print("Head unit answered, but the response was not the expected identifier.")
                return 1
        print("No matching NBT EVO identification reply received.")
        return 1
    except (ConnectionError, OSError, ValueError) as exc:
        print(f"Identification failed: {exc}")
        return 1


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        prog="openevolab",
        description="Read-only BMW ENET gateway/head-unit identification. No coding or flashing.",
    )
    p.add_argument("--host", default="192.168.4.1", help="Wi-Fi ENET adapter IP")
    p.add_argument("--port", type=int, default=6801, help="HSFZ TCP diagnostic port")
    p.add_argument("--timeout", type=float, default=4.0, help="Socket timeout in seconds")
    cmds = p.add_subparsers(dest="command", required=True)
    d = cmds.add_parser("discover", help="Broadcast read-only BMW ENET gateway discovery")
    d.add_argument("--broadcast", default="192.168.4.255", help="Local subnet broadcast address")
    cmds.add_parser("check-port", help="Test TCP availability of the HSFZ port")
    cmds.add_parser("identify", help="Read-only identifier request to NBT EVO, without showing VIN")
    args = p.parse_args(argv)
    if args.timeout <= 0 or not (1 <= args.port <= 65535):
        p.error("Timeout must be positive and port must be in 1..65535")
    if args.command == "discover":
        return discover(args.broadcast, args.timeout)
    if args.command == "check-port":
        return check_port(args.host, args.port, args.timeout)
    if args.command == "identify":
        return identify(args.host, args.port, args.timeout)
    return 2


if __name__ == "__main__":
    sys.exit(main())
