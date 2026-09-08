const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn, fork } = require('child_process');
const net = require('net');

let mainWindow = null;
let dbProcess = null;
let serverProcess = null;

const PORT = 3000;
const PGPORT = 5432;

function checkPortReady(port, retries = 30, delay = 1000) {
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

async function startBackgroundServices() {
  console.log('Starting background PostgreSQL and Server processes...');

  // 1. Start DB Server if port 5432 is not in use
  const isDbPortFree = await new Promise((resolve) => {
    const s = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => s.close(() => resolve(true)))
      .listen(PGPORT);
  });

  if (isDbPortFree) {
    console.log('Launching embedded PostgreSQL server...');
    const startDbPath = path.join(__dirname, '..', 'scripts', 'start-db.js');
    dbProcess = fork(startDbPath, [], {
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: 'inherit',
    });
  }

  // 2. Start Next.js + WebSocket Server
  const isServerPortFree = await new Promise((resolve) => {
    const s = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => s.close(() => resolve(true)))
      .listen(PORT);
  });

  if (isServerPortFree) {
    console.log('Launching Web and Real-Time WebSocket server...');
    const serverPath = path.join(__dirname, '..', 'server.js');
    serverProcess = fork(serverPath, [], {
      env: { ...process.env, PORT: PORT.toString(), NODE_ENV: 'production' },
      stdio: 'inherit',
    });
  }

  // Wait until server is reachable
  await checkPortReady(PORT, 35, 1000);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 880,
    minWidth: 900,
    minHeight: 650,
    title: 'Artisan Kitchen & Bar - Restaurant Ordering System',
    backgroundColor: '#EFE8DA',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await startBackgroundServices();
    createWindow();
  } catch (err) {
    console.error('Failed to start application:', err);
    dialog.showErrorBox(
      'Startup Error',
      'Failed to start the background services: ' + (err.message || err)
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

app.on('will-quit', () => {
  if (dbProcess) {
    dbProcess.kill();
  }
  if (serverProcess) {
    serverProcess.kill();
  }
});
