export const MAX_BOX_NAME_LENGTH = 80;
export const MAX_BOX_NOTES_LENGTH = 1000;

function getLocationMode(value) {
  return String(value ?? '').trim() === 'structured' ? 'structured' : 'simple';
}

function getFormText(form, name) {
  return String(form.get(name) ?? '').trim();
}

export function getBoxDetailsValues(form) {
  return {
    name: getFormText(form, 'name'),
    location: getFormText(form, 'location'),
    notes: getFormText(form, 'notes'),
    locationMode: getLocationMode(form.get('locationMode')),
    locationSite: getFormText(form, 'locationSite'),
    locationRoom: getFormText(form, 'locationRoom'),
    locationArea: getFormText(form, 'locationArea'),
    locationShelf: getFormText(form, 'locationShelf'),
  };
}

export function getOriginalBoxDetailsValues(form) {
  return {
    name: getFormText(form, 'originalBoxName'),
    location: getFormText(form, 'originalBoxLocation'),
    notes: getFormText(form, 'originalBoxNotes'),
    locationMode: getLocationMode(form.get('originalBoxLocationMode')),
    locationSite: getFormText(form, 'originalBoxLocationSite'),
    locationRoom: getFormText(form, 'originalBoxLocationRoom'),
    locationArea: getFormText(form, 'originalBoxLocationArea'),
    locationShelf: getFormText(form, 'originalBoxLocationShelf'),
  };
}

export function normalizeBoxNameForComparison(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function hasSimilarBoxName(boxes, boxId, name) {
  const normalizedName = normalizeBoxNameForComparison(name);

  if (!normalizedName) {
    return false;
  }

  return boxes.some((box) => box.id !== boxId && normalizeBoxNameForComparison(box.name) === normalizedName);
}

export function buildLocationSummary(values) {
  if (values.locationMode === 'structured') {
    return [values.locationSite, values.locationRoom, values.locationArea, values.locationShelf].filter(Boolean).join(' · ');
  }

  return values.location;
}

export function getStoredBoxDetails(values) {
  if (values.locationMode === 'structured') {
    return {
      name: values.name,
      notes: values.notes,
      locationMode: 'structured',
      simpleLocation: '',
      structuredLocation: {
        site: values.locationSite,
        room: values.locationRoom,
        area: values.locationArea,
        shelf: values.locationShelf,
      },
      locationSummary: buildLocationSummary(values),
    };
  }

  return {
    name: values.name,
    notes: values.notes,
    locationMode: 'simple',
    simpleLocation: values.location,
    structuredLocation: null,
    locationSummary: values.location,
  };
}

export function getStoredBoxDetailsFromBox(box) {
  return getStoredBoxDetails(getBoxEditValues(box));
}

export function getBoxEditValues(box, overrides = {}) {
  const locationMode = overrides.locationMode ?? box.locationMode ?? 'simple';
  const structuredLocation = overrides.structuredLocation ?? box.structuredLocation ?? {};

  return {
    name: overrides.name ?? box.name ?? '',
    location: overrides.location ?? box.simpleLocation ?? box.locationSummary ?? '',
    notes: overrides.notes ?? box.notes ?? '',
    locationMode,
    locationSite: overrides.locationSite ?? structuredLocation.site ?? '',
    locationRoom: overrides.locationRoom ?? structuredLocation.room ?? '',
    locationArea: overrides.locationArea ?? structuredLocation.area ?? '',
    locationShelf: overrides.locationShelf ?? structuredLocation.shelf ?? '',
  };
}
