import * as electron from "electron";

interface IRecipe {
  ingredients: Array<string|number>;
  time: string;
  source: string;
  flags?: string[];
  sidedishes?: string[];
}

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
let recipesByCategory: { [category: string]: { [recipe: string]: IRecipe } };

electron.ipcRenderer.on("data", (event, recipes) => {
  recipesByCategory = recipes;

  const savedMenu = localStorage.getItem("menu");
  if (savedMenu != null) setupMenu(JSON.parse(savedMenu));
  else createNewMenu();

  const newMenuButton = document.querySelector("button.new-menu") as HTMLButtonElement;
  newMenuButton.addEventListener("click", createNewMenu);
  newMenuButton.disabled = false;
});

function createNewMenu() {
  const newMenu: string[] = [];

  const categories = Object.keys(recipesByCategory);
  for (let i = 0; i < days.length; i++) {
    // Lunch
    const categoryLunch = random(categories);
    const recipeNameLunch = random(Object.keys(recipesByCategory[categoryLunch]));
    newMenu.push(`${categoryLunch}_${recipeNameLunch}`);

    // Dinner
    const categoryDinner = random(categories);
    const recipeNameDinner = random(Object.keys(recipesByCategory[categoryDinner]));
    newMenu.push(`${categoryDinner}_${recipeNameDinner}`);
  }
  setupMenu(newMenu);
  localStorage.setItem("menu", JSON.stringify(newMenu));
}

function setupMenu(menu: string[]) {
  let index = 0;
  for (const day of days) {
    for (const meal of ["lunch", "dinner"]) {
      const [category, recipeName] = menu[index].split("_");
      if (recipesByCategory[category] == null || recipesByCategory[category][recipeName] == null) continue;

      const recipe = recipesByCategory[category][recipeName];
      (document.querySelector(`td[data-day=${day}][data-meal=${meal}] p.title`) as HTMLParagraphElement).textContent = recipeName;
      (document.querySelector(`td[data-day=${day}][data-meal=${meal}] p.source`) as HTMLParagraphElement).textContent = recipe.source;
      (document.querySelector(`td[data-day=${day}][data-meal=${meal}] p.time`) as HTMLParagraphElement).textContent = `${recipe.time}m`;

      index++;
    }
  }
}

function random(list: string[]) {
  const index = Math.min(list.length - 1, Math.floor(Math.random() * list.length));
  return list[index];
}
