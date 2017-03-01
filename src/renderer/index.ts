import * as electron from "electron";

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
let dataByCategory: { [category: string]: ICategory };
let menusByDay: Menu;

electron.ipcRenderer.on("data", (event, theDataByCategory, theMenusByDay) => {
  dataByCategory = theDataByCategory;
  menusByDay = theMenusByDay;

  for (const day of days) {
    for (const mealType of ["Midi", "Soir"]) {
      if (menusByDay != null) {
        const meal = menusByDay[day][mealType];
        setupMeal(day, mealType, meal.category, meal.recipe, meal.sidedish, meal.notes);
      }

      const sidedishElt = document.querySelector(`tr[data-meal=${mealType}].sidedish td[data-day=${day}] select`) as HTMLSelectElement;
      sidedishElt.addEventListener("change", () => {
        menusByDay[day][mealType].sidedish = sidedishElt.value;
        electron.ipcRenderer.send("saveMenu", menusByDay);
      });

      const notesElt = document.querySelector(`tr[data-meal=${mealType}].notes td[data-day=${day}] textarea`) as HTMLTextAreaElement;
      notesElt.addEventListener("input", () => {
        menusByDay[day][mealType].notes = notesElt.value;
        electron.ipcRenderer.send("saveMenu", menusByDay);
      });
    }
  }

  const newMenuButton = document.querySelector("button.new-menu") as HTMLButtonElement;
  newMenuButton.addEventListener("click", createNewMenu);
  newMenuButton.disabled = false;
});

function createNewMenu() {
  const recipeQuantityByCategory: { [category: string]: number } = {};
  for (const category of Object.keys(dataByCategory))
    recipeQuantityByCategory[category] = dataByCategory[category].quantity;

  menusByDay = {};
  const pickedCategories: string[] = [];
  const pickedRecipes: string[] = [];
  const pickedFlags: string[] = [];

  for (let i = 0; i < days.length; i++) {
    menusByDay[days[i]] = {};

    for (const mealType of ["Midi", "Soir"]) {
      const category = getCategory(recipeQuantityByCategory, pickedCategories);
      const recipeName = getRecipe(category, pickedRecipes, pickedFlags);
      const sidedish = random(dataByCategory[category].recipesByName[recipeName].sidedishes);
      setupMeal(days[i], mealType, category, recipeName, sidedish, "");
    }
  }

  electron.ipcRenderer.send("saveMenu", menusByDay);
}

function setupMeal(day: string, mealType: string, category: string, recipeName: string, sidedish: string, notes: string) {
  const categoryElt = document.querySelector(`tr[data-meal=${mealType}].category-time td[data-day=${day}] .category`) as HTMLParagraphElement;
  const timeElt = document.querySelector(`tr[data-meal=${mealType}].category-time td[data-day=${day}] .time`) as HTMLParagraphElement;
  const titleElt = document.querySelector(`tr[data-meal=${mealType}].title td[data-day=${day}]`) as HTMLTableDataCellElement;
  const sidedishElt = document.querySelector(`tr[data-meal=${mealType}].sidedish td[data-day=${day}] select`) as HTMLSelectElement;
  const notesElt = document.querySelector(`tr[data-meal=${mealType}].notes td[data-day=${day}] textarea`) as HTMLTextAreaElement;
  const sourceElt = document.querySelector(`tr[data-meal=${mealType}].source td[data-day=${day}]`) as HTMLTableDataCellElement;

  for (let i = 0; i < sidedishElt.children.length; i++) sidedishElt.removeChild(sidedishElt.children.item(i));
  categoryElt.textContent = timeElt.textContent = sidedishElt.value = notesElt.value = sourceElt.textContent = "";
  titleElt.style.color = "#000000";
  sidedishElt.disabled = true;
  notesElt.disabled = true;

  if (dataByCategory[category] == null || dataByCategory[category].recipesByName[recipeName] == null) {
    titleElt.textContent = `Unknown recipe. Category: ${category}. Name: ${recipeName}`;

  } else {
    const recipe = dataByCategory[category].recipesByName[recipeName];

    categoryElt.textContent = category;
    titleElt.style.color = dataByCategory[category].color;

    timeElt.textContent = recipe.time;
    titleElt.textContent = recipeName;

    if (recipe.sidedishes != null) {
      sidedishElt.disabled = false;

      for (let recipeSidedish of recipe.sidedishes) {
        const sidedishOptionElt = document.createElement("option");
        sidedishOptionElt.value = sidedishOptionElt.textContent = recipeSidedish;
        sidedishElt.appendChild(sidedishOptionElt);
      }

      sidedishElt.value = sidedish;
    }

    notesElt.disabled = false;
    notesElt.value = notes;

    sourceElt.textContent = recipe.source;

    menusByDay[day][mealType] = {
      category: category,
      recipe: recipeName,
      sidedish: sidedish,
      notes: notes
    };
  }
}

function getCategory(recipeQuantityByCategory: { [category: string]: number }, pickedCategories: string[]) {
  // Sort among categories with the highest quantity left
  let highestCategoryQuantity = 0;
  let highestCategories: string[] = [];
  for (const category of Object.keys(recipeQuantityByCategory)) {
    const categoryQuantity = recipeQuantityByCategory[category];

    if (categoryQuantity === highestCategoryQuantity) {
      highestCategories.push(category);
    }
    else if (categoryQuantity > highestCategoryQuantity) {
      highestCategories = [ category ];
      highestCategoryQuantity = categoryQuantity;
    }
  }

  // Ensure we don't pick the same category two days in a row (so among 3 previous categories)
  let minCategoryRepetition = 3;
  let maxIterator = 100;
  let category: string;

  while (maxIterator > 0) {
    maxIterator--;

    category = random(highestCategories);
    let isCategoryAlreadyPicked = false;
    for (let i = 1; i <= Math.min(pickedCategories.length, minCategoryRepetition); i++) {
      if (pickedCategories[pickedCategories.length - i] === category) {
        isCategoryAlreadyPicked = true;
        break;
      }
    }

    if (!isCategoryAlreadyPicked) break;
  }

  recipeQuantityByCategory[category]--;
  if (recipeQuantityByCategory[category] === 0) delete recipeQuantityByCategory[category];

  pickedCategories.push(category);
  return category;
}

function getRecipe(category: string, pickedRecipes: string[], pickedFlags: string[]) {
  let maxIterator = 100;
  let recipeName: string;

  while (maxIterator > 0) {
    maxIterator--;

    recipeName = random(Object.keys(dataByCategory[category].recipesByName));
    if (pickedRecipes.indexOf(`${category}_${recipeName}`) !== -1) continue;

    const recipe = dataByCategory[category].recipesByName[recipeName];
    if (recipe.flags != null) {
      let isFlagAlreadyPicked = false;
      for (const flag of recipe.flags) {
        if (pickedFlags.indexOf(flag) !== -1) {
          isFlagAlreadyPicked = true;
          break;
        }
      }

      if (isFlagAlreadyPicked) continue;
    }

    break;
  }

  const recipe = dataByCategory[category].recipesByName[recipeName];
  if (recipe.flags != null) {
    for (const flag of recipe.flags) pickedFlags.push(flag);
  }

  pickedRecipes.push(`${category}_${recipeName}`);
  return recipeName;
}

function random(list: string[]) {
  if (list == null) return null;

  const index = Math.min(list.length - 1, Math.floor(Math.random() * list.length));
  return list[index];
}
