import struct
import unittest

from openevolab.hsfz import classify_response, make_read_id_request, read_frame


class FakeSocket:
    def __init__(self, data):
        self.data = data

    def recv(self, n):
        chunk, self.data = self.data[:n], self.data[n:]
        return chunk


class HsfzTests(unittest.TestCase):
    def test_read_request(self):
        self.assertEqual(make_read_id_request(), bytes.fromhex("000000050001f46322f190"))

    def test_positive_reply_suppresses_vin(self):
        # VIN bytes never leave classification method.
        payload = bytes.fromhex("63f462f190") + b"WBAxxxxxxxxxxxxxx"
        self.assertEqual(classify_response(1, payload), "success")

    def test_gateway_echo_ignored(self):
        self.assertIsNone(classify_response(2, bytes.fromhex("f46322f190")))

    def test_negative_response(self):
        self.assertEqual(classify_response(1, bytes.fromhex("63f47f2231")), "negative:0x31")

    def test_pending_response(self):
        self.assertEqual(classify_response(1, bytes.fromhex("63f47f2278")), "pending")

    def test_read_frame(self):
        body = bytes.fromhex("63f462f190") + b"12345678901234567"
        frame = struct.pack(">IH", len(body), 1) + body
        self.assertEqual(read_frame(FakeSocket(frame)), (1, body))

    def test_oversized_frame_rejected(self):
        with self.assertRaises(ValueError):
            read_frame(FakeSocket(struct.pack(">IH", 999999, 1)))


if __name__ == "__main__":
    unittest.main()
