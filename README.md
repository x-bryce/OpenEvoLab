# OpenEvoLab

Free, cross-platform **read-only** BMW ENET/HSFZ diagnostic research tools, with a long-term research goal of understanding factory full-screen Apple CarPlay support on certain NBT EVO head units.

**Current capabilities:** discover an ENET gateway; check a diagnostic TCP port; ask the NBT EVO head unit (address `0x63`) to read identifier `F190` without displaying VIN contents.

**Not yet supported:** enabling full-screen CarPlay, modifying FDL coding, writing FSC licenses, updating firmware, patching binaries, or flashing a head unit. No commercial activation package has been reverse engineered or copied.

## Dashboard preview

The [interactive dashboard draft](ui/README.md) includes a glossy black F36-inspired Gran Coupe model, simulated telemetry and media, and preview-only trunk and lighting controls. It runs locally with Python's static server and bundled browser assets.

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory ui
```

Open [the local preview](http://127.0.0.1:8000).

## Field-tested starting point

A contributor's 2018 BMW 440i with iDrive 6 and `NBTevo_Q18491I`, an MHD Wi-Fi adapter broadcasting `MHD ENET`, and an M3 MacBook Air returned a successful ENET discovery and an NBT EVO diagnostic identification response using the read-only request reproduced in this CLI. **The CLI itself is not yet field-tested as a package.**

## Installation

Use macOS or Ubuntu with Python 3.10+. These commands use only the Python standard library, so they also work while connected to an adapter Wi-Fi network **without internet access**. With the vehicle parked, ignition on and adapter connected:

```bash
cd OpenEvoLab
PYTHONPATH=src python3 -m openevolab discover
PYTHONPATH=src python3 -m openevolab check-port
PYTHONPATH=src python3 -m openevolab identify
```

For an installed CLI, while connected to normal internet (before connecting to the car), optionally run `python3 -m pip install -e .` in a virtual environment. Then use `openevolab discover`, `openevolab check-port`, and `openevolab identify`.

Defaults assume adapter IP `192.168.4.1`, TCP `6801`, broadcast `192.168.4.255`. Override them as needed:

```bash
openevolab --host 192.168.4.1 --port 6801 --timeout 4 identify
openevolab discover --broadcast 192.168.4.255
```

Run offline unit tests:

```bash
python -m unittest discover -s tests -v
```

## Scope and safety

- Do **not** run while driving.
- Never expose full VINs, private vehicle identifiers, or authentication tokens in public bug reports.
- Requests are limited to gateway identification and UDS `0x22 F190` (a read-only identifier).
- Do not send raw UDS requests or coding/flash commands from an unreviewed contributor's branch.
- Diagnostic traffic should not be shared with apps simultaneously using the same adapter.
- This software is independent, experimental, and not affiliated with or approved by BMW.

## Development status

The eventual Q-firmware CarPlay full-screen activation mechanism is **not documented or implemented** here. Commercial activation support is not evidence that a publicly available write procedure is known or safe. See `docs/ROADMAP.md` and `AGENTS.md` before making changes.

## References

- [rawenet ENET/HSFZ research](https://github.com/rawmind0/rawenet/blob/master/docs/hsfz-protocol.md)
- [Klartext read-only BMW diagnostic project](https://github.com/HadiCherkaoui/klartext)

Protocol framing is independently implemented from public protocol descriptions. No source is copied from reference projects.

## License

MIT, see `LICENSE`.
