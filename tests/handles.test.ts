import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { fileFromHandle, forgetFile, rememberFile } from '../src/core/handles'
import { resetIdb } from '../src/core/idb'

// IndexedDB clones values structurally, so a real handle cannot be faked with
// functions. These tests cover the permission dance, which is the part that
// decides whether the one-click reopen works.
const fakeHandle = (permission: PermissionState, request = permission) =>
  ({
    name: 'libro.epub',
    kind: 'file',
    queryPermission: async () => permission,
    requestPermission: async () => request,
    getFile: async () => new File(['hola'], 'libro.epub', { type: 'application/epub+zip' }),
  }) as unknown as FileSystemFileHandle

describe('file handles', () => {
  beforeEach(async () => {
    await resetIdb()
  })

  it('opens the file when permission is already granted', async () => {
    const file = await fileFromHandle(fakeHandle('granted'), false)
    expect(file?.name).toBe('libro.epub')
  })

  it('asks for permission on a user gesture', async () => {
    const file = await fileFromHandle(fakeHandle('prompt', 'granted'), true)
    expect(file?.name).toBe('libro.epub')
  })

  it('gives up silently when the user denies', async () => {
    expect(await fileFromHandle(fakeHandle('denied'), true)).toBeNull()
  })

  it('does not ask without a gesture', async () => {
    expect(await fileFromHandle(fakeHandle('prompt', 'granted'), false)).toBeNull()
  })

  it('forgetting a handle never throws', async () => {
    await rememberFile('x', fakeHandle('granted'))
    await expect(forgetFile('x')).resolves.toBeUndefined()
  })
})
