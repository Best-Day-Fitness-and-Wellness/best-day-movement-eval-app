import test from 'node:test'
import assert from 'node:assert/strict'
import { brandLogoVariant } from '../src/utils/brand.js'

test('uses the white logo in dark mode and full-color logo in light mode', () => {
  assert.equal(brandLogoVariant('dark'), 'white')
  assert.equal(brandLogoVariant('light'), 'full-color')
})
