// Preload script — runs in the renderer context with access to Node APIs
// Used for any secure bridge between main process and the game page
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('wmgDesktop', {
  version: '1.0.0',
  platform: process.platform,
});
