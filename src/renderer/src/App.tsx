import { Messages } from '../../common/Messages'
import { ModPlatformModal, ModSchema, ReleasePlatform } from '../../common/ModSchema'
import { useEffect, useState, Fragment } from 'react'

import LaunchList from './components/LaunchList'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import pk from '../../../package.json'
import { GamePlatform, GamePlatformMap } from '../../common/GamePlatform'
import { Close, Minimize } from '@mui/icons-material'
import {
  IconButton,
  Button,
  Input,
  Modal,
  Typography,
  Fade,
  Box,
  Backdrop,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material'
import { styled } from '@mui/material/styles'
const BasicModalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4
}

const ALERT_MESSAGES = {
  NO_GAME_FILE: 'ゲームが見つかりません\nAmongUsをインストールしてプラットフォームを選択するか、Among Us.exeが存在するフォルダを選択してください',
  ALREADY_RUNNING_GAME: '既にAmongUsが起動中です。\n切り替えるにはゲームを終了する必要があります。',
  MOD_INSTALLED:
    '既にModが導入されています。\nAmongUsの再インストールを行うか、Modデータを全て削除してください'
}

const amlVersion: string = pk.version
let once = true

function App(): React.JSX.Element {
  const [isModList, setModList] = useState<boolean>(false)
  const [modListData, setModListData] = useState<ModSchema[]>([])
  const [isGamePlatform, setGamePlatform] = useState<boolean>(false)
  const [currentPlatform, setCurrentPlatform] = useState<GamePlatform>(GamePlatform.CUSTOM)
  const [currentPlatformPath, setCurrentPlatformPath] = useState<string>('')
  const [currentPlatformPathDisable, setCurrentPlatformPathDisable] = useState<boolean>(false)

  const [platformSelect, setPlatformSelect] = useState<React.JSX.Element[]>([])

  const [openErrorModal, setOpenErrorModal] = useState(false)
  const [basicModalMessage, setBasicModalMessage] = useState<React.JSX.Element>()

  const [openProgressModal, setOpenProgressModal] = useState<boolean>(false)
  const [progressModalTitle, setProgressModalTitle] = useState<string>('')
  const [progressModalMessage, setProgressModalMessage] = useState<string>('')
  const [progressModalBar] = useState<boolean>(true)

  const [openUpdateModal, setUpdateModal] = useState<boolean>(false)
  const [updateModalMessage, setUpdateModalMessage] = useState<string>('')
  const [updateModalError, setUpdateModalError] = useState<string>('')
  const [updateModalBar, setUpdateModalBar] = useState<boolean>(true)
  const handleCloseUpdateModal = (): void => {
    setUpdateModal(false)
    setUpdateModalMessage('')
    setUpdateModalError('')
    setUpdateModalBar(true)
  }

  const [openModPlatformModal, setOpenModPlatformModal] = useState<ModPlatformModal>({
    state: false,
    targetMod: null
  })
  const [currentModPlatform, setCurrentModPlatform] = useState<GamePlatform>(GamePlatform.STEAM)

  const handleOpenErrorModal = (msg: React.JSX.Element): void => {
    setBasicModalMessage(msg)
    setOpenErrorModal(true)
  }
  const handleCloseErrorModal = (): void => setOpenErrorModal(false)

  const handleCloseModPlatformModal = (): void => {
    setCurrentModPlatform(GamePlatform.STEAM)
    setOpenModPlatformModal({
      state: false,
      targetMod: null
    })
  }

  const handleApproveModPlatformModal = (): void => {
    launchWithMod(openModPlatformModal.targetMod, currentModPlatform)
    setOpenModPlatformModal({
      state: false,
      targetMod: null
    })
  }

  const MultiLineBody = (body: string): React.JSX.Element => {
    const texts = body.split('\n').map((item, index) => {
      return (
        <Fragment key={index}>
          {item}
          <br />
        </Fragment>
      )
    })
    return <>{texts}</>
  }

  /** Invokes */
  const existsExeFile = (location: string): Promise<boolean> =>
    window.electron.ipcRenderer.invoke(Messages.EXISTS_EXE_FILE, location)

  const searchGameDirectory = (event): Promise<string> =>
    window.electron.ipcRenderer.invoke(Messages.SEARCH_GAME_DIRECTORY, event.target.value)

  const openSelectFolderDialog = (): Promise<Electron.OpenDialogReturnValue> =>
    window.electron.ipcRenderer.invoke(Messages.DIALOG_OPEN_DIRECTORY)

  const isInstalledVanilla = (location: string): Promise<boolean> =>
    window.electron.ipcRenderer.invoke(Messages.IS_VANILLA, location)

  const downloadMod = (
    mod: ModSchema,
    location: string,
    modPlatform: GamePlatform
  ): Promise<boolean> =>
    window.electron.ipcRenderer.invoke(Messages.DOWNLOAD_MOD, mod, location, modPlatform)

  const extractMod = (mod: ModSchema, location: string): Promise<boolean> =>
    window.electron.ipcRenderer.invoke(Messages.EXTRACT_MOD, mod, location)

  const deleteMod = (location: string): Promise<boolean> =>
    window.electron.ipcRenderer.invoke(Messages.DELETE_MOD_DATA, location)

  const launchGame = (location: string, platform: GamePlatform): Promise<boolean> =>
    window.electron.ipcRenderer.invoke(Messages.LAUNCH_GAME, location, platform)

  const isRunningGame = (): Promise<boolean> =>
    window.electron.ipcRenderer.invoke(Messages.IS_RUNNING_GAME)

  const resetMods = (location: string): Promise<boolean> => window.electron.ipcRenderer.invoke(Messages.RESET_MODS, location)

  useEffect(() => {
    if (!isModList) {
      const loadModList = (): Promise<ModSchema[]> =>
        window.electron.ipcRenderer.invoke(Messages.LOAD_MOD_LIST)
      loadModList().then((d) => {
        setModListData(d)
      })
      setModList(true)
    }

    if (!isGamePlatform) {
      const getGamePlatform = (): Promise<GamePlatformMap> =>
        window.electron.ipcRenderer.invoke(Messages.AVAILABLE_GAME_PLATFORM)
      setCurrentPlatform(GamePlatform.CUSTOM)
      setCurrentPlatformPathDisable(false)
      getGamePlatform().then(async (d: GamePlatformMap) => {
        const platforms: React.JSX.Element[] = []
        for (const key in d) {
          const k = d[key]
          platforms.push(
            <MenuItem key={k.key} value={k.key}>
              {k.key}
            </MenuItem>
          )
          if (k.dir) {
            setCurrentPlatform(k.key as GamePlatform)
            setCurrentPlatformPath(k.dir)
            setCurrentPlatformPathDisable(true)
          }
        }
        setPlatformSelect(platforms)
      })
      setGamePlatform(true)
    }
    if (once) {
      window.api.onAutoUpdaterChecking((data) => {
        if (data.state === 'checking') {
          setUpdateModalMessage('確認中')
          setUpdateModalBar(true)
          setUpdateModal(true)
        }
      })
      window.api.onAutoUpdaterAvailable((data) => {
        if (data.state === 'available') {
          setUpdateModalMessage('ダウンロード中：完了後に再起動')
          setUpdateModalBar(true)
          setUpdateModal(true)
        }
      })
      window.api.onAutoUpdaterNotAvailable((data) => {
        if (data.state === 'latest') {
          handleCloseUpdateModal()
        }
      })
      window.api.onAutoUpdaterError((data) => {
        if (data.state === 'error') {
          setUpdateModalMessage('アップデートに失敗しました')
          setUpdateModalError(data.error?.message || '不明なエラー')
          setUpdateModalBar(false)
        }
      })
    }

    once = false

  })

  /* Handlers */
  const handleChangePlatform = async (event: SelectChangeEvent): Promise<void> => {
    setCurrentPlatform(event.target.value as GamePlatform)
    if (event.target.value !== GamePlatform.CUSTOM) {
      searchGameDirectory(event).then(async (dir: string) => {
        if (dir) {
          setCurrentPlatformPathDisable(false)
          setCurrentPlatformPath(dir)
          setCurrentPlatformPathDisable(true)
        } else {
          setCurrentPlatform(GamePlatform.CUSTOM)
          setCurrentPlatformPathDisable(false)
          setCurrentPlatformPath('')
        }
      })
    } else {
      setCurrentPlatformPathDisable(false)
      setCurrentPlatformPath('')
    }
  }

  const handleClickFolderSelect = (): void => {
    openSelectFolderDialog().then(async (d: Electron.OpenDialogReturnValue) => {
      if (!d.canceled && d.filePaths.length > 0) {
        const dir = d.filePaths[0]
        const exists = await existsExeFile(dir)
        if (exists) {
          const is_vanilla = await isInstalledVanilla(dir)
          if (is_vanilla) {
            setCurrentPlatformPath(dir)
          } else {
            handleOpenErrorModal(MultiLineBody(ALERT_MESSAGES.MOD_INSTALLED))
          }
        }
      }
    })
  }

  const hasSchemaPlatform = (mod: ModSchema): boolean => {
    if (mod.platform) {
      const platform: ReleasePlatform = mod.platform
      if ('epic' in platform && 'steam' in platform) return true
    }
    return false
  }

  const launchWithMod = async (mod, modPlatform): Promise<void> => {
    setProgressModalTitle(mod.title)
    setProgressModalMessage('Modデータ取得中...')
    setOpenProgressModal(true)
    await downloadMod(mod, currentPlatformPath, modPlatform)
    setProgressModalMessage('Modデータ展開中...')
    await extractMod(mod, currentPlatformPath)

    setProgressModalMessage('起動中...')
    await launchGame(currentPlatformPath, currentPlatform)

    setTimeout(() => {
      setOpenProgressModal(false)
    }, 10000)
  }

  const launchHandler = async (mod: ModSchema): Promise<void> => {
    if (!currentPlatformPath) {
      handleOpenErrorModal(MultiLineBody(ALERT_MESSAGES.NO_GAME_FILE))
      return
    }
    const isRunning = await isRunningGame()
    if (isRunning) {
      handleOpenErrorModal(MultiLineBody(ALERT_MESSAGES.ALREADY_RUNNING_GAME))
      return
    }
    if (mod.vanilla) {
      setProgressModalTitle(mod.title)
      setProgressModalMessage('最適化中...')
      setOpenProgressModal(true)
      await deleteMod(currentPlatformPath)

      setProgressModalMessage('起動中...')
      await launchGame(currentPlatformPath, currentPlatform)
      setTimeout(() => {
        setOpenProgressModal(false)
      }, 10000)
    } else {
      const targetMod: ModSchema = { ...mod }
      if (hasSchemaPlatform(targetMod)) {
        if (currentPlatform === GamePlatform.CUSTOM) {
          setOpenModPlatformModal({
            state: true,
            targetMod: targetMod
          })
          return
        }
      }
      launchWithMod(targetMod, currentPlatform)
    }
  }

  const resetModsHandler = async (): Promise<void> => {
    if (!currentPlatformPath) {
      handleOpenErrorModal(MultiLineBody(ALERT_MESSAGES.NO_GAME_FILE))
      return
    }
    const isRunning = await isRunningGame()
    if (isRunning) {
      handleOpenErrorModal(MultiLineBody(ALERT_MESSAGES.ALREADY_RUNNING_GAME))
      return
    }
    setProgressModalTitle('Modデータを削除')
    setProgressModalMessage('削除中...')
    setOpenProgressModal(true)
    await resetMods(currentPlatformPath)
    setTimeout(() => {
      setOpenProgressModal(false)
    }, 5000)
  }

  /** Elements */
  const BasicErrorModal = (): React.JSX.Element => {
    return (
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={openErrorModal}
        onClose={handleCloseErrorModal}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500
          }
        }}
      >
        <Fade in={openErrorModal}>
          <Box sx={BasicModalStyle}>
            <Typography id="transition-modal-title" variant="h6" component="h2">
              エラー
            </Typography>
            <Typography id="transition-modal-description" sx={{ mt: 2 }}>
              {basicModalMessage}
            </Typography>
            <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
              <Button onClick={handleCloseErrorModal}>Close</Button>
            </div>
          </Box>
        </Fade>
      </Modal>
    )
  }
  const handleCurrentModPlatformChange = (event: SelectChangeEvent): void => {
    setCurrentModPlatform(event.target.value as GamePlatform)
  }
  const BasicModPlatformModal = (): React.JSX.Element => {
    return (
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={openModPlatformModal.state}
        onClose={handleCloseModPlatformModal}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500
          }
        }}
      >
        <Fade in={openModPlatformModal.state}>
          <Box sx={BasicModalStyle}>
            <Typography id="transition-modal-title" variant="h6" component="h2">
              プラットフォームの選択
            </Typography>
            <div style={{ fontSize: '0.75em', marginBottom: '1em' }}>
              このModの導入にはプラットフォームの指定が必須です。
            </div>
            <div>
              <Select
                id="platform-select-mod"
                displayEmpty
                inputProps={{ 'aria-label': 'Without label' }}
                value={currentModPlatform}
                onChange={handleCurrentModPlatformChange}
              >
                <MenuItem value={GamePlatform.STEAM}>{GamePlatform.STEAM}</MenuItem>
                <MenuItem value={GamePlatform.EPIC}>{GamePlatform.EPIC}</MenuItem>
              </Select>
            </div>
            <div style={{ textAlign: 'right', paddingTop: '1rem' }}>
              <Button onClick={handleCloseModPlatformModal} color="error">
                キャンセル
              </Button>
              <Button onClick={handleApproveModPlatformModal} color="success">
                決定
              </Button>
            </div>
          </Box>
        </Fade>
      </Modal>
    )
  }

  interface ProcessViewProps {
    title: string
    message: string
    showProgress: boolean
  }

  const ProcessView = (props: ProcessViewProps): React.JSX.Element => {
    const card = (
      <Fragment>
        <CardContent>
          <Typography variant="h5" component="div" align="center">
            {props.title}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>{props.message}</Typography>
          {props.showProgress && <LinearProgress color="success" />}
        </CardContent>
      </Fragment>
    )

    return (
      <div
        className="full"
        style={{
          position: 'fixed',
          display: 'flex',
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.8)',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Box sx={{ width: 350 }}>
          <Card>{card}</Card>
        </Box>
      </div>
    )
  }

  interface UpdateViewProps {
    title: string
    message: string,
    error: string,
    showProgress: boolean
  }
  const ErrorDiv = styled('div')({
    display: 'block',
    width: '100%',
    maxHeight: '200px',
    overflowY: 'scroll',
    backgroundColor: 'rgba(255,255,255,0.1)',
    fontSize: '0.8rem',
    padding: '0.8rem'
  })
  const UpdateView = (props: UpdateViewProps): React.JSX.Element => {
    const card = (
      <Fragment>
        <CardContent>
          <Typography variant="h5" component="div" align="center">
            {props.title}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>{props.message}</Typography>
          <ErrorDiv>{props.error}</ErrorDiv>
          {props.showProgress && <LinearProgress color="primary" />}
          {props.error && (
            <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
              <Button onClick={handleCloseUpdateModal} color="success">
                閉じる
              </Button>
            </div>
          )}
        </CardContent>
      </Fragment >
    )

    return (
      <div
        className="full"
        style={{
          position: 'fixed',
          display: 'flex',
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.8)',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Box sx={{ width: 350 }}>
          <Card>{card}</Card>
        </Box>
      </div>
    )
  }

  return (
    <>
      <div id="container">
        <section id="menu">
          <div className="resetbutton">
            <Button onClick={resetModsHandler}>Mod削除</Button>
          </div>
          <div className="title">AmongUs Mod Launcher v{amlVersion}</div>
          <div className="buttons">
            <IconButton
              aria-label="minimize"
              size="small"
              onClick={() => window.electron.ipcRenderer.send('minimize')}
            >
              <Minimize />
            </IconButton>
            <IconButton
              aria-label="close"
              size="small"
              onClick={() => window.electron.ipcRenderer.send('close')}
            >
              <Close />
            </IconButton>
          </div>
        </section>
        <section id="launcher" style={{ padding: `1rem` }}>
          <LaunchList mods={modListData} handler={launchHandler} />
        </section>
        <section id="footer">
          <FormControl sx={{ minWidth: 120 }}>
            <Select
              id="platform-select"
              displayEmpty
              inputProps={{ 'aria-label': 'Without label' }}
              value={currentPlatform}
              onChange={handleChangePlatform}
            >
              {platformSelect}
            </Select>
          </FormControl>
          <div id="folder-select">
            <Input
              id="folder-input"
              value={currentPlatformPath}
              disabled={currentPlatformPathDisable}
            />
            <Button
              id="folder-button"
              variant="outlined"
              component="label"
              disabled={currentPlatformPathDisable}
              onClick={handleClickFolderSelect}
            >
              選択
            </Button>
          </div>
        </section>
        <BasicErrorModal />
        <BasicModPlatformModal />
        {openProgressModal && (
          <ProcessView
            title={progressModalTitle}
            message={progressModalMessage}
            showProgress={progressModalBar}
          />
        )}
        {openUpdateModal && (
          <UpdateView
            title="アップデート確認中"
            message={updateModalMessage}
            error={updateModalError}
            showProgress={updateModalBar}
          />
        )}
      </div>
    </>
  )
}

export default App
