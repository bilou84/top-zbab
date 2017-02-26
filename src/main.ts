import * as electron from "electron";
import * as fs from "fs";
import * as path from "path";

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
  const recipesByCategory: { [category: string]: { [recipe: string]: IRecipe } } = {};

  const recipesPath = path.join(__dirname, "data", "recipes");
  for (const category of fs.readdirSync(recipesPath)) {
    recipesByCategory[category] = {};

    for (const recipeFileName of fs.readdirSync(path.join(recipesPath, category))) {
      const recipeFile = fs.readFileSync(path.join(recipesPath, category, recipeFileName), { encoding: "utf8" });
      recipesByCategory[category][recipeFileName.replace(".json", "")] = JSON.parse(recipeFile);
    }
  }

  mainWindow.webContents.send("data", recipesByCategory);
}

function OnWindowClosed() {
  mainWindow = null;
}
