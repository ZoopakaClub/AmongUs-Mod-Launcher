import { ipcMain, shell } from 'electron'
import * as fs from 'fs-extra'
import * as path from 'path'
import { exec } from 'child_process'

import axios from 'axios'
import AdmZip from 'adm-zip'

import { Messages } from '../common/Messages'
import { ModSchema } from '../common/ModSchema'
import { ReleaseAsset } from '../common/ReleaseAsset'
import { DefaultGamePlatforms, GamePlatform, PlatformRunType } from '../common/GamePlatform'

const vanillaFiles = [
  '.egstore',
  'Among Us_Data',
  'Among Us.exe',
  'baselib.dll',
  'GameAssembly.dll',
  'msvcp140.dll',
  'UnityCrashHandler32.exe',
  'UnityPlayer.dll',
  'vcruntime140.dll',
  'handler'
]

const isZipSameVersion = async (
  dir: string,
  prefex: string,
  tag_condition: string
): Promise<boolean> => {
  try {
    const workdir = path.join(dir, 'handler')
    const versionFile = path.join(workdir, prefex + '.json')

    const existVersionFile: boolean = fs.existsSync(versionFile)
    if (!existVersionFile) return false

    const json = fs.readFileSync(versionFile, 'utf8')
    const data = JSON.parse(json)
    return data.version == tag_condition
  } catch (e) {
    console.error(e)
    return false
  }
}

const isCurrentModSame = async (dir: string, prefex: string): Promise<boolean> => {
  try {
    const workdir = dir
    const currentModFile = path.join(workdir, 'aml.json')

    const existcurrentModFile: boolean = fs.existsSync(currentModFile)
    if (!existcurrentModFile) return false

    const json = fs.readFileSync(currentModFile, 'utf8')
    const data = JSON.parse(json)
    return data.current == prefex
  } catch (e) {
    console.error(e)
    return false
  }
}

