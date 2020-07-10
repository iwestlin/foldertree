import React from 'react'
import ReactDOM from 'react-dom'
import { Tree, Button } from 'antd'
const { DirectoryTree } = Tree

class FolderTree extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      expand_all: true
    }
  }

  onSelect = (keys, event) => {
    const key = keys && keys[0]
    if (!key) return
    console.log(key)
  }

  trigger_expand = () => {
    const {expand_all} = this.state
    this.setState({expand_all: !expand_all})
  }

  render () {
    const {expand_all} = this.state
    return (
    <div>
      <Button onClick={this.trigger_expand}>{expand_all ? '折叠所有' : '展开所有'}</Button>
      {expand_all ? <DirectoryTree
        key={1}
        multiple
        defaultExpandAll
        onSelect={this.onSelect}
        treeData={window.treedata}
      /> : <DirectoryTree
        key={2}
        multiple
        onSelect={this.onSelect}
        treeData={window.treedata}
      />}
    </div>)
  }
}

ReactDOM.render(<FolderTree />, document.getElementById('root'))
