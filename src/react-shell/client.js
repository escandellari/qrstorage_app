import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { INVENTORY_SHELL_MODEL_ID, INVENTORY_SHELL_ROOT_ID } from './constants.js';
import { renderInventoryHomeApp } from '../inventory-home-ui/InventoryHomeApp.js';
import { renderInventorySearchApp } from '../search-ui/InventorySearchApp.js';
import { renderBoxPageApp } from '../box-page-ui/BoxPageApp.js';

const renderers = {
  'inventory-home': renderInventoryHomeApp,
  'inventory-search': renderInventorySearchApp,
  'box-page': renderBoxPageApp,
};

function readPageModel(id) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing page model: ${id}`);
  }

  return JSON.parse(element.textContent);
}

const rootElement = document.getElementById(INVENTORY_SHELL_ROOT_ID);
const pageModel = readPageModel(INVENTORY_SHELL_MODEL_ID);
const renderApp = renderers[pageModel.screen];

if (rootElement && renderApp) {
  hydrateRoot(rootElement, renderApp(pageModel));
}
