import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '../../../app/utils/errors'

describe('getErrorMessage', () => {
  it('returns the message from a standard Error', () => {
    const err = new Error('Something broke')
    expect(getErrorMessage(err, 'fallback')).toBe('Something broke')
  })

  it('returns the message from a DOMException', () => {
    const err = new DOMException('Clipboard access denied')
    expect(getErrorMessage(err, 'fallback')).toBe('Clipboard access denied')
  })

  it('returns data.message from a fetch-like error object', () => {
    const err = { data: { message: 'Not found' }, message: 'ignored' }
    expect(getErrorMessage(err, 'fallback')).toBe('Not found')
  })

  it('returns message from a plain error object', () => {
    const err = { message: 'Validation failed' }
    expect(getErrorMessage(err, 'fallback')).toBe('Validation failed')
  })

  it('returns fallback for unknown error types', () => {
    expect(getErrorMessage(42, 'Not an error')).toBe('Not an error')
    expect(getErrorMessage(null, 'Was null')).toBe('Was null')
    expect(getErrorMessage(undefined, 'Was undefined')).toBe('Was undefined')
    expect(getErrorMessage('just a string', 'Was string')).toBe('Was string')
  })

  it('prefers data.message over top-level message', () => {
    const err = { data: { message: 'From data' }, message: 'From top level' }
    expect(getErrorMessage(err, 'fallback')).toBe('From data')
  })

  it('returns fallback when data.message is not a string', () => {
    const err = { data: { message: { nested: true } }, message: 'top' }
    expect(getErrorMessage(err, 'fallback')).toBe('top')
  })
})