const deleteModData = async (dir: string): Promise<boolean> => {
  try {
    const filesInDir = fs.readdirSync(dir)
    filesInDir.forEach((fileOrDir) => {
      const fullPath = path.join(dir, fileOrDir)
      // リストに存在しないファイルやフォルダを削除
      if (!vanillaFiles.includes(fileOrDir)) {
        if (fs.statSync(fullPath).isDirectory()) {
          // ディレクトリの場合、再帰的に削除
          fs.rmSync(fullPath, { recursive: true, force: true })
        } else {
          // ファイルの場合、削除
          fs.unlinkSync(fullPath)
        }
      }
    })
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const deleteHandlerData = async (dir: string): Promise<boolean> => {
  try {
    const handler = path.join(dir, 'handler')
    fs.rmSync(handler, { recursive: true, force: true })
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const isApplicationRunning = (appName: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    exec('tasklist', (err, stdout, _) => {
      if (err) {
        return reject(err)
      }
      resolve(stdout.toLowerCase().indexOf(appName.toLowerCase()) > -1)
    })
  })
}

export const fileHandler = (): void => {
  ipcMain.handle(Messages.EXISTS_EXE_FILE, async (_, location: string): Promise<boolean> => {
    try {
      const isAmongUsDir = await fs.existsSync(path.join(location, 'Among Us.exe'))
      return isAmongUsDir
    } catch (e) {
      console.error(e)
      return false
    }
  })

  ipcMain.handle(Messages.IS_VANILLA, async (_, location: string): Promise<boolean> => {
    try {
      const mod_file_list = ['winhttp.dll', 'doorstop_config.ini']
      const mod_folder_list = ['mono', 'BepInEx']
      let isModFile: boolean = false
      for (let i = 0; i < mod_file_list.length; i++) {
        const target: string = path.join(location, mod_file_list[i])
        const exist: boolean = fs.existsSync(target)
        if (exist) {
          await fs.promises.unlink(target)
          isModFile = true
          break
        }
      }
      let isModFolder: boolean = false
      for (let i = 0; i < mod_folder_list.length; i++) {
        const target: string = path.join(location, mod_folder_list[i])
        const exist: boolean = fs.existsSync(target)
        if (exist) {
          isModFolder = true
          break
        }
      }

      if (isModFile || isModFolder) {
        return false
      }

      return true
    } catch (e) {
      console.error(e)
      return false
    }
  })

  ipcMain.handle(
    Messages.DOWNLOAD_MOD,
    async (_, mod: ModSchema, dir: string, platform: string): Promise<boolean> => {
      try {
        // create handler directory
        const workdir = path.join(dir, 'handler')
        const isHandler = await fs.existsSync(workdir)
        if (!isHandler) await fs.mkdir(workdir)

        let mod_release = mod.release
        let mod_regex = mod.regex
        if (mod.platform) {
          if (platform == GamePlatform.EPIC) {
            mod_release = mod.platform.epic.release
            mod_regex = mod.platform.epic.regex
          } else {
            mod_release = mod.platform.steam.release
            mod_regex = mod.platform.steam.regex
          }
        }

        console.log({
          prefix: mod.prefix,
          platform: mod.platform,
          target: platform,
          release: mod_release,
          regex: mod_regex
        })

        const dirName = mod.prefix
        const response_release = await axios.get(mod_release)
        if (response_release.status !== 200) throw 'NETWORK ERROR'
        const regex = new RegExp(mod_regex)

        let download_target: null | ReleaseAsset = null
        let tag_name: string = ''
        for (const key in response_release.data) {
          const release = response_release.data[key]
          for (const i in release['assets']) {
            const asset = release['assets'][i]
            if (!asset.name.match(regex)) continue
            download_target = asset
            tag_name = release.tag_name
          }
          if (download_target) break
        }

        const isSameVersion = await isZipSameVersion(dir, mod.prefix, tag_name)
        if (!isSameVersion) {
          if (download_target != null) {
            const zip_url = download_target.browser_download_url
            const response_zip = await axios.get(zip_url, {
              responseType: 'arraybuffer'
            })
            if (response_zip.status !== 200) throw 'NETWORK ERROR'
            const zipPath = path.join(workdir, dirName + '.zip')
            await fs.promises.writeFile(zipPath, Buffer.from(response_zip.data), 'binary')

            const versionData = { version: tag_name }
            const versionStr = JSON.stringify(versionData)
            const jsonPath = path.join(workdir, dirName + '.json')
            await fs.promises.writeFile(jsonPath, versionStr)

            return true
          }
        }

        return false
      } catch (e) {
        console.error(e)
        return false
      }
    }
  )

  ipcMain.handle(Messages.EXTRACT_MOD, async (_, mod: ModSchema, dir: string): Promise<boolean> => {
    try {
      const isSameMod = await isCurrentModSame(dir, mod.prefix)

      if (!isSameMod) {
        await deleteModData(dir)
      }

      const workdir = path.join(dir, 'handler')
      const fileName = mod.prefix + '.zip'
      const zipPath = path.join(workdir, fileName)

      const zip = new AdmZip(zipPath)
      const zipEntries = zip.getEntries()

      let targetDirectory: string | undefined = ''

      zipEntries.forEach((entry) => {
        if (entry.entryName.endsWith('winhttp.dll')) {
          // ファイルのディレクトリパスを取得（ファイル名を除いた部分）
          targetDirectory = path.dirname(entry.entryName)
          // ルートに存在する場合、空文字列になるためそのままにする
        }
      })
      if (!targetDirectory) {
        throw new Error('winhttp.dllがZIPファイル内に存在しません。')
      }

      if (targetDirectory == '.') {
        zip.extractAllTo(dir, true)
      } else {
        // 2階層以降
        zipEntries.forEach((entry) => {
          if (entry.entryName.startsWith(targetDirectory!)) {
            const relativePath = targetDirectory
              ? entry.entryName.replace(`${targetDirectory}/`, '')
              : entry.entryName
            const fullPath = path.join(dir, relativePath)

            if (entry.isDirectory) {
              fs.mkdirSync(fullPath, { recursive: true })
            } else {
              fs.writeFileSync(fullPath, entry.getData())
            }
          }
        })
      }
      const currentModData = { current: mod.prefix }
      const currentModDataStr = JSON.stringify(currentModData)
      const jsonPath = path.join(dir, 'aml.json')
      await fs.promises.writeFile(jsonPath, currentModDataStr)

      return true
    } catch (e) {
      console.error(e)
      return false
    }
  })

  ipcMain.handle(Messages.DELETE_MOD_DATA, async (_, dir: string): Promise<boolean> => {
    return deleteModData(dir)
  })

  ipcMain.handle(
    Messages.LAUNCH_GAME,
    async (_, dir: string, platform: GamePlatform): Promise<boolean> => {
      try {
        const GamePlatform = DefaultGamePlatforms[platform]
        switch (GamePlatform.launchType) {
          case PlatformRunType.URI:
            shell.openExternal(GamePlatform.runPath)
            break
          case PlatformRunType.EXE:
            shell.openExternal(path.join(dir, GamePlatform.execute))
            break
        }
        return true
      } catch (e) {
        console.error(e)
        return false
      }
    }
  )

  ipcMain.handle(Messages.IS_RUNNING_GAME, async (): Promise<boolean> => {
    return isApplicationRunning('Among Us.exe')
  })

  ipcMain.handle(Messages.RESET_MODS, async (_, dir: string): Promise<boolean> => {
    await deleteModData(dir)
    await deleteHandlerData(dir)
    return true
  })
}
