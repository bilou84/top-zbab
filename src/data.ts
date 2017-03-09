import * as fs from "fs";
import * as path from "path";

export const sections: { [section: string]: string[] } = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "sections.json"), { encoding: "utf8" }));
export const categories: { [category: string]: ICategory } = {};

const categoriesPath = path.join(__dirname, "data", "categories");
for (const categoryName of fs.readdirSync(categoriesPath)) {
  if (!fs.statSync(path.join(categoriesPath, categoryName)).isDirectory()) continue;

  const { color, quantity } = JSON.parse(fs.readFileSync(path.join(categoriesPath, categoryName, "category.json"), { encoding: "utf8" }));
  categories[categoryName] = { color, quantity, recipesByName: {} };

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

    if (recipeJSON.frequency == null) recipeJSON.frequency = "Normal";
    categories[categoryName].recipesByName[recipeFileName.replace(".json", "")] = recipeJSON;
  }
}
