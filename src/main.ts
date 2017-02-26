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
    width: 1200, height: 800,
    minWidth: 1200, minHeight: 800,
    useContentSize: true, autoHideMenuBar: true
  });
  mainWindow.loadURL(`file://${__dirname}/renderer/index.html`);

  mainWindow.webContents.on("did-finish-load", OnWindowFinishedLoading);
  mainWindow.on("closed", OnWindowClosed);
}

function OnWindowFinishedLoading() {
  const dataByCategory: { [category: string]: ICategory } = {};
  let menusByDay: Menu;

  const categoriesPath = path.join(__dirname, "data", "categories");
  for (const categoryName of fs.readdirSync(categoriesPath)) {
    const { color, quantity } = JSON.parse(fs.readFileSync(path.join(categoriesPath, categoryName, "category.json"), { encoding: "utf8" }));
    dataByCategory[categoryName] = { color, quantity, recipesByName: {} };

    const recipesPath = path.join(categoriesPath, categoryName, "recipes");
    for (const recipeFileName of fs.readdirSync(recipesPath)) {
      const recipeFile = fs.readFileSync(path.join(recipesPath, recipeFileName), { encoding: "utf8" });
      let recipeJSON: IRecipe;
      try {
        recipeJSON = JSON.parse(recipeFile);
      }
      catch (e) {
        console.log(`Failed to parse recipe ${recipeFileName}`);
        console.log(e.message);
        continue;
      }

      dataByCategory[categoryName].recipesByName[recipeFileName.replace(".json", "")] = recipeJSON;
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

  mainWindow.webContents.send("data", dataByCategory, menusByDay);
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
