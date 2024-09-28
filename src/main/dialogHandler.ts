import { ipcMain, dialog } from 'electron'

import { Messages } from '../common/Messages'

export const dialogHandler = (win): void => {
  ipcMain.handle(
    Messages.DIALOG_OPEN_DIRECTORY,
    async (): Promise<Electron.OpenDialogReturnValue> => {
      const result = await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
      return result
    }
  )
}
