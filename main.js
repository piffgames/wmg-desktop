const { app, BrowserWindow } = require('electron');
const path = require('path');
const https = require('https');
const fs = require('fs');

const CURRENT_VERSION = '1.0.1';
const VERSION_URL = 'https://raw.githubusercontent.com/piffgames/wmg-desktop/main/version.txt';
const GAME_URL = 'https://raw.githubusercontent.com/piffgames/wmg-desktop/main/WMG_v12.html';
const LOCAL_GAME_PATH = path.join(app.getPath('userData'), 'game.html');

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

  // Load the game
  loadGame();
}

function loadGame() {
  // Try to download latest game from GitHub
  https.get(GAME_URL, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (data && data.includes('<!DOCTYPE html>')) {
        // Save locally for offline use
        fs.writeFileSync(LOCAL_GAME_PATH, data, 'utf-8');
        mainWindow.loadFile(LOCAL_GAME_PATH);
      } else {
        loadLocalFallback();
      }
      // Check version after loading
      setTimeout(checkForUpdates, 3000);
    });
  }).on('error', () => {
    // No internet — load cached version
    loadLocalFallback();
  });
}

function loadLocalFallback() {
  if (fs.existsSync(LOCAL_GAME_PATH)) {
    mainWindow.loadFile(LOCAL_GAME_PATH);
  } else {
    // No cached version — show error
    mainWindow.loadURL('data:text/html,<h2 style="color:white;background:#050505;padding:40px;font-family:sans-serif">No internet connection and no cached game found. Please connect to the internet and restart.</h2>');
  }
}

function checkForUpdates() {
  https.get(VERSION_URL, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      const latest = data.trim();
      if (latest && latest !== CURRENT_VERSION) {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.executeJavaScript(`
            (function() {
              if (document.getElementById('wmg-update-banner')) return;
              var b = document.createElement('div');
              b.id = 'wmg-update-banner';
              b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#cc2222;color:#fff;text-align:center;padding:9px;font-family:sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.03em';
              b.innerHTML = '⚠️ YOUR GAME IS ON AN OUTDATED VERSION! PLEASE RESTART THE APP TO UPDATE. <span onclick="this.parentElement.remove()" style="cursor:pointer;opacity:0.6;font-size:11px;margin-left:12px">[dismiss]</span>';
              document.body.prepend(b);
            })();
          `).catch(() => {});
        }
      }
    });
  }).on('error', () => {});
}

// Check for updates every 5 min
setInterval(() => {
  if (mainWindow && !mainWindow.isDestroyed()) checkForUpdates();
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
