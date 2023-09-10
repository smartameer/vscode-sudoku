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
    const board = game.values
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
      input.classList.toggle('highlight', input.value && input.value === el.value)
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
        toggleScoreboard(state.scoreboard || false)
      }
    }
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
    case 'scoreboard':
      const state = memory.read()
      toggleScoreboard(message.state)
      memory.store({
        ...state,
        scoreboard: message.state
      })
      break
  }
})

function toggleScoreboard(state) {
  const scoreboard = document.querySelector('.scoreboard')
  scoreboard.innerHTML = ''
  if (state) {
    const values = memory.read()
    if (values?.scores && values.scores.length > 0) {
      const table = document.createElement('table')
      table.classList.add('scores')
      const headRow = table.createTHead().insertRow(0)
      headRow.insertCell(0).innerHTML = '#'
      headRow.insertCell(1).innerHTML = 'Level'
      headRow.insertCell(2).innerHTML = 'Date'
      const body = table.createTBody()
      const reverse = function (arr) {
        return arr.map(arr.pop, [...arr])
      }
      reverse(values.scores).forEach(function(score, index) {
        var row = body.insertRow(index)
        row.insertCell(0).innerHTML = values.scores.length - index
        row.insertCell(1).innerHTML = score.mode
        row.insertCell(2).innerHTML = new Date(score.date).toLocaleString()
      })
      scoreboard.appendChild(table)
    }
  }
}

game.game.config.validate_on_insert = true;
const state = memory.read()
game.game.config.difficulty = state.level || 'normal'

if (state?.board && state.board !== null && Object.keys(state.board).length > 0) {
  game.start(state.board)
} else {
  game.start()
}
vscode.postMessage({ command: 'scoreboard', state: state.scoreboard })
toggleScoreboard(state.scoreboard || false)
memory.storeBoard()