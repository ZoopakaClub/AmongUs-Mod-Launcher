/* eslint-disable @typescript-eslint/ban-ts-comment */
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Messages } from './common/Messages'
import { AutoUpdateSchema } from './common/AutoUpdateSchema'
// Custom APIs for renderer
const api = {
  onAutoUpdaterChecking: (callback: (data: AutoUpdateSchema) => void) => {
    ipcRenderer.on(Messages.AUTO_UPDATOR_CHECKING, (_, data) => callback(data))
  },
  onAutoUpdaterAvailable: (callback: (data: AutoUpdateSchema) => void) => {
    ipcRenderer.on(Messages.AUTO_UPDATOR_AVAILABLE, (_, data) => callback(data))
  },
  onAutoUpdaterNotAvailable: (callback: (data: AutoUpdateSchema) => void) => {
    ipcRenderer.on(Messages.AUTO_UPDATOR_NOT_AVAILABLE, (_, data) => callback(data))
  },
  onAutoUpdaterError: (callback: (data: AutoUpdateSchema) => void) => {
    ipcRenderer.on(Messages.AUTO_UPDATOR_ERROR, (_, data) => callback(data))
  },
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
function callback(data: any): void {
  throw new Error('Function not implemented.')
}
