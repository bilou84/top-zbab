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
  let menusByDay: Menu;

  const recipesPath = path.join(__dirname, "data", "recipes");
  for (const category of fs.readdirSync(recipesPath)) {
    recipesByCategory[category] = {};

    for (const recipeFileName of fs.readdirSync(path.join(recipesPath, category))) {
      const recipeFile = fs.readFileSync(path.join(recipesPath, category, recipeFileName), { encoding: "utf8" });
      let recipe: IRecipe;
      try {
        recipe = JSON.parse(recipeFile);
      }
      catch (e) {
        console.log(`Failed to parse recipe ${recipeFileName}`);
        console.log(e.message);
        continue;
      }

      recipesByCategory[category][recipeFileName.replace(".json", "")] = recipe;
    }
  }

  try {
    const menuFile = fs.readFileSync(path.join(__dirname, "data", "menu.json"), { encoding: "utf8" });
    menusByDay = JSON.parse(menuFile);
  }
  catch (e) {
    if (e.code !== "ENOENT") {
      console.log(`Failed to parse saved menu`);
      console.log(e.message);
    }

    menusByDay = null;
  }

  mainWindow.webContents.send("data", recipesByCategory, menusByDay);
}

let scheduledMenuSave: NodeJS.Timer;
let menuToSave: Menu;

function saveMenu() {
  fs.writeFileSync(path.join(__dirname, "data", "menu.json"), JSON.stringify(menuToSave, null, 2), { encoding: "utf8" });

  scheduledMenuSave = null;
  menuToSave = null;
}

electron.ipcMain.on("saveMenu", (sender, menu) => {
  menuToSave = menu;
  if (scheduledMenuSave == null) scheduledMenuSave = setTimeout(saveMenu, 10 * 1000);
});

function OnWindowClosed() {
  if (scheduledMenuSave != null) {
    clearTimeout(scheduledMenuSave);
    saveMenu();
  }

  mainWindow = null;
}
