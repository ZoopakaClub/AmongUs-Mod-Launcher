import { ElectronAPI } from "@electron-toolkit/preload";
import { Messages } from '../common/Messages'
import { AutoUpdateSchema } from '../common/AutoUpdateSchema'

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      onAutoUpdaterChecking: (cb: (data: AutoUpdateSchema) => void) => void,
      onAutoUpdaterNotAvailable: (cb: (data: AutoUpdateSchema) => void) => void,
      onAutoUpdaterAvailable: (cb: (data: AutoUpdateSchema) => void) => void,
      onAutoUpdaterError: (cb: (data: AutoUpdateSchema) => void) => void
    };
  }
}
