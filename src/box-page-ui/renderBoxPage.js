import { getBoxEditValues } from '../box-details.js';
import { renderBoxNotesCounterScript } from '../box-edit-view.js';
import { getLabelPath } from '../box-utils.js';
import { renderReactShellPage } from '../react-shell/renderReactShellPage.js';
import { renderBoxPageApp } from './BoxPageApp.js';

const EMPTY_PROMPT = 'Add the first item to this box.';
const MISSING_TITLE = 'Box not found';
const MISSING_COPY = "We couldn't find that box";

function renderBoxScreen(pageModel, options = {}) {
  return renderReactShellPage({
    title: pageModel.title,
    pageModel: {
      screen: 'box-page',
      ...pageModel,
    },
    app: renderBoxPageApp,
    additionalHead: options.additionalHead ?? '',
  });
}

function getBasePageModel(box, options = {}) {
  return {
    name: box.name,
    boxCode: box.boxCode,
    locationSummary: box.locationSummary ?? '',
    notes: box.notes ?? '',
    labelPath: options.labelPath ?? getLabelPath(box.boxCode),
    items: options.items ?? [],
    emptyPrompt: EMPTY_PROMPT,
    itemLimitMessage: options.itemLimitMessage ?? '',
    boxValues: options.boxValues ?? getBoxEditValues(box),
  };
}

export function renderActiveBoxPage(box, options = {}) {
  return renderBoxScreen(
    {
      title: box.name,
      state: 'active',
      ...getBasePageModel(box, options),
    },
    {
      additionalHead: renderBoxNotesCounterScript(),
    },
  );
}

export function renderArchivedBoxPage(box, options = {}) {
  return renderBoxScreen({
    title: `${box.name}`,
    state: 'archived',
    ...getBasePageModel(box, options),
  });
}

export function renderMissingBoxPage() {
  return renderBoxScreen({
    title: MISSING_TITLE,
    state: 'missing',
    heading: MISSING_COPY,
  });
}
