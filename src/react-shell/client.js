import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderInventoryShellApp } from './renderInventoryShell.js';

function readPageModel(id) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing page model: ${id}`);
  }

  return JSON.parse(element.textContent);
}

const rootElement = document.getElementById('inventory-shell-root');
const pageModel = readPageModel('inventory-shell-model');

if (rootElement) {
  hydrateRoot(rootElement, renderInventoryShellApp(pageModel));
}
