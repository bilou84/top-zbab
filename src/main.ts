import * as electron from "electron";

const app = electron.app;
app.on("ready", onAppReady);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: Electron.BrowserWindow;

function onAppReady() {
  mainWindow = new electron.BrowserWindow({
    width: 1000, height: 600,
    minWidth: 800, minHeight: 480,
    useContentSize: true, autoHideMenuBar: true
  });
  mainWindow.loadURL(`file://${__dirname}/renderer/index.html`);

  // Emitted when the window is closed.
  mainWindow.on("closed", OnWindowClosed);
}

function OnWindowClosed() {
  mainWindow = null;
}
