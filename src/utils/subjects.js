import useSettingsStore from '../store/useSettingsStore';

// Default categories for new users
export const DEFAULT_CATEGORIES = [
  { key: 'work', name: 'Work', color: '#E8A838', icon: 'briefcase' },
  { key: 'study', name: 'Study', color: '#5B8DB8', icon: 'book-open' },
  { key: 'personal', name: 'Personal', color: '#6B8F71', icon: 'user' },
  { key: 'health', name: 'Health', color: '#C4622D', icon: 'heart' },
  { key: 'creative', name: 'Creative', color: '#9B8BB4', icon: 'palette' },
];

// Color palette for users to pick from when creating categories
export const CATEGORY_COLORS = [
  '#E8A838', '#C4622D', '#6B8F71', '#9B8BB4', '#5B8DB8',
  '#D4645C', '#E0956B', '#7DAFCB', '#B8A9C9', '#8DB580',
  '#D4A76A', '#6C9BA0', '#C97B7B', '#A0B876', '#7B8FC9',
];

// Get the current categories from the store
export function getCategories() {
  const state = useSettingsStore.getState();
  return state.categories || DEFAULT_CATEGORIES;
}

// For backward compat - same as getCategories
export function getCategoryList() {
  return getCategories();
}

export function getCategoryColor(key) {
  if (!key) return '#B5AFA8';
  const categories = getCategories();
  const cat = categories.find(c => c.key === key);
  return cat ? cat.color : '#B5AFA8';
}

export function getCategoryName(key) {
  if (!key) return 'Uncategorized';
  const categories = getCategories();
  const cat = categories.find(c => c.key === key);
  return cat ? cat.name : 'Uncategorized';
}

// Legacy aliases for backward compatibility during migration
export const getSubjectColor = getCategoryColor;
export const getSubjectName = getCategoryName;
export const SUBJECT_LIST = null; // Will error if used — force migration
