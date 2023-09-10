import * as vs from 'vscode'
import SudokuGameProvider from './SudokuGameProvider'

export function activate (context: vs.ExtensionContext): void {
  const provider = new SudokuGameProvider(context.extensionUri)

  context.subscriptions.push(
    vs.window.registerWebviewViewProvider(SudokuGameProvider.viewType, provider)
  )

  context.subscriptions.push(
    vs.commands.registerCommand('sudoku.new', async () => {
      const ack = await vs.window.showInformationMessage(
        'Do you want to start a new game?',
        'Yes',
        'No'
      )
      if (ack === 'Yes') {
        await provider.newGame()
      }
    }),
    vs.commands.registerCommand('sudoku.solve', async () => {
      await provider.solveGame()
      await vs.window.showInformationMessage('Current game is solved')
    }),
    vs.commands.registerCommand('sudoku.scoreboard.show', async () => {
      await vs.commands.executeCommand('setContext', 'sudoku-scoreboard', true)
      await provider.scoreboard(true)
    }),
    vs.commands.registerCommand('sudoku.scoreboard.hide', async () => {
      await vs.commands.executeCommand('setContext', 'sudoku-scoreboard', false)
      await provider.scoreboard(false)
    }),
    vs.commands.registerCommand('sudoku.validate', async () => {
      await provider.validateGame()
    }),
    vs.commands.registerCommand('sudoku.settings', async () => {
      const level = vs.workspace.getConfiguration().get('sudoku.gameLevel')
      const quickPick = vs.window.createQuickPick()
      quickPick.title = 'Sudoku game level'
      quickPick.items = [
        {
          label: SudokuGameProvider.MODE.EASY,
          picked: level === SudokuGameProvider.MODE.EASY,
          description: 'Easy mode'
        },
        {
          label: SudokuGameProvider.MODE.NORMAL,
          picked: level === SudokuGameProvider.MODE.NORMAL,
          description: 'Normal mode'
        },
        {
          label: SudokuGameProvider.MODE.HARD,
          picked: level === SudokuGameProvider.MODE.HARD,
          description: 'Hard mode'
        }
      ]
      quickPick.onDidChangeSelection(async (selection) => {
        if (selection.length > 0 && level !== selection[0].label) {
          void vs.workspace.getConfiguration().update(
            'sudoku.gameLevel',
            selection[0].label,
            vs.ConfigurationTarget.Global
          ).then(async () => {
            const ack = await vs.window.showInformationMessage(
              'Do you want to start a new game in ' + selection[0].label + ' mode?',
              'Yes',
              'No'
            )
            if (ack === 'Yes') {
              await provider.newGame()
            } else {
              await vs.window.showInformationMessage('Your next game will be in ' + selection[0].label + ' mode.')
            }
          })
        }
        quickPick.hide()
        return true
      })
      quickPick.onDidHide(() => quickPick.dispose)
      quickPick.show()
    })
  )
}

export function deactivate() {}