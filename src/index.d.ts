interface IRecipe {
  ingredients: Array<string|number>;
  time: string;
  source?: string;
  flags?: string[];
  sidedishes?: string[];
}

type MealType = "Midi"|"Soir";

interface IMeal {
  category: string;
  recipe: string;
  notes: string;
}
