import { ipcMain } from 'electron'
import { Messages } from '../common/Messages'
import { ModSchema } from '../common/ModSchema'
import mods from './mods.json'

export const modListHandler = (): void => {
  ipcMain.handle(Messages.LOAD_MOD_LIST, (): ModSchema[] => {
    const vanilla: ModSchema = {
      title: 'Vanilla',
      prefix: 'vanilla',
      image: '',
      release: '',
      regex: '',
      vanilla: true
    }
    const list: ModSchema[] = [vanilla, ...mods]
    return list
  })
}
