# Dashboard design preview

An interactive draft of the approved Roadster-inspired interface for the 2018 BMW 440i Gran Coupe. It includes Home, Listen, Drive, and app settings in a shared dark instrument frame.

## Run locally

From the repository root, start a local static server.

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory ui
```

Open [the dashboard preview](http://127.0.0.1:8000). Stop the server with Ctrl+C.

The preview uses local scripts, icons, and fonts, so its normal operation works without internet access. Use a modern browser with WebGL enabled for the vehicle scene.

## Review the draft

- Drag the schematic F36 or use the camera buttons to change its angle.
- Select the trunk, doors, lights, or powertrain hotspot to inspect its panel.
- Preview the hatch and lighting illustrations.
- Browse the demo music library and use the persistent playback controls.
- Open Drive for sample thermal readings and engine speed.
- Use Settings to preview demo, stale, and unavailable data, or change temperature units.

All vehicle readings, media state, hatch actions, and lighting actions are simulated. The vehicle model is a schematic placeholder. The Navigate tab and vehicle lock control are visibly unavailable.

Preview preferences are saved in browser storage for the current local origin. This includes the selected page, sample track, units, data presentation, and illustration states. Browser storage is optional.

## Source layout

- `index.html` contains the page structure.
- `dashboard.css` contains product styles and responsive layouts.
- `dashboard.js` owns the local demo state and procedural Three.js vehicle.
- `vendor/` contains pinned dependencies, local fonts, and their licenses.

The dashboard is a static design preview. Vehicle integration, real media playback, navigation, and a production F36 asset are follow-up work.

The visual direction comes from the owner's supplied Roadster UI research brief. Album artwork and the schematic vehicle are original to this draft. See [third-party notices](THIRD_PARTY.md) for bundled libraries and fonts.
