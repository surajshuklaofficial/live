#!/usr/bin/env node

/*
 * Builds a production-ready version of the application and deploys it
 * to a given remote location using rsync
 */

const execa = require('execa');
const { copy, emptyDir, ensureDir, readJson, remove } = require('fs-extra');
const Listr = require('listr');
const ora = require('ora');
const path = require('path');
const pify = require('pify');
const webpack = require('webpack');
const { merge } = require('webpack-merge');

const { useAppConfiguration } = require('../webpack/helpers');

/** The root directory of the project */
const projectRoot = path.resolve(__dirname, '..');

/** The build folder where we set up the stage for electron-builder */
const buildDir = path.resolve(projectRoot, 'build');

/** The output directory where the release will be built */
const outputDir = path.resolve(projectRoot, 'dist');

const options = require('yargs')
  .usage('$0 [options] <target>')
  .option('p', {
    alias: 'production',
    default: false,
    describe: 'whether to build the application in production mode',
    type: 'boolean',
  })
  .option('variant', {
    default: 'normal',
    describe:
      'specifies the application variant to compile ("normal" or "light")',
  })
  .help('h')
  .alias('h', 'help')
  .version(false).argv;

function loadAppConfig() {
  return readJson(path.resolve(projectRoot, 'package.json'));
}

async function cleanDirs() {
  await emptyDir(buildDir);
  await emptyDir(outputDir);
}

async function createBundle(part, variantName) {
  const PARTS = ['main', 'preload', 'launcher'];
  process.env.DEPLOYMENT = '1';
  process.env.NODE_ENV = 'production';

  if (!PARTS.includes(part)) {
    throw new Error('unknown part; must be one of ' + JSON.stringify(PARTS));
  }

  if (variantName === 'normal') {
    variantName = undefined;
  }

  let webpackConfig = require(path.resolve(
    projectRoot,
    'webpack',
    (part === 'main' ? 'electron' : part) + '.config.js'
  ));

  webpackConfig.context = projectRoot;
  webpackConfig.mode = options.production ? 'production' : 'development';
  webpackConfig.output = {
    filename: part === 'main' ? '[name].bundle.js' : part + '.bundle.js',
    path: buildDir,
  };

  if (variantName) {
    webpackConfig = merge(webpackConfig, useAppConfiguration(variantName));
  }

  await ensureDir(buildDir);
  const stats = await pify(webpack)(webpackConfig);

  if (stats.hasErrors()) {
    console.log(
      stats.toString({
        colors: true, // Shows colors in the console
      })
    );
    throw new Error('Error while compiling Webpack bundle');
  }
}

async function copyIcons() {
  await copy(
    path.resolve(projectRoot, 'assets', 'icons', 'mac', 'skybrush.icns'),
    path.resolve(buildDir, 'icon.icns')
  );
  await copy(
    path.resolve(projectRoot, 'assets', 'icons', 'win', 'skybrush.ico'),
    path.resolve(buildDir, 'icon.ico')
  );
  await copy(
    path.resolve(projectRoot, 'assets', 'icons', 'linux', 'skybrush.png'),
    path.resolve(buildDir, 'icon.png')
  );
}

const electronBuilderSpawnOptions = {
  cwd: projectRoot,
  env: {
    // next line is needed because react-final-form depends on ts-essentials
    // (instead of dev-depending on it), which would need typescript as a
    // peer dependency, and electron-builder chokes on it
    ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES: 'true',
  },
};

async function invokeElectronBuilder(appConfig) {
  const tasks = [];

  tasks.push({
    task: () => invokeElectronBuilderForMacOS(appConfig),
    title: 'macOS',
    skip: () => {
      if (process.platform !== 'darwin') {
        return 'macOS packages can only be built on macOS';
      }
    },
  });

  tasks.push({
    task: () => invokeElectronBuilderForWindows(appConfig),
    title: 'Windows',
  });

  tasks.push({
    task: () => invokeElectronBuilderForLinux(appConfig),
    title: 'Linux',
  });

  if (tasks.length > 0) {
    return new Listr(tasks);
  }

  throw new Error('Cannot build with electron-builder on this platform');
}

async function invokeElectronBuilderForMacOS() {
  await execa('electron-builder', ['-m'], electronBuilderSpawnOptions);
}

async function invokeElectronBuilderForLinux() {
  await execa('electron-builder', ['-l'], electronBuilderSpawnOptions);
}

async function invokeElectronBuilderForWindows() {
  await execa('electron-builder', ['-w'], electronBuilderSpawnOptions);
}

async function cleanup() {
  await Promise.all(
    ['linux-unpacked', 'mac', 'win-unpacked'].map((subdir) =>
      remove(path.resolve(outputDir, subdir))
    )
  );
}

/**
 * Main entry point of the deployment script.
 */
async function main() {
  const appConfig = await loadAppConfig();

  const tasks = new Listr([
    {
      task: cleanDirs,
      title: 'Cleaning build directories',
    },
    {
      task: () =>
        new Listr([
          {
            task: () => createBundle('main', options.variant),
            title:
              'Main application' +
              (options.variant ? ` (${options.variant})` : ''),
          },
          {
            task: () => createBundle('launcher', options.variant),
            title: 'Launcher script',
          },
          {
            task: () => createBundle('preload', options.variant),
            title: 'Preload script',
          },
        ]),
      title: 'Creating JavaScript bundles',
    },
    {
      task: copyIcons,
      title: 'Copying icons',
    },
    {
      task: (ctx) => invokeElectronBuilder(ctx.appConfig),
      title: 'Building executables',
    },
    {
      task: cleanup,
      title: 'Cleaning up',
    },
  ]);

  try {
    await tasks.run({ appConfig });
    console.log('');
    ora().info(`Installers are now built in ${outputDir}`);
  } catch (error) {
    ora(error.message).fail();
    process.exit(1);
  }
}

main();
