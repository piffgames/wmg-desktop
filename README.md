# Word Mining Game — Desktop App

Electron wrapper for Word Mining Game.

## How updates work
1. Upload new `WMG_v12.html` to itch.io as usual
2. Update `version.txt` in this repo (e.g. `1.0.1`)
3. Update the `CURRENT_VERSION` in `main.js` to match
4. Commit and push — GitHub Actions will build and release the new `.exe` automatically
5. Players already running the app will see the update banner within 5 minutes

## Building manually
```
npm install
npm run dist
```
The installer will be in `dist/`.

## Releasing
Create a GitHub Release tagged `v1.0.0` (matching version.txt) and attach the `.exe` from `dist/`.
