import { idbDel, idbGet, idbSet } from './idb'

/**
 * The File System Access API lets us remember the file a book came from, so a
 * single click on the shelf reopens it without the picker. Only Chromium
 * exposes it; everywhere else we fall back to the file dialog.
 */
export const supportsHandles = () =>
  typeof window !== 'undefined' && 'showOpenFilePicker' in window

export async function rememberFile(id: string, handle: FileSystemFileHandle) {
  try {
    await idbSet('handles', id, handle)
  } catch {
    /* quota or private mode: the picker still works */
  }
}

export async function forgetFile(id: string) {
  try {
    await idbDel('handles', id)
  } catch {
    /* nothing to forget */
  }
}

type PermissionableHandle = FileSystemFileHandle & {
  queryPermission?: (descriptor: { mode: 'read' }) => Promise<PermissionState>
  requestPermission?: (descriptor: { mode: 'read' }) => Promise<PermissionState>
}

export async function fileFromHandle(
  handle: FileSystemFileHandle,
  interactive: boolean,
): Promise<File | null> {
  const permissioned = handle as PermissionableHandle
  try {
    const options = { mode: 'read' as const }
    const state = permissioned.queryPermission
      ? await permissioned.queryPermission(options)
      : 'granted'
    if (state === 'granted') return handle.getFile()
    if (!interactive || !permissioned.requestPermission) return null
    if ((await permissioned.requestPermission(options)) === 'granted') {
      return handle.getFile()
    }
  } catch {
    /* revoked or moved */
  }
  return null
}

/** Returns the book file saved for this id, asking for permission if needed. */
export async function reopenBook(id: string): Promise<File | null> {
  const handle = await idbGet<FileSystemFileHandle>('handles', id)
  if (!handle) return null
  return fileFromHandle(handle, true)
}

interface PickerWindow extends Window {
  showOpenFilePicker?: (options?: {
    multiple?: boolean
    types?: { description: string; accept: Record<string, string[]> }[]
  }) => Promise<FileSystemFileHandle[]>
}

export async function pickBookWithHandle(): Promise<{
  file: File
  handle: FileSystemFileHandle | null
} | null> {
  const picker = (window as PickerWindow).showOpenFilePicker
  if (!picker) return null
  try {
    const [handle] = await picker({
      multiple: false,
      types: [
        {
          description: 'Libros',
          accept: {
            'application/epub+zip': ['.epub', '.kepub'],
            'application/pdf': ['.pdf'],
            'application/x-mobipocket-ebook': ['.mobi', '.azw', '.azw3', '.kf8'],
            'application/x-fictionbook+xml': ['.fb2', '.fbz'],
            'application/vnd.comicbook+zip': ['.cbz'],
          },
        },
      ],
    })
    if (!handle) return null
    return { file: await handle.getFile(), handle }
  } catch (error) {
    if ((error as DOMException)?.name === 'AbortError') return null
    return null
  }
}
