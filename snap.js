const fs = require('fs')
const path = require('path')

const DIRS = []
let file_numbers = folder_numbers = total_size = 0

module.exports = snap2html

// console.log(snap2html('.'))
function snap2html (target) {
  const name = gen_data(target)
  const template = fs.readFileSync(path.join(__dirname, 'dist/snap2html.template'), 'utf8')
  let html = template.replace('var dirs = []', 'var dirs = ' + JSON.stringify(DIRS))
  html = html.replace(/\[TITLE\]/g, name)
  html = html.replace('[GEN DATE]', (new Date()).toString())
  html = html.replace(/\[NUM FILES\]/g, file_numbers)
  html = html.replace('[NUM DIRS]', folder_numbers)
  html = html.replace('[TOT SIZE]', total_size)
  return html
}

function process_node (node) {
  let {name, abs_path, mtime, size} = node
  let result = [`${escape_name(name)}*0*${format_mtime(mtime)}`]
  const children = fs.readdirSync(abs_path).map(filename => {
    const child = fs.lstatSync(`${abs_path}/${filename}`)
    if (child.isSymbolicLink()) return
    total_size += child.size
    const is_dir = child.isDirectory()
    if (is_dir) {
      folder_numbers += 1
    } else {
      file_numbers += 1
    }
    return {
      filename, is_dir,
      abs_path: `${abs_path}/${filename}`,
      name: `${name}/${filename}`,
      size: child.size,
      mtime: child.mtime
    }
  }).filter(v => v).filter(v => !v.filename.startsWith('.'))
  const files = children.filter(v => !v.is_dir)
  result = result.concat(files.map(v => `${escape_name(v.filename)}*${v.size}*${format_mtime(v.mtime)}`))
  result.files_size = sum(files.map(v => v.size))
  result.name = name
  DIRS.push(result)
  const folders = children.filter(v => v.is_dir)
  folders.forEach(process_node)
}

function sum (arr) {
  let result = 0
  for (const v of arr) result += v
  return result
}

function gen_data (dir) {
  const abs_path = path.resolve(process.cwd(), dir)
  const name = abs_path.split('/').pop() || '/'
  const t = fs.lstatSync(abs_path)
  if (!t.isDirectory()) throw new Error(abs_path + ' is not a directory!')
  const node = {name, abs_path, mtime: t.mtime}
  process_node(node)
  DIRS.forEach(v => {
    let total_size = v.files_size
    const children_index = []
    DIRS.forEach((vv, i) => {
      if (vv.name.startsWith(v.name + '/')) {
        total_size += vv.files_size || 0
        if (!vv.name.replace(`${v.name}/`, '').includes('/')) children_index.push(i)
      }
    })
    v.push(total_size)
    v.push(children_index.join('*'))
  })
  return name
}

function format_mtime (mtime) {
  return parseInt(+new Date(mtime) / 1000)
}

function escape_name (name) {
  return name.replace(/\*/g, '&#42;')
}
