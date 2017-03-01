interface ICategory {
  color: string;
  quantity: number;
  recipesByName: { [recipeName: string]: IRecipe };
}

interface IRecipe {
  ingredients: Array<string|number>;
  time: string;
  source?: string;
  flags?: string[];
  sidedishes?: string[];
  frequency: "Frequent"|"Rare"|"Normal";
}

type Menu = { [day: string]: { [mealType: string]: IMeal } };

interface IMeal {
  category: string;
  recipe: string;
  notes: string;
  sidedish: string;
}
