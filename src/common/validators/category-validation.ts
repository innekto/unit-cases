import { CaseCategories } from '..';

const isValidCategory = (category: string): category is CaseCategories =>
  Object.values(CaseCategories).includes(category as CaseCategories);

export { isValidCategory };
