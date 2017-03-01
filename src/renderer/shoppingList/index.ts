import * as electron from "electron";

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const mealTypes = [ "Midi", "Soir" ];

electron.ipcRenderer.on("data", (event: Electron.IpcRendererEvent, dataByCategory: { [category: string]: ICategory }, menusByDay: Menu) => {
  for (const day of days) {
    for (const mealType of mealTypes) {
      const meal = menusByDay[day][mealType];
      const recipe = dataByCategory[meal.category].recipesByName[meal.recipe];

      for (let i = 0; i < recipe.ingredients.length / 3; i++) {
        const ingredientElt = document.createElement("p");
        ingredientElt.textContent = `${recipe.ingredients[i * 3 + 0]} ${recipe.ingredients[i * 3 + 1]} ${recipe.ingredients[i * 3 + 2]}`;
        document.body.appendChild(ingredientElt);
      }
    }
  }
});
