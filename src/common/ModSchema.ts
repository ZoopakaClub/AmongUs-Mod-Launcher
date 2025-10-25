export interface Release {
  release: string
  regex: string
}

export interface ReleasePlatform {
  steam: Release
  epic: Release
}
export interface ModSchema {
  title: string
  prefix: string
  image: string
  url?: string
  platform?: ReleasePlatform
  release: string
  regex: string
  vanilla: boolean
}

export interface ModPlatformModal {
  state: boolean
  targetMod: ModSchema | null
}
