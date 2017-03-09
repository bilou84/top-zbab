import * as electron from "electron";
import * as fs from "fs";
import * as path from "path";

let menusByDay: Menu;

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

export function getCurrent() { return menusByDay; };

let scheduledMenuSave: NodeJS.Timer;
electron.ipcMain.on("saveMenu", (sender: Electron.IpcMainEvent, theMenusByDay: Menu) => {
  menusByDay = theMenusByDay;
  if (scheduledMenuSave == null) scheduledMenuSave = setTimeout(save, 10 * 1000);
});

export function save() {
  if (scheduledMenuSave != null) {
    clearTimeout(scheduledMenuSave);
    scheduledMenuSave = null;
  }

  if (menusByDay != null) {
    fs.writeFileSync(path.join(__dirname, "data", "menu.json"), JSON.stringify(menusByDay, null, 2), { encoding: "utf8" });
  }
}
