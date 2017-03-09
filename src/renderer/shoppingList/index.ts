import * as electron from "electron";

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const mealTypes = [ "Midi", "Soir" ];

electron.ipcRenderer.on("data", (event: Electron.IpcRendererEvent, sections: { [section: string]: string[] }, categories: { [category: string]: ICategory }, menusByDay: Menu) => {
  const quantitiesByIngredientBySection: { [section: string]: { [ingredient: string]: number } } = {};
  for (const sectionName in sections) quantitiesByIngredientBySection[sectionName] = {};
  quantitiesByIngredientBySection["Autres"] = {};

  const addIngredient = (section: { [ingredient: string]: number }, quantity: number, unit: string, ingredientName: string) => {
    const fullIngredientName = `${unit} ${ingredientName}`;
    if (section[fullIngredientName] == null) section[fullIngredientName] = quantity;
    else section[fullIngredientName] += quantity;
  };

  for (const day of days) {
    for (const mealType of mealTypes) {
      const meal = menusByDay[day][mealType];
      const recipe = categories[meal.category].recipesByName[meal.recipe];

      for (let i = 0; i < recipe.ingredients.length / 3; i++) {
        const quantity = recipe.ingredients[i * 3 + 0] as number;
        const unit = recipe.ingredients[i * 3 + 1] as string;
        const ingredientName = recipe.ingredients[i * 3 + 2] as string;

        let hasFoundSection = false;
        for (const sectionName in sections) {
          const section = sections[sectionName];
          for (const sectionIngredient of section) {
            if (ingredientName.toLocaleLowerCase().indexOf(sectionIngredient.toLocaleLowerCase()) !== -1) {
              hasFoundSection = true;
              addIngredient(quantitiesByIngredientBySection[sectionName], quantity, unit, ingredientName);
              break;
            }
          }

          if (hasFoundSection) break;
        }

        if (!hasFoundSection) addIngredient(quantitiesByIngredientBySection["Autres"], quantity, unit, ingredientName);
      }
    }
  }

  for (const sectionName in quantitiesByIngredientBySection) {
    const sectionElt = document.createElement("h2");
    sectionElt.textContent = sectionName;
    document.body.appendChild(sectionElt);

    const sectionRootElt = document.createElement("ul");
    document.body.appendChild(sectionRootElt);

    for (const ingredientName in quantitiesByIngredientBySection[sectionName]) {
      const ingredientElt = document.createElement("li");
      ingredientElt.textContent = `${quantitiesByIngredientBySection[sectionName][ingredientName]} ${ingredientName}`;
      sectionRootElt.appendChild(ingredientElt);
    }
  }
});
