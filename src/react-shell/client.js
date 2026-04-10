import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { INVENTORY_SHELL_MODEL_ID, INVENTORY_SHELL_ROOT_ID } from './constants.js';
import { renderInventoryShellApp } from './renderInventoryShell.js';

function readPageModel(id) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing page model: ${id}`);
  }

  return JSON.parse(element.textContent);
}

const rootElement = document.getElementById(INVENTORY_SHELL_ROOT_ID);
const pageModel = readPageModel(INVENTORY_SHELL_MODEL_ID);

if (rootElement) {
  hydrateRoot(rootElement, renderInventoryShellApp(pageModel));
}
