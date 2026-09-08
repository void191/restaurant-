const { contextBridge, ipcRenderer } = require('electron');

// Expose safe, protected APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,

  // Native Desktop Notifications
  showNotification: (title, body) => {
    ipcRenderer.send('show-notification', { title, body });
  },

  // Kitchen Thermal Ticket Printing
  printTicket: (ticketHtml) => {
    return ipcRenderer.invoke('print-ticket', ticketHtml);
  },

  // App version and metadata
  getAppInfo: () => {
    return ipcRenderer.invoke('get-app-info');
  },

  // Shell open external link
  openExternal: (url) => {
    ipcRenderer.send('open-external', url);
  },
});
