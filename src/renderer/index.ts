import * as electron from "electron";

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
  // TODO: Ensure better distribution of categories
  const recipeQuantityByCategory: { [category: string]: number } = {};
  for (const category of Object.keys(recipesByCategory)) {
    recipeQuantityByCategory[category] = category === "poisson" || category === "végétariens" ? 3 : 2;
  }

  const newMenu: string[] = [];

  for (let i = 0; i < days.length; i++) {
    // Lunch
    const categoryLunch = random(Object.keys(recipeQuantityByCategory));
    recipeQuantityByCategory[categoryLunch]--;
    if (recipeQuantityByCategory[categoryLunch] === 0) delete recipeQuantityByCategory[categoryLunch];

    const recipeNameLunch = random(Object.keys(recipesByCategory[categoryLunch]));
    newMenu.push(`${categoryLunch}_${recipeNameLunch}`);

    // Dinner
    let categoryDinner = random(Object.keys(recipeQuantityByCategory));
    while (categoryDinner === categoryLunch && Object.keys(recipeQuantityByCategory).length > 1) {
      categoryDinner = random(Object.keys(recipeQuantityByCategory));
    }

    recipeQuantityByCategory[categoryDinner]--;
    if (recipeQuantityByCategory[categoryDinner] === 0) delete recipeQuantityByCategory[categoryDinner];

    const recipeNameDinner = random(Object.keys(recipesByCategory[categoryDinner]));
    newMenu.push(`${categoryDinner}_${recipeNameDinner}`);
  }

  setupMenu(newMenu);
  localStorage.setItem("menu", JSON.stringify(newMenu));
}

function setupMenu(menu: string[]) {
  let index = 0;
  for (const day of days) {
    for (const meal of ["Midi", "Soir"]) {
      const categoryElt = document.querySelector(`tr[data-meal=${meal}].category-time td[data-day=${day}] .category`) as HTMLParagraphElement;
      const timeElt = document.querySelector(`tr[data-meal=${meal}].category-time td[data-day=${day}] .time`) as HTMLParagraphElement;
      const titleElt = document.querySelector(`tr[data-meal=${meal}].title td[data-day=${day}]`) as HTMLTableDataCellElement;
      const sidedishElt = document.querySelector(`tr[data-meal=${meal}].sidedish td[data-day=${day}]`) as HTMLTableDataCellElement;
      const sourceElt = document.querySelector(`tr[data-meal=${meal}].source td[data-day=${day}]`) as HTMLTableDataCellElement;

      const [category, recipeName] = menu[index].split("_");
      if (recipesByCategory[category] == null || recipesByCategory[category][recipeName] == null) {
        titleElt.textContent = `Unknown recipe. Category: ${category}. Name: ${recipeName}`;
        categoryElt.textContent = timeElt.textContent = sidedishElt.textContent = sourceElt.textContent = "";

      } else {
        const recipe = recipesByCategory[category][recipeName];

        categoryElt.textContent = category;
        timeElt.textContent = `${recipe.time}m`;
        titleElt.textContent = recipeName;
        sidedishElt.textContent = recipe.sidedishes != null ? random(recipe.sidedishes) : "";
        sourceElt.textContent = recipe.source;
      }

      index++;
    }
  }
}

function random(list: string[]) {
  const index = Math.min(list.length - 1, Math.floor(Math.random() * list.length));
  return list[index];
}
