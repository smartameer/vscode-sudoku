const vscode = acquireVsCodeApi()
const game = new Sudoku('.container')
const container = document.querySelector('.sudoku-container')
const inputs = Array.from(document.querySelectorAll('input'))

const flatten = function(dataset) {
  let values = []
  dataset.forEach(function(data) {
    values[data.index] = data.value
  })
  return values;
}

const memory = {
  store: function(data) {
    vscode.setState(data)
  },
  clear: function() {
    vscode.setState(null)
  },
  read: function() {
    return vscode.getState()
  },
  clearBoard: function() {
    const state = memory.read()
    memory.store({
      ...state,
      board: null
    })
  },
  storeBoard: function() {
    const state = memory.read()
    let board = game.values
    if (game.game.cellMatrix) {
      board = []
      const matrix = game.game.cellMatrix
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          val = matrix[row][col]
          if (val.value) {
            board.push({
              index: (row * 9) + col,
              value: parseInt(val.value, 10),
              editable: !val.classList.contains('disabled')
            })
          }
        }
      }
    }
    memory.store({
      ...state,
      board
    })
  },
  storeScore: function(score) {
    const state = memory.read()
    const scores = state?.scores || []
    scores.push(score)
    memory.store({
      ...state,
      scores
    })
  }
}

const addWinningMessage = function() {
  var table = game.game.table
  var header = table.createTHead()
  header.setAttribute('id', 'winner');
  var row = header.insertRow(0)
  var cell = row.insertCell(0)
  cell.setAttribute('colspan', 9)
  cell.setAttribute('align', 'center')
  cell.innerHTML = "BRAVO! <br/>You won!"
}
const removeWinningMessage = function() {
  if (document.getElementById('winner')) {
    document.getElementById('winner').remove()
  }
}

container.addEventListener('click', e => {
  const el = e.target.closest('input')

  if (el) {
    inputs.forEach(input => {
      if (input.value && input.value === el.value) {
        input.classList.toggle('highlight', true)
        setTimeout(() => {
          input.classList.toggle('highlight', false)
        }, 1000)
      }
    })
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
        })
        addWinningMessage()

        const state = memory.read()
        memory.storeScore({
          mode: game.game.config.difficulty,
          status: 1,
          date: new Date().getTime(),
          board: flatten(game.values)
        })
      }
    }
    memory.storeBoard()
  }
}, false)

window.addEventListener('message', event => {
  const message = event.data

  switch (message.command) {
    case 'new': {
      removeWinningMessage()
      memory.clearBoard()
      if (message.hasOwnProperty('level')) {
        game.game.config.difficulty = message.level || 'normal'
        const state = memory.read()
        memory.store({
          ...state,
          level: message.level
        })
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
    case 'scores':
      const state = memory.read()
      vscode.postMessage({command: 'scores', data: state.scores})
      break
    case 'theme':
      const theme = message.theme
      const list =  document.querySelector('.container').parentElement.classList
      if (theme === 'original') {
        list.remove('editor-theme')
        list.add('original-theme')
      } else {
        list.remove('original-theme')
        list.add('editor-theme')
      }
  }
})

game.game.config.validate_on_insert = true;
const state = memory.read()
game.game.config.difficulty = state.level || 'normal'

if (state?.board && state.board !== null && Object.keys(state.board).length > 0) {
  game.start(state.board)
} else {
  game.start()
}
memory.storeBoard()