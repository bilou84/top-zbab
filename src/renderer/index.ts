import * as electron from "electron";

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
let recipesByCategory: { [category: string]: { [recipe: string]: IRecipe } };
let menusByDay: { [day: string]: { Lunch: IMeal; Dinner: IMeal; } };

electron.ipcRenderer.on("data", (event, theRecipesByCategory, theMenusByDay) => {
  recipesByCategory = theRecipesByCategory;
  menusByDay = theMenusByDay;

  if (menusByDay != null) {
    for (let day in menusByDay) {
      const lunch = menusByDay[day].Lunch;
      setupMeal(lunch.category, lunch.recipe, day, "Midi");

      const dinner = menusByDay[day].Dinner;
      setupMeal(dinner.category, dinner.recipe, day, "Soir");
    }
  }

  const newMenuButton = document.querySelector("button.new-menu") as HTMLButtonElement;
  newMenuButton.addEventListener("click", createNewMenu);
  newMenuButton.disabled = false;
});

function createNewMenu() {
  const recipeQuantityByCategory: { [category: string]: number } = {};
  for (const category of Object.keys(recipesByCategory))
    recipeQuantityByCategory[category] = category === "poisson" || category === "végétariens" ? 3 : 2;

  menusByDay = {};
  const pickedCategories: string[] = [];
  const newMenu: string[] = [];

  for (let i = 0; i < days.length; i++) {
    // Lunch
    const categoryLunch = getCategory(recipeQuantityByCategory, pickedCategories);
    const recipeLunch = getRecipe(categoryLunch, newMenu);
    setupMeal(categoryLunch, recipeLunch, days[i], "Midi");
    newMenu.push(`${categoryLunch}_${recipeLunch}`);

    // Dinner
    const categoryDinner = getCategory(recipeQuantityByCategory, pickedCategories);
    const recipeDinner = getRecipe(categoryDinner, newMenu);
    setupMeal(categoryDinner, recipeDinner, days[i], "Soir");
    newMenu.push(`${categoryDinner}_${recipeDinner}`);

    menusByDay[days[i]] = {
      Lunch: {
        category: categoryLunch,
        recipe: recipeLunch,
        notes: ""
      },
      Dinner: {
        category: categoryDinner,
        recipe: recipeDinner,
        notes: ""
      }
    };
  }

  electron.ipcRenderer.send("saveMenu", menusByDay);
}

function setupMeal(category: string, recipeName: string, day: string, mealType: MealType) {
  const categoryElt = document.querySelector(`tr[data-meal=${mealType}].category-time td[data-day=${day}] .category`) as HTMLParagraphElement;
  const timeElt = document.querySelector(`tr[data-meal=${mealType}].category-time td[data-day=${day}] .time`) as HTMLParagraphElement;
  const titleElt = document.querySelector(`tr[data-meal=${mealType}].title td[data-day=${day}]`) as HTMLTableDataCellElement;
  const sidedishElt = document.querySelector(`tr[data-meal=${mealType}].sidedish td[data-day=${day}]`) as HTMLTableDataCellElement;
  const sourceElt = document.querySelector(`tr[data-meal=${mealType}].source td[data-day=${day}]`) as HTMLTableDataCellElement;

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
    let categoryAlreadyPicked = false;
    for (let i = 1; i <= Math.min(pickedCategories.length, minCategoryRepetition); i++) {
      if (pickedCategories[pickedCategories.length - i] === category) {
        categoryAlreadyPicked = true;
        break;
      }
    }

    if (!categoryAlreadyPicked) break;
  }

  recipeQuantityByCategory[category]--;
  if (recipeQuantityByCategory[category] === 0) delete recipeQuantityByCategory[category];

  pickedCategories.push(category);
  return category;
}

function getRecipe(category: string, menu: string[]) {
  let maxIterator = 100;
  let recipe: string;

  while (maxIterator > 0 && (recipe == null || menu.indexOf(`${category}_${recipe}`) !== -1)) {
    maxIterator--;

    recipe = random(Object.keys(recipesByCategory[category]));
  }

  return recipe;
}

function random(list: string[]) {
  const index = Math.min(list.length - 1, Math.floor(Math.random() * list.length));
  return list[index];
}
