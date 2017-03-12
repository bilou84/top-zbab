import * as electron from "electron";
import * as data from "./data";
import * as menu from "./menu";

const app = electron.app;
app.on("ready", onAppReady);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: Electron.BrowserWindow;

function onAppReady() {
  mainWindow = new electron.BrowserWindow({
    width: 1200, height: 800,
    minWidth: 1200, minHeight: 800,
    useContentSize: true, autoHideMenuBar: true,
    icon: `${__dirname}/logo.ico`
  });
  mainWindow.loadURL(`file://${__dirname}/renderer/index.html`);

  mainWindow.webContents.on("did-finish-load", () => { mainWindow.webContents.send("data", data.categories, menu.getCurrent()); });
  mainWindow.on("closed", OnMainWindowClosed);
}

let shoppingListWindow: Electron.BrowserWindow;
electron.ipcMain.on("shoppingList", (sender: Electron.IpcMainEvent) => {
  shoppingListWindow = new electron.BrowserWindow({
    width: 800, height: 600,
    minWidth: 800, minHeight: 600,
    useContentSize: true, autoHideMenuBar: true,
    icon: `${__dirname}/logo.ico`
  });
  shoppingListWindow.loadURL(`file://${__dirname}/renderer/shoppingList/index.html`);

  shoppingListWindow.webContents.on("did-finish-load", () => { shoppingListWindow.webContents.send("data", data.sections, data.categories, menu.getCurrent()); });
  shoppingListWindow.on("closed", () => { shoppingListWindow = null; });
});

function OnMainWindowClosed() {
  menu.save();

  if (shoppingListWindow != null) {
    shoppingListWindow.close();
    shoppingListWindow = null;
  }

  mainWindow = null;
}
