const { app, BrowserWindow } = require('electron');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile('src/templates/index.html');
  mainWindow.maximize();
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function() {
  // MacOS excplicit quit
  // eslint-disable-next-line no-undef
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function() {
  // MacOS when app is open and no widnows open, create one
  if (mainWindow === null) createWindow();
});
