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

  mainWindow.webContents.on("did-finish-load", OnWindowFinishedLoading);
  mainWindow.on("closed", OnWindowClosed);
}

function OnWindowFinishedLoading() {
  // TODO: Load recipes from json
  const recipes = {
    "Végétariens": {
      "Pâtes pesto": {
        source: "Zbab",
        time: "10m",
        ingredients: [ 200, "g", "pates" ]
      },
      "Pâtes carbo": {
        source: "Zbab",
        time: "15m",
        ingredients: [ 200, "g", "pates" ]
      }
    }
  };

  mainWindow.webContents.send("data", recipes);
}

function OnWindowClosed() {
  mainWindow = null;
}
