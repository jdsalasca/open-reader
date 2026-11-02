import type { ComponentType } from 'react'
import type { ReaderStore } from '../ReaderContext'
import type { PanelTab, ViewerPlugin } from './types'

export interface PluginRegistry {
  tabs: PanelTab[]
  actions: ComponentType[]
  asides: ComponentType[]
  pages: ComponentType[]
  overlays: ComponentType[]
  /** Runs the plugins' shortcuts in order; true when one handled the key. */
  key(store: ReaderStore, event: KeyboardEvent): boolean
}

export function createRegistry(plugins: ViewerPlugin[]): PluginRegistry {
  const pick = <K extends 'Action' | 'Aside' | 'Page' | 'Overlay'>(slot: K): ComponentType[] =>
    plugins.flatMap((plugin) => (plugin[slot] ? [plugin[slot]] : []))

  return {
    tabs: plugins.flatMap((plugin) => (plugin.tab ? [plugin.tab] : [])),
    actions: pick('Action'),
    asides: pick('Aside'),
    pages: pick('Page'),
    overlays: pick('Overlay'),
    key(store, event) {
      for (const plugin of plugins) {
        if (plugin.onKey?.(store, event)) return true
      }
      return false
    },
  }
}
