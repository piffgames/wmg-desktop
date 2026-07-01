const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const https = require('https');
const fs = require('fs');

// Current app version — update this when you release a new version
const CURRENT_VERSION = '1.0.0';

// URL to check for latest version (raw GitHub file)
const VERSION_URL = 'https://raw.githubusercontent.com/piffgames/wmg-desktop/main/version.txt';

// The game URL (itch.io)
const GAME_URL = 'https://piffgames.itch.io/word-mining-gaming-wmg';

// Local backup save path
const SAVE_BACKUP_PATH = path.join(app.getPath('userData'), 'wmg_backup.json');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    minWidth: 800,
    minHeight: 550,
    title: 'Word Mining Game',
    backgroundColor: '#050505',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
  });

  // Load the game
  mainWindow.loadURL(GAME_URL);

  // Check for updates after window loads
  mainWindow.webContents.on('did-finish-load', () => {
    checkForUpdates();
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function checkForUpdates() {
  https.get(VERSION_URL, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      const latestVersion = data.trim();
      if (latestVersion && latestVersion !== CURRENT_VERSION) {
        // Show outdated banner inside the game window
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.executeJavaScript(`
            (function() {
              if (document.getElementById('wmg-update-banner')) return;
              var banner = document.createElement('div');
              banner.id = 'wmg-update-banner';
              banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#cc2222;color:#fff;text-align:center;padding:10px;font-family:sans-serif;font-size:13px;font-weight:bold;letter-spacing:0.03em';
              banner.innerHTML = '⚠️ YOUR GAME IS ON AN OUTDATED VERSION! PLEASE RESTART THE APP TO GET THE LATEST UPDATE. &nbsp;<span onclick="this.parentElement.remove()" style="cursor:pointer;opacity:0.7;font-size:11px">[dismiss]</span>';
              document.body.prepend(banner);
            })();
          `).catch(() => {});
        }
      }
    });
  }).on('error', () => {
    // Silently fail if no internet — don't nag the player
  });
}

// Check for updates every 5 minutes while app is running
setInterval(() => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    checkForUpdates();
  }
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
