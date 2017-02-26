interface IRecipe {
  ingredients: Array<string|number>;
  time: string;
  source: string;
  flags?: string[];
  sidedishes?: string[];
}
