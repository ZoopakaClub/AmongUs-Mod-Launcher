import { ipcMain } from 'electron'
import { platform } from 'os'
import { enumerateKeys, enumerateValues, HKEY } from 'registry-js'
import { Registry } from 'rage-edit'
import * as vdf from '@node-steam/vdf'
import * as fs from 'fs-extra'
import * as path from 'path'

import { Messages } from '../common/Messages'
import { DefaultGamePlatforms, GamePlatform, GamePlatformMap } from '../common/GamePlatform'

export const gamePlatFormHandler = (): void => {
  ipcMain.handle(Messages.AVAILABLE_GAME_PLATFORM, async (): Promise<GamePlatformMap> => {
    const desktop_platform = platform()

    const availableGamePlatforms: GamePlatformMap = {}
    if (desktop_platform === 'win32') {
      // Steam
      if (
        enumerateValues(HKEY.HKEY_CLASSES_ROOT, 'steam').find((value) =>
          value ? value.name === 'URL Protocol' : false
        )
      ) {
        availableGamePlatforms[GamePlatform.STEAM] = DefaultGamePlatforms[GamePlatform.STEAM]
        const dir = await findDirectory(GamePlatform.STEAM)
        availableGamePlatforms[GamePlatform.STEAM].dir = dir
      }

      // Epic Games
      if (
        enumerateValues(HKEY.HKEY_CLASSES_ROOT, 'com.epicgames.launcher').find((value) =>
          value ? value.name === 'URL Protocol' : false
        )
      ) {
        availableGamePlatforms[GamePlatform.EPIC] = DefaultGamePlatforms[GamePlatform.EPIC]
        const dir = await findDirectory(GamePlatform.EPIC)
        availableGamePlatforms[GamePlatform.EPIC].dir = dir
      }

      // Microsoft Store
      // Search for 'Innersloth.Among Us....' key and grab it
      const microsoft_regkey = enumerateKeys(
        HKEY.HKEY_CURRENT_USER,
        'SOFTWARE\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\CurrentVersion\\AppModel\\Repository\\Packages'
      ).find((reg_key) => reg_key.startsWith('Innersloth.AmongUs' as string))

      if (microsoft_regkey) {
        // Grab the game path from the above key
        const value_found = enumerateValues(
          HKEY.HKEY_CURRENT_USER,
          'SOFTWARE\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\CurrentVersion\\AppModel\\Repository\\Packages' +
            '\\' +
            microsoft_regkey
        ).find((value) => (value ? value.name === 'PackageRootFolder' : false))
        if (value_found) {
          availableGamePlatforms[GamePlatform.MICROSOFT] =
            DefaultGamePlatforms[GamePlatform.MICROSOFT]
          availableGamePlatforms[GamePlatform.MICROSOFT].runPath = value_found.data as string
        }
      }
    }

    availableGamePlatforms[GamePlatform.CUSTOM] = DefaultGamePlatforms[GamePlatform.CUSTOM]

    return availableGamePlatforms
  })

  ipcMain.handle(
    Messages.SEARCH_GAME_DIRECTORY,
    async (_, platform: GamePlatform): Promise<string> => {
      const dir = await findDirectory(platform)
      return dir
    }
  )
}

const findDirectory = async (platform: GamePlatform): Promise<string> => {
  let location = ''
  try {
    switch (platform) {
      case GamePlatform.STEAM: {
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
        let found: boolean = false
        for (const key in json) {
          if (found) break
          if (Object.hasOwnProperty.call(json, key)) {
            if (Object.hasOwnProperty.call(json[key], 'path')) {
              const common = path.join(json[key].path, 'steamapps\\common')
              const isCommon = await fs.existsSync(common)
              if (!isCommon) continue
              const folders = await fs.promises.readdir(common)
              for (let idx = 0; idx < folders.length; idx++) {
                const sub = folders[idx]
                const isAmongUs = await fs.existsSync(path.join(common, sub, 'Among Us.exe'))
                if (isAmongUs) {
                  found = true
                  location = path.join(common, sub)
                }
              }
            }
          }
        }
        break
      }
      case GamePlatform.EPIC:
        {
          // GET EPIC REGISTRY DATA
          const installed = await Registry.get(
            'HKLM\\SOFTWARE\\WOW6432Node\\Epic Games\\EpicGamesLauncher'
          )
          if (!installed) throw 'not installed'
          const targetDir = path.join(installed.$values.appdatapath, 'Manifests')
          const isTargetDir = await fs.existsSync(targetDir)
          if (!isTargetDir) throw 'no directory'

          // SEARCH AU INSTALLED LOCATION FROM EPIC CONFIG
          const files = await fs.promises.readdir(targetDir)
          const items = files.filter((e) => /.*\.item$/.test(e))
          let found: boolean = false
          for (let idx = 0; idx < items.length; idx++) {
            if (found) break
            const item = items[idx]
            const json = await fs.promises.readFile(path.join(targetDir, item), 'utf8')
            const data = JSON.parse(json)
            if (data.LaunchExecutable === 'Among Us.exe') {
              const installLocation = data.InstallLocation
              const isinstallLocation = await fs.existsSync(installLocation)
              if (isinstallLocation) {
                found = true
                location = installLocation
                break
              }
            }
          }
        }
        break
    }
  } catch (e) {
    console.error(e)
  }

  return location
}
