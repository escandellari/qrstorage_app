export const MAX_ITEM_NAME_LENGTH = 80;
export const MAX_ITEM_CATEGORY_LENGTH = 80;
export const MAX_ITEM_NOTES_LENGTH = 1000;
export const MIN_ITEM_QUANTITY = 1;
export const MAX_ITEM_QUANTITY = 9999;
export const MAX_ITEMS_PER_BOX = 500;
export const ITEM_LIMIT_MESSAGE = `This box already has ${MAX_ITEMS_PER_BOX} items. Remove an item before adding another.`;

export function validateItemInput({ name, quantity, category, notes }) {
  const errors = {};

  if (!name) {
    errors.name = 'Enter an item name.';
  } else if (name.length > MAX_ITEM_NAME_LENGTH) {
    errors.name = `Item name must be ${MAX_ITEM_NAME_LENGTH} characters or fewer.`;
  }

  if (quantity) {
    const parsedQuantity = Number(quantity);
    if (!/^\d+$/.test(quantity) || !Number.isInteger(parsedQuantity) || parsedQuantity < MIN_ITEM_QUANTITY || parsedQuantity > MAX_ITEM_QUANTITY) {
      errors.quantity = 'Enter a whole number between 1 and 9,999.';
    }
  }

  if (category.length > MAX_ITEM_CATEGORY_LENGTH) {
    errors.category = `Category must be ${MAX_ITEM_CATEGORY_LENGTH} characters or fewer.`;
  }

  if (notes.length > MAX_ITEM_NOTES_LENGTH) {
    errors.notes = `Notes must be ${MAX_ITEM_NOTES_LENGTH} characters or fewer.`;
  }

  return errors;
}
