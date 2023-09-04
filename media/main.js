const vscode = acquireVsCodeApi()
const game = new Sudoku('.container')
const container = document.querySelector('.sudoku-container')
const inputs = Array.from(document.querySelectorAll('input'))

const memory = {
  storeBoard: () => {
    const board = game.values
    vscode.setState(board)
  },
  clearBoard: () => {
    vscode.setState(null)
  },
  getBoard: () => {
    return vscode.getState()
  }
}

container.addEventListener('click', e => {
  const el = e.target.closest('input')

  if (el) {
    inputs.forEach(input => {
      input.classList.toggle('highlight', input.value && input.value === el.value)
    })
    memory.storeBoard()
  }
}, false)

window.addEventListener('message', event => {
  const message = event.data

  switch (message.command) {
    case 'new': {
      memory.clearBoard()
      if (message.hasOwnProperty('level')) {
        game.game.config.difficulty = message.level || 'easy'
      }
      game.newGame()
      setTimeout(memory.storeBoard, 30)
      break
    }
    case 'solve':
      game.solve()
      break
    case 'validate':
      game.validate()
      break
  }
})

const board = memory.getBoard()
if (board && board !== null && Object.keys(board).length > 0) {
  game.start(board)
} else {
  game.start()
}
memory.storeBoard()
