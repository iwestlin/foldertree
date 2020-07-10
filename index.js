#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log(tree_tpl(JSON.stringify(main())))

function tree_tpl (str) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no"><meta name="theme-color" content="#000000"><title>Folder Tree</title><link href="https://cdn.jsdelivr.net/gh/iwestlin/foldertree/dist/min.css" rel="stylesheet"></head><body><noscript>Please Enable JavaScript</noscript><div id="root"></div><script type="text/javascript">var treedata = ${str}</script><script type="text/javascript" src="https://cdn.jsdelivr.net/gh/iwestlin/foldertree/dist/min.js"></script></body></html>`
}

function main () {
  let dir = process.argv[2] || ''
  dir = dir.trim()
  if (!dir) throw 'missing directory path!'
  dir = path.resolve(process.cwd(), dir)
  const root = {
    title: dir.split('/').pop(),
    key: dir,
    children: gen_children(dir)
  }
  return [extract(calc(root))]
}

function extract (node) {
  let {children} = node
  children = children.filter(v => v.children) // 只保留目录
  // children.sort((a, b) => b.number - a.number) // 根据文件数排序
  children.sort((a, b) => b.size - a.size)
  node.children = children.map(extract)
  node.title = `${node.title} | [${node.number} files, ${format_size(node.size)}]`
  return node
}

function calc (node) {
  if (node.number !== undefined) return node // 计算过了
  let total_number = 0
  let total_size = 0
  for (const child of node.children) {
    if (child.key) { // 是目录
      const {number, size} = calc(child)
      total_number += number
      total_size += size
    } else { // 文件
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
    return {title: `${dir}/${name}`, size}
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
