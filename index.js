const fs = require('fs')
const path = require('path')

const snap2html = require('./snap')

module.exports = main

function tree_tpl (str) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no"><meta name="theme-color" content="#000000"><title>Folder Tree</title><link href="https://unpkg.com/@viegg/static/fdtree.css" rel="stylesheet"></head><body><noscript>Please Enable JavaScript</noscript><div id="root"></div><script type="text/javascript">var treedata = ${str}</script><script type="text/javascript" src="https://unpkg.com/@viegg/static/fdtree.js"></script></body></html>`
}

function main () {
  const args = process.argv.filter(v => !v.startsWith('-'))
  let dir = args[2] || ''
  dir = dir.trim()
  if (!dir) throw 'missing directory path!'
  const to_snap = process.argv.some(v => v === '-s' || v === '--snap')
  if (to_snap) return snap2html(dir)
  const with_file = process.argv.some(v => v === '-f' || v === '--file')
  dir = path.resolve(process.cwd(), dir)
  const root = {
    title: dir.split('/').pop(),
    key: dir,
    children: gen_children(dir)
  }
  const to_json = process.argv.some(v => v === '-j' || v === '--json')
  if (to_json) return JSON.stringify(root)
  const result = [extract(calc(root), with_file)]
  return tree_tpl(JSON.stringify(result))
}

function extract (node, with_file) {
  let {children} = node
  if (!children) { // is file
    node.title = `${node.title} | [${format_size(node.size)}]`
    return node
  }
  if (!with_file) children = children.filter(v => v.children) // only keep folders
  children.sort((a, b) => b.number - a.number) // sort by total file number
  // children.sort((a, b) => b.size - a.size) // sort by total file size
  node.children = children.map(v => extract(v, with_file))
  node.title = `${node.title} | [${node.number} files, ${format_size(node.size)}]`
  return node
}

function calc (node) {
  if (node.number !== undefined) return node // calced
  let total_number = 0
  let total_size = 0
  for (const child of node.children) {
    if (child.key) { // is folder
      const {number, size} = calc(child)
      total_number += number
      total_size += size
    } else { // is file
      total_number += 1
      total_size += child.size
    }
  }
  node.number = total_number
  node.size = total_size
  return node
}

function gen_children (dir) {
  if (dir.endsWith('/')) dir = dir.slice(0, -1)
  const files = fs.readdirSync(dir).map(name => {
    if (name.startsWith('.')) return
    const t = fs.lstatSync(`${dir}/${name}`)
    if (t.isSymbolicLink()) return
    return {name, is_dir: t.isDirectory(), size: t.size}
  })
  return files.filter(v => v).map(file => {
    let {name, is_dir, size} = file
    if (is_dir) return {
      title: name,
      key: `${dir}/${name}`,
      children: gen_children(`${dir}/${name}`)
    }
    // return {title: `${dir}/${name}`, size}
    return {title: name, size, isLeaf: true}
  })
}

function format_size (n) {
  n = Number(n)
  if (Number.isNaN(n)) return ''
  if (n < 0) return 'invalid size'
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
  let flag = 0
  while (n >= 1024) {
    n = (n / 1024)
    flag++
  }
  return n.toFixed(2) + ' ' + units[flag]
}
