# Roadmap

## v0.1: read-only baseline (included)
- [x] Mac/Linux Python CLI, no external runtime dependencies
- [x] Gateway discovery on UDP/6811
- [x] Diagnostic port connectivity test on TCP/6801
- [x] Read-only head-unit identification on address 0x63, without printing VIN
- [x] Unit tests for HSFZ frame parsing and privacy
- [ ] Confirm packaged CLI on the field-test vehicle

## v0.2: reliability and observability
- [ ] Configuration auto-detection for popular Wi-Fi ENET adapters
- [ ] Robust HSFZ session handling, response pending, retries and trace logging
- [ ] Opt-in *redacted* capture fixtures and cross-platform CI
- [ ] Device identification without assuming all 0x63 ECUs are NBT EVO
- [ ] Mock network tests for discover/check-port/identify

## Research milestone (not an implementation promise)
- [ ] Identify independently documented NBT EVO Q firmware full-screen configuration requirements
- [ ] Document safe read-only ways to determine prerequisites
- [ ] Obtain reproducible evidence from independent researchers, including rollback strategy and validated ECU backups
- [ ] Conduct controlled tests on dedicated test equipment before exposing any write capability

Do not assume standard FDL coding on newer firmware applies to Q. No firmware patching or FSC-related work is part of v0.1.
