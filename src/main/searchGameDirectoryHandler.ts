import { ipcMain } from 'electron'
import { Registry } from 'rage-edit'
import * as fs from 'fs'
import * as path from 'path'
import * as vdf from '@node-steam/vdf'

import { Messages } from '../common/Messages'

export const searchGameDirectoryHandler = (): void => {
  ipcMain.handle(Messages.SEARCH_GAME_DIRECTORY, async (_, platform) => {
    let found = 0
    let location = ''
    try {
      if (platform === 'STEAM') {
        // GET STEAM REGISTRY DATA
        const linstalled = await Registry.get('HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam')
        if (!linstalled) throw 'not installed'
        const targetDir = path.join(linstalled.$values.installpath, 'config')
        const isTargetDir = await fs.existsSync(targetDir)
        if (!isTargetDir) throw 'no directory'
        // SEARCH AU INSTALLED LOCATION FROM STEAM CONFIG
        const files = await fs.promises.readdir(targetDir)
        const file = files.filter((e) => e === 'libraryfolders.vdf')
        if (!file.length) throw 'no libraryfolders'
        const vdfData = await fs.promises.readFile(path.join(targetDir, file[0]), 'utf8')
        const json = vdf.parse(vdfData).libraryfolders
        for (const key in json) {
          if (found) break
          if (Object.hasOwnProperty.call(json, key)) {
            if (Object.hasOwnProperty.call(json[key], 'path')) {
              const common = path.join(json[key].path, 'steamapps\\common')
              const folders = await fs.promises.readdir(common)
              for (let idx = 0; idx < folders.length; idx++) {
                const sub = folders[idx]
                const isAmongUs = await fs.existsSync(path.join(common, sub, 'Among Us.exe'))
                if (isAmongUs) {
                  found = 1
                  location = path.join(common, sub)
                }
              }
            }
          }
        }
      } else if (platform === 'EPIC') {
        // GET EPIC REGISTRY DATA
        const linstalled = await Registry.get(
          'HKLM\\SOFTWARE\\WOW6432Node\\Epic Games\\EpicGamesLauncher'
        )
        if (!linstalled) throw 'not installed'
        const targetDir = path.join(linstalled.$values.appdatapath, 'Manifests')
        const isTargetDir = await fs.existsSync(targetDir)
        if (!isTargetDir) throw 'no directory'
        // SEARCH AU INSTALLED LOCATION FROM EPIC CONFIG
        const files = await fs.promises.readdir(targetDir)
        const items = files.filter((e) => /.*\.item$/.test(e))
        for (let idx = 0; idx < items.length; idx++) {
          if (found) break
          const item = items[idx]
          const json = await fs.promises.readFile(path.join(targetDir, item), 'utf8')
          const data = JSON.parse(json)
          if (data.LaunchExecutable === 'Among Us.exe') {
            const installLocation = data.InstallLocation
            const isinstallLocation = await fs.existsSync(installLocation)
            if (isinstallLocation) {
              found = 1
              location = installLocation
              break
            }
          }
        }
      }
      return { found: found, location: location }
    } catch (e) {
      console.log(e)
      return { found: 0, path: '' }
    }
  })
}
