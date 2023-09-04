import * as vs from 'vscode'
import SudokuGameProvider from './SudokuGameProvider'

export function activate (context: vs.ExtensionContext): void {
  const provider = new SudokuGameProvider(context.extensionUri)

  context.subscriptions.push(
    vs.window.registerWebviewViewProvider(SudokuGameProvider.viewType, provider)
  )

  context.subscriptions.push(
    vs.commands.registerCommand('sudoku.new', async () => {
      const selection = await vs.window.showInformationMessage(
        'Do you want to start a new game?',
        'Yes',
        'No'
      )
      if (selection === 'Yes') {
        await provider.newGame()
      }
    }),
    vs.commands.registerCommand('sudoku.solve', async () => {
      await provider.solveGame()
      await vs.window.showInformationMessage('Current game is solved')
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
          label: SudokuGameProvider.MODES.EASY,
          picked: level === SudokuGameProvider.MODES.EASY,
          description: 'Easy mode'
        },
        {
          label: SudokuGameProvider.MODES.NORMAL,
          picked: level === SudokuGameProvider.MODES.NORMAL,
          description: 'Normal mode'
        },
        {
          label: SudokuGameProvider.MODES.HARD,
          picked: level === SudokuGameProvider.MODES.HARD,
          description: 'Hard mode'
        }
      ]
      quickPick.onDidChangeSelection(selection => {
        if (selection.length > 0) {
          void vs.workspace.getConfiguration().update(
            'sudoku.gameLevel',
            selection[0].label,
            vs.ConfigurationTarget.Global
          )
        }
      })
      quickPick.onDidHide(() => quickPick.dispose)
      quickPick.show()
    })
  )
}
