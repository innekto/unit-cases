enum CasePriority {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}
enum CaseCategories {
  Creative = 'creative',
  Learning = 'learning',
  Life = 'life',
  Rest = 'rest',
  Social = 'social',
  Work = 'work',
}

enum CaseDateFilter {
  CREATED = 'created',
  COMPLETED = 'completed',
}

export { CaseCategories, CaseDateFilter, CasePriority };
