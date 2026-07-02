const { app, BrowserWindow } = require('electron');
const path = require('path');
const https = require('https');
const fs = require('fs');

const CURRENT_VERSION = '1.0.4';
const VERSION_URL = 'https://raw.githubusercontent.com/piffgames/wmg-desktop/main/version.txt';
const GAME_URL = 'https://raw.githubusercontent.com/piffgames/wmg-desktop/main/WMG_v12.html';

// Local game file paths
const BUNDLED_GAME = path.join(__dirname, 'WMG_v12.html'); // shipped with the app
const CACHED_GAME = path.join(app.getPath('userData'), 'game_cache.html'); // downloaded updates

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 660,
    minWidth: 800,
    minHeight: 560,
    title: 'Word Mining Game',
    backgroundColor: '#050505',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
  });

  // Load immediately from local file — no network wait
  if (fs.existsSync(CACHED_GAME)) {
    mainWindow.loadFile(CACHED_GAME);
  } else if (fs.existsSync(BUNDLED_GAME)) {
    mainWindow.loadFile(BUNDLED_GAME);
  }

  // After load, check for updates silently in background
  mainWindow.webContents.on('did-finish-load', () => {
    setTimeout(checkAndDownloadUpdate, 5000);
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function checkAndDownloadUpdate() {
  https.get(VERSION_URL, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      const latest = data.trim();
      if (latest && latest !== CURRENT_VERSION) {
        // Show banner
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.executeJavaScript(`
            (function() {
              if (document.getElementById('wmg-update-banner')) return;
              var b = document.createElement('div');
              b.id = 'wmg-update-banner';
              b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#cc2222;color:#fff;text-align:center;padding:9px;font-family:sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.03em';
              b.innerHTML = '⚠️ A NEW VERSION IS AVAILABLE! PLEASE RESTART THE APP TO UPDATE. <span onclick="this.parentElement.remove()" style="cursor:pointer;opacity:0.6;font-size:11px;margin-left:12px">[dismiss]</span>';
              document.body.prepend(b);
            })();
          `).catch(() => {});
        }
        // Download new version in background
        downloadUpdate();
      }
    });
  }).on('error', () => {});
}

function downloadUpdate() {
  const file = fs.createWriteStream(CACHED_GAME + '.tmp');
  https.get(GAME_URL, (res) => {
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      // Replace cache with new version
      try {
        fs.renameSync(CACHED_GAME + '.tmp', CACHED_GAME);
      } catch(e) {}
    });
  }).on('error', () => {
    try { fs.unlinkSync(CACHED_GAME + '.tmp'); } catch(e) {}
  });
}

// Check every 5 min
setInterval(() => {
  if (mainWindow && !mainWindow.isDestroyed()) checkAndDownloadUpdate();
}, 5 * 60 * 1000);

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
