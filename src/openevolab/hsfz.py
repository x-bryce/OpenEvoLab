"""Minimal HSFZ framing for *read-only* UDS identification requests.

All user-facing operations in this module are limited to service 0x22,
ReadDataByIdentifier, with identifier F190. No general-purpose UDS sender
is exposed by the CLI.
"""
from __future__ import annotations

import socket
import struct

MAX_PAYLOAD = 4096
READ_VIN_DID = bytes.fromhex("22 F1 90")


def make_read_id_request(*, tester: int = 0xF4, target: int = 0x63) -> bytes:
    """Build HSFZ diagnostic-data frame for a read-only DID request."""
    body = bytes((tester, target)) + READ_VIN_DID
    return struct.pack(">IH", len(body), 1) + body


def recvall(sock: socket.socket, amount: int) -> bytes:
    buf = bytearray()
    while len(buf) < amount:
        part = sock.recv(amount - len(buf))
        if not part:
            raise ConnectionError("Connection closed during frame")
        buf.extend(part)
    return bytes(buf)


def read_frame(sock: socket.socket) -> tuple[int, bytes]:
    header = recvall(sock, 6)
    size, frame_type = struct.unpack(">IH", header)
    if size > MAX_PAYLOAD or size < 2:
        raise ValueError("Invalid HSFZ frame size")
    return frame_type, recvall(sock, size)


def classify_response(frame_type: int, body: bytes, *, target: int = 0x63, tester: int = 0xF4) -> str | None:
    """Classify reply without exposing the VIN or raw identification payload.

    Returns success, pending, negative:<NRC>, or None (echo/other frame).
    """
    if frame_type != 1 or len(body) < 3 or body[0] != target or body[1] != tester:
        return None
    uds = body[2:]
    if uds.startswith(bytes.fromhex("62 F1 90")):
        return "success"
    if len(uds) >= 3 and uds[:2] == bytes.fromhex("7F 22"):
        if uds[2] == 0x78:
            return "pending"
        return f"negative:0x{uds[2]:02X}"
    return "unexpected"
