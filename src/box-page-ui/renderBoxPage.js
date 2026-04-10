import { getBoxEditValues } from '../box-details.js';
import { renderBoxNotesCounterScript } from '../box-edit-view.js';
import { BOX_NOT_FOUND_HEADING, BOX_NOT_FOUND_LINK_TEXT, BOX_NOT_FOUND_MESSAGE, BOX_NOT_FOUND_TITLE } from '../box-not-found.js';
import { getLabelPath } from '../box-utils.js';
import { renderReactShellPage } from '../react-shell/renderReactShellPage.js';
import { renderBoxPageApp } from './BoxPageApp.js';

const EMPTY_PROMPT = 'Add the first item to this box.';

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
    title: box.name,
    state: 'archived',
    ...getBasePageModel(box, options),
  });
}

export function renderMissingBoxPage() {
  return renderBoxScreen({
    title: BOX_NOT_FOUND_TITLE,
    state: 'missing',
    heading: BOX_NOT_FOUND_HEADING,
    message: BOX_NOT_FOUND_MESSAGE,
    linkText: BOX_NOT_FOUND_LINK_TEXT,
  });
}
