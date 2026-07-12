import test from 'node:test'
import assert from 'node:assert/strict'
import { clearDraft, loadDraft, saveDraft } from '../src/utils/draft.js'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  }
}

test('saves, restores, and clears an assessment draft', () => {
  const storage = memoryStorage()
  const draft = { client: { name: 'Alice Test' }, results: { tug: '12.4' }, consent: true, step: 2 }

  saveDraft(draft, storage)
  assert.deepEqual(loadDraft(storage), draft)
  clearDraft(storage)
  assert.equal(loadDraft(storage), null)
})
