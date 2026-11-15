# Dashboard design preview

An interactive vehicle control and diagnostics dashboard draft for the 2018 BMW 440i Gran Coupe. It borrows the Roadster's dark visual style and selective red technical accents. The product focuses on Vehicle, Monitor, Diagnostics, and Settings, with persistent connection status.

## Run locally

From the repository root, start a local static server.

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory ui
```

Open [the dashboard preview](http://127.0.0.1:8000). Stop the server with Ctrl+C.

The preview uses local scripts, icons, and fonts, so its normal operation works without internet access. Use a modern browser with WebGL enabled for the vehicle scene.

## Review the draft

- Drag the F36-inspired model or use the camera buttons to change its angle.
- Select the trunk, doors, lights, or powertrain hotspot to inspect its panel.
- Preview the hatch and lighting illustrations.
- Open Monitor for sample thermal readings and engine speed.
- Open Diagnostics to review the disconnected, not-scanned state and diagnostic coverage placeholders.
- Use Settings to preview demo, stale, and unavailable data, or change temperature units.

All vehicle readings, hatch actions, and lighting actions are simulated. Vehicle locking and diagnostic scanning are unavailable. Diagnostics shows unknown fault status rather than implying a successful clean scan; shadow-code support remains unverified.

The original procedural model follows the owner's My BMW screenshot as a visual reference: glossy black bodywork, a four-door fastback silhouette, chrome window trim, twin kidney grilles, LED lamp details, split-spoke wheels and brake discs. A local reflection studio lights the paint and glass. Selecting the powertrain reveals a translucent inspection view; the hatch and lamp previews remain interactive.

This is an F36-inspired approximation, not BMW's production mesh or an exact equipment/configuration match. The screenshot and BMW app assets are not bundled. A properly licensed, production-quality F36 mesh remains a future replacement.

Preview preferences are saved in browser storage for the current local origin. This includes the selected page, units, data presentation, and illustration states. Browser storage is optional. Previously saved Drive views open Monitor, and removed Listen views open Vehicle.

## Source layout

- `index.html` contains the page structure.
- `dashboard.css` contains product styles and responsive layouts.
- `dashboard.js` owns the local demo state, camera, and subsystem interactions.
- `vehicle.js` builds the original Three.js model, materials, and reflection studio.
- `vendor/` contains pinned dependencies, local fonts, and their licenses.

The dashboard is a static design preview. Verified vehicle integration, diagnostic data, and a production F36 asset are follow-up work.

The visual direction comes from the owner's supplied Roadster UI research brief, with vehicle controls and diagnostics as the product scope. The procedural vehicle geometry is original to this draft. See [third-party notices](THIRD_PARTY.md) for bundled libraries and fonts.
