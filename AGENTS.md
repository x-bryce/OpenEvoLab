# Instructions for coding agents

OpenEvoLab is a **read-only** BMW ENET diagnostic project. The immediate user goal is full-screen CarPlay on a 2018 BMW 440i running NBTevo_Q18491I, but a reliable free Q-specific activation method has NOT been verified.

## Strict boundaries
- Do not invent or guess coding parameters, file offsets, firmware payloads, signing keys, authentication tokens, or activation commands.
- Do not implement ECU writes, session-mode changes, security-access, flashing, FSC injection, or unlock/patch flows until a separate, thoroughly reviewed design with test fixtures, rollback strategy, and informed approval exists.
- Never claim diagnostics, connectivity, or a response to UDS 0x22 proves CarPlay can be activated.
- Avoid copying code from GPL or AGPL projects into this MIT project.
- Never publish VINs, vehicle logs containing personal identifiers, or captured proprietary payloads.
- Keep offline mocked tests green: `python -m unittest discover -s tests -v`.
- Prefer pure Python standard library and macOS/Linux support.

## First tasks
1. Review the existing test coverage and extend it to networking mocks.
2. Verify command-line installation and behavior on macOS/Ubuntu.
3. Research public, reproducible, Q-firmware-specific full-screen activation information, with source links, and state unknowns honestly.
4. Keep feature-gated changes in separate PRs and request user confirmation before any real-car modification.
