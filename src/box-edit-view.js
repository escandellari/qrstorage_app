import { MAX_BOX_NOTES_LENGTH, getBoxEditValues } from './box-details.js';

export function renderBoxEditSection({ box, boxValues = {}, boxErrors = {}, boxOriginalValues = {}, escapeHtml }) {
  const values = getBoxEditValues(box, boxValues);
  const originalValues = getBoxEditValues(box, boxOriginalValues);
  const structuredLocationAttributes = values.locationMode === 'structured' ? 'data-structured-location-fields' : 'data-structured-location-fields hidden';

  return `<section>
          <h2>Edit box details</h2>
          <form method="post" action="/boxes/${encodeURIComponent(box.boxCode)}">
            <label>
              Box name
              <input type="text" name="name" maxlength="80" value="${escapeHtml(values.name)}" required />
            </label>
            ${boxErrors.name ? `<p>${escapeHtml(boxErrors.name)}</p>` : ''}
            <label>
              Location
              <input type="text" name="location" value="${escapeHtml(values.location)}" />
            </label>
            <button type="button" data-expand-structured-location>Use structured location</button>
            <div ${structuredLocationAttributes}>
              <label>
                Site or building
                <input type="text" name="locationSite" value="${escapeHtml(values.locationSite)}" />
              </label>
              <label>
                Room
                <input type="text" name="locationRoom" value="${escapeHtml(values.locationRoom)}" />
              </label>
              <label>
                Storage area
                <input type="text" name="locationArea" value="${escapeHtml(values.locationArea)}" />
              </label>
              <label>
                Shelf or position
                <input type="text" name="locationShelf" value="${escapeHtml(values.locationShelf)}" />
              </label>
            </div>
            <label>
              Notes
              <textarea name="notes" maxlength="${MAX_BOX_NOTES_LENGTH}">${escapeHtml(values.notes)}</textarea>
            </label>
            ${boxErrors.notes ? `<p>${escapeHtml(boxErrors.notes)}</p>` : ''}
            <p data-notes-remaining>${MAX_BOX_NOTES_LENGTH - values.notes.length} characters remaining</p>
            <input type="hidden" name="locationMode" value="${escapeHtml(values.locationMode)}" />
            <input type="hidden" name="originalBoxName" value="${escapeHtml(originalValues.name)}" />
            <input type="hidden" name="originalBoxLocation" value="${escapeHtml(originalValues.location)}" />
            <input type="hidden" name="originalBoxNotes" value="${escapeHtml(originalValues.notes)}" />
            <input type="hidden" name="originalBoxLocationMode" value="${escapeHtml(originalValues.locationMode)}" />
            <input type="hidden" name="originalBoxLocationSite" value="${escapeHtml(originalValues.locationSite)}" />
            <input type="hidden" name="originalBoxLocationRoom" value="${escapeHtml(originalValues.locationRoom)}" />
            <input type="hidden" name="originalBoxLocationArea" value="${escapeHtml(originalValues.locationArea)}" />
            <input type="hidden" name="originalBoxLocationShelf" value="${escapeHtml(originalValues.locationShelf)}" />
            <input type="hidden" name="_method" value="PATCH" />
            <button type="submit">Save box details</button>
          </form>
        </section>`;
}

export function renderBoxConflictMessage(conflictBox, escapeHtml) {
  if (!conflictBox) {
    return '';
  }

  return `<div><p>This box was updated by someone else.</p><p>Latest saved box: ${escapeHtml(conflictBox.name)}${conflictBox.locationSummary ? ` · Location: ${escapeHtml(conflictBox.locationSummary)}` : ''}${conflictBox.notes ? ` · Notes: ${escapeHtml(conflictBox.notes)}` : ''}</p></div>`;
}

export function renderBoxNotesCounterScript() {
  return `<script>
        document.addEventListener('input', (event) => {
          const notesField = event.target.closest('textarea[name="notes"]');
          const counter = notesField?.form?.querySelector('[data-notes-remaining]');

          if (!notesField || !counter) {
            return;
          }

          counter.textContent = String(${MAX_BOX_NOTES_LENGTH} - notesField.value.length) + ' characters remaining';
        });
      </script>`;
}
