// electron-builder afterPack hook: place the staged Next.js server beside the app.
// (extraResources silently drops node_modules folders, which the server needs, so the server
// is copied here instead — after packing, before the AppImage/deb/dmg/nsis targets are built.)
const { cpSync, existsSync } = require('node:fs')
const path = require('node:path')

exports.default = async function afterPack(context) {
  const src = path.join(context.packager.projectDir, 'desktop-build', 'server')
  if (!existsSync(path.join(src, 'server.js'))) throw new Error('desktop-build/server missing — run `npm run desktop:prepare` first')
  const resources = context.electronPlatformName === 'darwin'
    ? path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`, 'Contents', 'Resources')
    : path.join(context.appOutDir, 'resources')
  cpSync(src, path.join(resources, 'server'), { recursive: true, dereference: true })
  console.log(`  • server copied into ${path.relative(context.packager.projectDir, resources)}/server`)
}
