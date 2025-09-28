import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import process from 'process';
import { resolve, join, dirname } from "path";
import { copy, mkdirs } from 'fs-extra';

const config: ForgeConfig = {
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'ZoopakaClub',
          name: 'AmongUs-Mod-Launcher'
        },
        prerelease: false,
        draft: true
      }
    }
  ],
  packagerConfig: {
    name: 'AmongUs Mod Launcher',
    asar: true,
    icon: './resources/icon'
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      setupIcon: './resources/icon.ico'
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application,
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
  hooks: {
    async packageAfterCopy(_forgeConfig, buildPath) {
      const requiredNativePackages = ["registry-js"];

      const sourceNodeModulesPath = resolve(process.cwd(), "node_modules");
      const destNodeModulesPath = resolve(buildPath, "node_modules");

      await Promise.all(
        requiredNativePackages.map(async (packageName) => {
          const sourcePath = join(sourceNodeModulesPath, packageName);
          const destPath = join(destNodeModulesPath, packageName);

          await mkdirs(dirname(destPath));
          await copy(sourcePath, destPath, {
            recursive: true,
            preserveTimestamps: true,
          });
        })
      );
    }
  },
};

export default config;
