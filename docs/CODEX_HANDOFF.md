# Codex task prompt

I am building OpenEvoLab, a free/open-source Mac and Ubuntu BMW ENET diagnostic project. Please inspect this repository and start by running the tests and reviewing safety and correctness. Implement only read-only features until Q-firmware activation is verified and a safe design exists.

My field-test vehicle: 2018 BMW 440i, iDrive 6 / NBT EVO, `NBTevo_Q18491I`, CarPlay already works but occupies only the left side of the BMW display.

Hardware: M3 MacBook Air, orange MHD Wi-Fi tuning adapter broadcasting `MHD ENET F0A0`. Mac IP `192.168.4.6`, adapter/router `192.168.4.1/24`. The Mac successfully pinged `192.168.4.1`, connected to TCP port 6801, received BMW gateway discovery identification on UDP 6811, and got a positive read-only identification response from head-unit address 0x63 for DID F190.

Important: This proves diagnostic access, NOT a free CarPlay activation mechanism. We do not have a verified free Q firmware method. Do not guess write operations or reverse-engineer paid activation secrets. Keep VIN and user identifiers out of repository logs. The repository includes a safe diagnostic prototype, tests, and AGENTS.md. Continue from there.
