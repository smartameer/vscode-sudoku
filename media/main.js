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

const addWinningMessage = function() {
  var table = game.game.table
  var header = table.createTHead()
  var row = header.insertRow(0)
  var cell = row.insertCell(0)
  cell.setAttribute('colspan', 9)
  cell.setAttribute('align', 'center')
  cell.innerHTML = "BRAVO! <br/>You won!"
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

container.addEventListener('keyup', e => {
  const el = e.target.closest('input')

  if (el) {
    let count = 0;
    let valid = false
    inputs.forEach(input => {
      const val = input.value
      if (!isNaN(parseInt(val, 10))) {
        count++
      }
    })
    if (count > 80) {
      valid = game.game.validateMatrix()
      if (valid && count === 81) {
        game.validate()
        inputs.forEach(input => {
          input.classList.add('disabled')
          input.setAttribute('disabled', true)
        })
        addWinningMessage()
      }
    }
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

game.game.config.validate_on_insert = true;
const board = memory.getBoard()
if (board && board !== null && Object.keys(board).length > 0) {
  game.start(board)
} else {
  game.start()
}
memory.storeBoard()
