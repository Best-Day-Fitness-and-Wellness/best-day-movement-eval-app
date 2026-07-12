const DRAFT_KEY = 'best-day-assessment-draft'

function getStorage(storage) {
  return storage || (typeof localStorage !== 'undefined' ? localStorage : null)
}

export function saveDraft(draft, storage) {
  const target = getStorage(storage)
  if (!target) return
  try {
    target.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // Drafts are a convenience; a full IndexedDB save remains authoritative.
  }
}

export function loadDraft(storage) {
  const target = getStorage(storage)
  if (!target) return null
  try {
    const value = target.getItem(DRAFT_KEY)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

export function clearDraft(storage) {
  const target = getStorage(storage)
  if (!target) return
  try {
    target.removeItem(DRAFT_KEY)
  } catch {
    // Ignore unavailable browser storage.
  }
}
