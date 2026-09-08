const { app, BrowserWindow, ipcMain, Notification, dialog, Menu, shell } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const net = require('net');

let mainWindow = null;
let dbProcess = null;
let serverProcess = null;
let isQuitting = false;

const PORT = parseInt(process.env.PORT || '3000', 10);
const PGPORT = parseInt(process.env.PGPORT || '5432', 10);

// Helper to check if a TCP port is open and accepting connections
function checkPortReady(port, retries = 40, delay = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const client = net.createConnection({ port, host: 'localhost' }, () => {
        client.end();
        clearInterval(interval);
        resolve(true);
      });

      client.on('error', () => {
        if (attempts >= retries) {
          clearInterval(interval);
          reject(new Error(`Port ${port} not reachable after ${retries} attempts`));
        }
      });
    }, delay);
  });
}

// Helper to check if a port is currently available
function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => tester.close(() => resolve(true)))
      .listen(port);
  });
}

async function startBackgroundServices() {
  console.log('--- Initializing Electron Native Background Services ---');

  // 1. Start embedded PostgreSQL engine if port 5432 is free
  const dbFree = await isPortFree(PGPORT);
  if (dbFree) {
    console.log(`> Starting embedded PostgreSQL engine on port ${PGPORT}...`);
    const startDbScript = path.join(__dirname, '..', 'scripts', 'start-db.js');
    dbProcess = fork(startDbScript, [], {
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: 'inherit',
    });
  } else {
    console.log(`> PostgreSQL engine already active on port ${PGPORT}.`);
  }

  // 2. Start Next.js + Socket.io Server if port 3000 is free
  const serverFree = await isPortFree(PORT);
  if (serverFree) {
    console.log(`> Starting Next.js Web and Real-Time WebSocket server on port ${PORT}...`);
    const serverScript = path.join(__dirname, '..', 'server.js');
    serverProcess = fork(serverScript, [], {
      env: { ...process.env, PORT: PORT.toString(), NODE_ENV: 'production' },
      stdio: 'inherit',
    });
  } else {
    console.log(`> Server already active on port ${PORT}.`);
  }

  // Wait until server is fully ready
  await checkPortReady(PORT, 40, 1000);
  console.log('> Background services initialized and verified!');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 960,
    minHeight: 680,
    title: 'Artisan Kitchen & Bar - Restaurant System',
    backgroundColor: '#EFE8DA',
    show: false, // Show once ready-to-show to prevent visual flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  // Load the application URL
  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Setup IPC Handlers
function setupIpcHandlers() {
  // Native Notifications
  ipcMain.on('show-notification', (event, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({
        title: title || 'Artisan Restaurant System',
        body: body || 'New update received',
        silent: false,
      }).show();
    }
  });

  // Native Kitchen Ticket Printing
  ipcMain.handle('print-ticket', async (event, ticketHtml) => {
    if (!mainWindow) return { success: false, error: 'Window not available' };

    const printWin = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: false },
    });

    printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(ticketHtml)}`);

    return new Promise((resolve) => {
      printWin.webContents.on('did-finish-load', () => {
        printWin.webContents.print(
          { silent: false, printBackground: true },
          (success, failureReason) => {
            printWin.close();
            resolve({ success, error: failureReason });
          }
        );
      });
    });
  });

  // App Info
  ipcMain.handle('get-app-info', () => {
    return {
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      appName: 'Artisan Restaurant System',
    };
  });

  // External Links
  ipcMain.on('open-external', (event, url) => {
    if (url && url.startsWith('http')) {
      shell.openExternal(url);
    }
  });
}

// Application Lifecycle
app.whenReady().then(async () => {
  setupIpcHandlers();

  try {
    await startBackgroundServices();
    createWindow();
  } catch (err) {
    console.error('Failed to launch application:', err);
    dialog.showErrorBox(
      'Startup Error',
      'Failed to initialize background database and server: ' + (err.message || err)
    );
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function cleanupProcesses() {
  if (dbProcess) {
    try {
      dbProcess.kill('SIGINT');
    } catch {}
  }
  if (serverProcess) {
    try {
      serverProcess.kill('SIGINT');
    } catch {}
  }
}

app.on('before-quit', () => {
  isQuitting = true;
  cleanupProcesses();
});

app.on('will-quit', () => {
  cleanupProcesses();
});
