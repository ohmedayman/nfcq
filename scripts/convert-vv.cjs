const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const imgDir = path.join('public', 'img')
const vvDir = path.join('vv')
const outs = [
  ['lamsa-hero-card.png', 'hero-card.webp', 1100],
  ['lamsa-card-detail.png', 'card-detail.webp', 1100],
  ['lamsa-tap-lifestyle.png', 'tap-lifestyle.webp', 1100],
  ['lamsa-business-stack.png', 'business-stack.webp', 1100],
]

;(async () => {
  for (const [src, dst, width] of outs) {
    const inPath = path.join(vvDir, src)
    const outPath = path.join(imgDir, dst)
    if (!fs.existsSync(inPath)) { console.log('skip', src); continue }
    await sharp(inPath).resize({ width, withoutEnlargement: true }).webp({ quality: 80, effort: 6 }).toFile(outPath)
    const o = fs.statSync(outPath).size
    const s = fs.statSync(inPath).size
    console.log(`${src.padEnd(30)} ${(s/1048576).toFixed(2)}MB -> ${dst.padEnd(22)} ${(o/1048576).toFixed(2)}MB  (-${(100-o/s*100).toFixed(0)}%)`)
  }
})()
