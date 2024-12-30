// Shamelessly ~~stolen~~ adapted from https://github.com/justin-schroeder/arrow-js

import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { readdir } from 'fs/promises'
import { execa } from 'execa'
import chalk from 'chalk'

const info = (m) => console.log(chalk.blue(m))
const error = (m) => console.log(chalk.red(m))
const success = (m) => console.log(chalk.green(m))

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '../')

async function clean() {
  await execa('rm', ['-rf', `${rootDir}/dist`])
}

async function baseBuild() {
  info('Rolling up primary package')
  await execa('npx', [
    'rollup',
    '-c',
    '--environment',
    'BUILD:base'
  ])
}

async function iifeBuild() {
  info('Rolling up IIFE')
  await execa('npx', [
    'rollup',
    '-c',
    '--environment',
    'BUILD:iife'
  ])
}


async function typesBuild() {
  info('Rolling up types')
  await execa('npx', [
    'rollup',
    '-c',
    '--environment',
    'BUILD:types',
  ])
}

async function removeArtifacts() {
  const files = await (await readdir(`${rootDir}/dist`))
    .filter((file) => file.endsWith('.d.ts') && !file.startsWith('Nobl.'))
    .map((file) => `${rootDir}/dist/${file}`)
  await execa('rm', files)
}

;(async () => {
  try {
    await clean()
    await baseBuild()
    await iifeBuild()
    await typesBuild()
    await removeArtifacts()
    success('Build complete')
  } catch (e) {
    error('A build error occurred')
    console.log(e)
  }
})()
