(function (global) {
  'use strict'

  // Helper utilities
  const util = {
    extend: function (src, props) {
      props = props || {}
      let p
      for (p in src) {
        if (!props.hasOwnProperty(p)) {
          props[p] = src[p]
        }
      }
      return props
    },
    each: function (a, b, c) {
      if (Object.prototype.toString.call(a) === '[object Object]') {
        for (const d in a) {
          if (Object.prototype.hasOwnProperty.call(a, d)) {
            b.call(c, d, a[d], a)
          }
        }
      } else {
        for (let e = 0, f = a.length; e < f; e++) {
          b.call(c, e, a[e], a)
        }
      }
    },
    isNumber: function (n) {
      return !isNaN(parseFloat(n)) && isFinite(n)
    },
    includes: function (a, b) {
      return a.indexOf(b) > -1
    }
  }

  /**
     * Default configuration options. These can be overriden
     * when loading a game instance.
     * @property {Object}
     */
  const defaultConfig = {
    // If set to true, the game will validate the numbers
    // as the player inserts them. If it is set to false,
    // validation will only happen at the end.
    validate_on_insert: true,

    // Set the difficult of the game.
    // This governs the amount of visible numbers
    // when starting a new game.
    difficulty: 'normal'
  }

  /**
   * Sudoku singleton engine
   * @param {Object} config Configuration options
   */
  function Game (config) {
    this.config = config

    // Initialize game parameters
    this.cellMatrix = {}
    this.matrix = {}
    this.validation = {}

    this.values = []

    this.resetValidationMatrices()

    return this
  }
  /**
   * Game engine prototype methods
   * @property {Object}
   */
  Game.prototype = {
    /**
     * Build the game GUI
     * @returns {HTMLTableElement} Table containing 9x9 input matrix
     */
    buildGUI: function () {
      let td, tr

      this.table = document.createElement('table')
      this.table.classList.add('sudoku-container')

      for (let i = 0; i < 9; i++) {
        tr = document.createElement('tr')
        this.cellMatrix[i] = {}

        for (let j = 0; j < 9; j++) {
          // Build the input
          this.cellMatrix[i][j] = document.createElement('input')
          this.cellMatrix[i][j].maxLength = 1

          // Using dataset returns strings which means messing around parsing them later
          // Set custom properties instead
          this.cellMatrix[i][j].row = i
          this.cellMatrix[i][j].col = j

          this.cellMatrix[i][j].addEventListener('keyup', this.onKeyUp.bind(this))

          td = document.createElement('td')

          td.appendChild(this.cellMatrix[i][j])

          // Calculate section ID
          const sectIDi = Math.floor(i / 3)
          const sectIDj = Math.floor(j / 3)
          // Set the design for different sections
          if ((sectIDi + sectIDj) % 2 === 0) {
            td.classList.add('sudoku-section-one')
          } else {
            td.classList.add('sudoku-section-two')
          }
          // Build the row
          tr.appendChild(td)
        }
        // Append to table
        this.table.appendChild(tr)
      }

      this.table.addEventListener('mousedown', this.onMouseDown.bind(this))

      // Return the GUI table
      return this.table
    },

    /**
     * Handle keyup events.
     *
     * @param {Event} e Keyup event
     */
    onKeyUp: function (e) {
      let sectRow
      let sectCol
      let secIndex
      let val; let row; let col
      let isValid = true
      const input = e.currentTarget

      val = input.value.trim()
      row = input.row
      col = input.col

      // Reset board validation class
      this.table.classList.remove('valid-matrix')
      input.classList.remove('invalid')

      if (!util.isNumber(val)) {
        input.value = ''
        return false
      }

      // Validate, but only if validate_on_insert is set to true
      if (this.config.validate_on_insert) {
        isValid = this.validateNumber(val, row, col, this.matrix.row[row][col])
        // Indicate error
        input.classList.toggle('invalid', !isValid)
      }

      // Calculate section identifiers
      sectRow = Math.floor(row / 3)
      sectCol = Math.floor(col / 3)
      secIndex = row % 3 * 3 + col % 3

      // Cache value in matrix
      this.matrix.row[row][col] = val
      this.matrix.col[col][row] = val
      this.matrix.sect[sectRow][sectCol][secIndex] = val
    },

    onMouseDown: function (e) {
      const t = e.target

      if (t.nodeName === 'INPUT' && t.classList.contains('disabled')) {
        e.preventDefault()
      }
    },

    /**
     * Reset the board and the game parameters
     */
    resetGame: function () {
      this.resetValidationMatrices()
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          // Reset GUI inputs
          this.cellMatrix[row][col].value = ''
        }
      }

      const inputs = this.table.getElementsByTagName('input')

      util.each(inputs, function (i, input) {
        input.classList.remove('disabled')
        input.tabIndex = 1
      })

      this.table.classList.remove('valid-matrix')
    },

    /**
     * Reset and rebuild the validation matrices
     */
    resetValidationMatrices: function () {
      this.matrix = {
        row: {},
        col: {},
        sect: {}
      }
      this.validation = {
        row: {},
        col: {},
        sect: {}
      }

      // Build the row/col matrix and validation arrays
      for (let i = 0; i < 9; i++) {
        this.matrix.row[i] = ['', '', '', '', '', '', '', '', '']
        this.matrix.col[i] = ['', '', '', '', '', '', '', '', '']
        this.validation.row[i] = []
        this.validation.col[i] = []
      }

      // Build the section matrix and validation arrays
      for (let row = 0; row < 3; row++) {
        this.matrix.sect[row] = []
        this.validation.sect[row] = {}
        for (let col = 0; col < 3; col++) {
          this.matrix.sect[row][col] = ['', '', '', '', '', '', '', '', '']
          this.validation.sect[row][col] = []
        }
      }
    },

    /**
     * Validate the current number that was inserted.
     *
     * @param {String} num The value that is inserted
     * @param {Number} rowID The row the number belongs to
     * @param {Number} colID The column the number belongs to
     * @param {String} oldNum The previous value
     * @returns {Boolean} Valid or invalid input
     */
    validateNumber: function (num, rowID, colID, oldNum) {
      let isValid = true
      // Section
      const sectRow = Math.floor(rowID / 3)
      const sectCol = Math.floor(colID / 3)
      const row = this.validation.row[rowID]
      const col = this.validation.col[colID]
      const sect = this.validation.sect[sectRow][sectCol]

      // This is given as the matrix component (old value in
      // case of change to the input) in the case of on-insert
      // validation. However, in the solver, validating the
      // old number is unnecessary.
      oldNum = oldNum || ''

      // Remove oldNum from the validation matrices,
      // if it exists in them.
      if (util.includes(row, oldNum)) {
        row.splice(row.indexOf(oldNum), 1)
      }
      if (util.includes(col, oldNum)) {
        col.splice(col.indexOf(oldNum), 1)
      }
      if (util.includes(sect, oldNum)) {
        sect.splice(sect.indexOf(oldNum), 1)
      }
      // Skip if empty value

      if (num !== '') {
        // Validate value
        if (Number(num) <= 0) {
          isValid = false
        }
        if (
          // Make sure value is within range
          Number(num) > 0 &&
            Number(num) <= 9
        ) {
          // Check if it already exists in validation array
          if (
            util.includes(row, num) ||
              util.includes(col, num) ||
              util.includes(sect, num)
          ) {
            isValid = false
          } else {
            isValid = true
          }
        }

        // Insert new value into validation array even if it isn't
        // valid. This is on purpose: If there are two numbers in the
        // same row/col/section and one is replaced, the other still
        // exists and should be reflected in the validation.
        // The validation will keep records of duplicates so it can
        // remove them safely when validating later changes.
        row.push(num)
        col.push(num)
        sect.push(num)
      }

      return isValid
    },

    /**
       * Validate the entire matrix
       * @returns {Boolean} Valid or invalid matrix
       */
    validateMatrix: function () {
      let isValid; let val; let $element; let hasError = false

      // Go over entire board, and compare to the cached
      // validation arrays
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          val = this.matrix.row[row][col]
          // Validate the value
          isValid = this.validateNumber(val, row, col, val)
          this.cellMatrix[row][col].classList.toggle('invalid', !isValid)
          if (!isValid) {
            hasError = true
          }
        }
      }
      return !hasError
    },

    /**
     * A recursive 'backtrack' solver for the
     * game. Algorithm is based on the StackOverflow answer
     * http://stackoverflow.com/questions/18168503/recursively-solving-a-sudoku-puzzle-using-backtracking-theoretically
     */
    solveGame: function (row, col, string) {
      let cval,
        sqRow,
        sqCol,
        nextSquare,
        legalValues,
        sectRow,
        sectCol,
        secIndex,
        gameResult

      nextSquare = this.findClosestEmptySquare(row, col)
      if (!nextSquare) {
        // End of board
        return true
      } else {
        sqRow = nextSquare.row
        sqCol = nextSquare.col
        legalValues = this.findLegalValuesForSquare(sqRow, sqCol)

        // Find the segment id
        sectRow = Math.floor(sqRow / 3)
        sectCol = Math.floor(sqCol / 3)
        secIndex = sqRow % 3 * 3 + sqCol % 3

        // Try out legal values for this cell
        for (let i = 0; i < legalValues.length; i++) {
          cval = legalValues[i]
          // Update value in input
          nextSquare.value = string ? '' : cval

          // Update in matrices
          this.matrix.row[sqRow][sqCol] = cval
          this.matrix.col[sqCol][sqRow] = cval
          this.matrix.sect[sectRow][sectCol][secIndex] = cval

          // Recursively keep trying
          if (this.solveGame(sqRow, sqCol, string)) {
            return true
          } else {
            // There was a problem, we should backtrack

            // Remove value from input
            this.cellMatrix[sqRow][sqCol].value = ''
            // Remove value from matrices
            this.matrix.row[sqRow][sqCol] = ''
            this.matrix.col[sqCol][sqRow] = ''
            this.matrix.sect[sectRow][sectCol][secIndex] = ''
          }
        }

        // If there was no success with any of the legal
        // numbers, call backtrack recursively backwards
        return false
      }
    },

    /**
     * Find closest empty square relative to the given cell.
     *
     * @param {Number} row Row id
     * @param {Number} col Column id
     * @returns {jQuery} Input element of the closest empty
     *  square
     */
    findClosestEmptySquare: function (row, col) {
      let walkingRow; let walkingCol; let found = false
      for (let i = col + 9 * row; i < 81; i++) {
        walkingRow = Math.floor(i / 9)
        walkingCol = i % 9
        if (this.matrix.row[walkingRow][walkingCol] === '') {
          found = true
          return this.cellMatrix[walkingRow][walkingCol]
        }
      }
    },

    /**
     * Find the available legal numbers for the square in the
     * given row and column.
     *
     * @param {Number} row Row id
     * @param {Number} col Column id
     * @returns {Array} An array of available numbers
     */
    findLegalValuesForSquare: function (row, col) {
      let temp
      let legalVals
      let legalNums
      let val
      let i
      let sectRow = Math.floor(row / 3)
      let sectCol = Math.floor(col / 3)

      legalNums = [1, 2, 3, 4, 5, 6, 7, 8, 9]

      // Check existing numbers in col
      for (i = 0; i < 9; i++) {
        val = Number(this.matrix.col[col][i])
        if (val > 0) {
          // Remove from array
          if (util.includes(legalNums, val)) {
            legalNums.splice(legalNums.indexOf(val), 1)
          }
        }
      }

      // Check existing numbers in row
      for (i = 0; i < 9; i++) {
        val = Number(this.matrix.row[row][i])
        if (val > 0) {
          // Remove from array
          if (util.includes(legalNums, val)) {
            legalNums.splice(legalNums.indexOf(val), 1)
          }
        }
      }

      // Check existing numbers in section
      sectRow = Math.floor(row / 3)
      sectCol = Math.floor(col / 3)
      for (i = 0; i < 9; i++) {
        val = Number(this.matrix.sect[sectRow][sectCol][i])
        if (val > 0) {
          // Remove from array
          if (util.includes(legalNums, val)) {
            legalNums.splice(legalNums.indexOf(val), 1)
          }
        }
      }

      // Shuffling the resulting 'legalNums' array will
      // make sure the solver produces different answers
      // for the same scenario. Otherwise, 'legalNums'
      // will be chosen in sequence.
      for (i = legalNums.length - 1; i > 0; i--) {
        const rand = getRandomInt(0, i)
        temp = legalNums[i]
        legalNums[i] = legalNums[rand]
        legalNums[rand] = temp
      }

      return legalNums
    }
  }

  /**
 * Get a random integer within a range
 *
 * @param {Number} min Minimum number
 * @param {Number} max Maximum range
 * @returns {Number} Random number within the range (Inclusive)
 */
  function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max + 1)) + min
  }

  /**
 * Get a number of random array items
 *
 * @param {Array} array The array to pick from
 * @param {Number} count Number of items
 * @returns {Array} Array of items
 */
  function getUnique (array, count) {
    // Make a copy of the array
    const tmp = array.slice(array)
    const ret = []

    for (let i = 0; i < count; i++) {
      const index = Math.floor(Math.random() * tmp.length)
      const removed = tmp.splice(index, 1)

      ret.push(removed[0])
    }
    return ret
  }

  function triggerEvent (el, type) {
    if ('createEvent' in document) {
    // modern browsers, IE9+
      var e = document.createEvent('HTMLEvents')
      e.initEvent(type, false, true)
      el.dispatchEvent(e)
    } else {
    // IE 8
      var e = document.createEventObject()
      e.eventType = type
      el.fireEvent('on' + e.eventType, e)
    }
  }

  const Sudoku = function (container, settings) {
    this.container = container

    if (typeof container === 'string') {
      this.container = document.querySelector(container)
    }

    this.game = new Game(util.extend(defaultConfig, settings))

    this.container.appendChild(this.getGameBoard())

    this.values = null
  }

  Sudoku.prototype = {
    /**
     * Return a visual representation of the board
     * @returns {jQuery} Game table
     */
    getGameBoard: function () {
      return this.game.buildGUI()
    },

    newGame: function () {
      const that = this
      this.reset()

      setTimeout(function () {
        that.start()
      }, 20)
    },

    /**
     * Start a game.
     */
    start: function (board) {
      const arr = []
      let x = 0
      let values
      const rows = this.game.matrix.row
      const inputs = this.game.table.getElementsByTagName('input')
      const difficulties = {
        easy: 50,
        normal: 42,
        hard: 34,
        evil: 26,
      }

      // Solve the game to get the solution
      this.game.solveGame(0, 0)

      util.each(rows, function (i, row) {
        util.each(row, function (r, val) {
          arr.push({
            index: x,
            value: val,
            editable: false
          })
          x++
        })
      })

      // Get random values for the start of the game
      values = board || getUnique(arr, difficulties[this.game.config.difficulty])

      // Reset the game
      this.reset()

      util.each(values, function (i, data) {
        const input = inputs[data.index]
        input.value = data.value
        input.tabIndex = -1
        if (!data.editable) {
          input.classList.add('disabled', 'original')
        }
        triggerEvent(input, 'keyup')
      })

      this.values = values
    },

    /**
     * Reset the game board.
     */
    reset: function () {
      this.game.resetGame()
    },

    /**
     * Call for a validation of the game board.
     * @returns {Boolean} Whether the board is valid
     */
    validate: function () {
      let isValid

      isValid = this.game.validateMatrix()
      this.highlightGameValidity(isValid)
      return isValid
    },

    /**
     * Call for the solver routine to solve the current
     * board.
     */
    solve: function () {
      // Make sure the board is valid first
      if (!this.game.validateMatrix()) {
        this.highlightGameValidity(false)
        return false
      }

      // Solve the game
      const isValid = this.game.solveGame(0, 0)
      if (isValid) {
        const inputs = this.game.table.getElementsByTagName('input')

        util.each(inputs, function (i, input) {
          input.classList.add('disabled')
          input.tabIndex = -1
        })
      }
      this.highlightGameValidity(isValid)
    },

    highlightGameValidity: function (isValid) {
      if (isValid) {
        this.game.table.classList.toggle('valid-matrix', true)
      } else {
        this.game.table.classList.toggle('invalid-matrix', true)
        setTimeout(() => {
          this.game.table.classList.toggle('invalid-matrix', false)
        }, 2000)
      }
    }
  }

  global.Sudoku = Sudoku
})(this)
