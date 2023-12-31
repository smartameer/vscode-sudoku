import * as vscode from 'vscode'
import SudokuGameProvider from './SudokuGameProvider'
import { ScoreProvider } from './ScoreProvider'

export function activate (context: vscode.ExtensionContext): void {
  const provider = new SudokuGameProvider(context.extensionUri)

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SudokuGameProvider.viewType, provider)
  )

  const scoreProvider = new ScoreProvider(context)
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(ScoreProvider.viewType, scoreProvider)
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('sudoku.new', async () => {
      const ack = await vscode.window.showInformationMessage(
        'Do you want to start a new game?',
        'Yes',
        'No'
      )
      if (ack === 'Yes') {
        await provider.newGame()
      }
    }),
    vscode.commands.registerCommand('sudoku.solve', async () => {
      await provider.solveGame()
      // await vscode.window.showInformationMessage('Current game is solved')
    }),
    vscode.commands.registerCommand('sudoku.scoreboard.refresh', () => {
      provider.fetchScores((data: any[]) => {
        scoreProvider.refresh(data)
      })
    }),
    vscode.commands.registerCommand('sudoku.validate', async () => {
      await provider.validateGame()
    }),
    vscode.commands.registerCommand('sudoku.settings', async () => {
      const level = vscode.workspace.getConfiguration().get('sudoku.gameLevel')
      const quickPick = vscode.window.createQuickPick()
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
        },
        {
          label: SudokuGameProvider.MODE.EVIL,
          picked: level === SudokuGameProvider.MODE.EVIL,
          description: 'Evil mode'
        }
      ]
      quickPick.onDidChangeSelection(async (selection) => {
        if (selection.length > 0 && level !== selection[0].label) {
          void vscode.workspace.getConfiguration().update(
            'sudoku.gameLevel',
            selection[0].label,
            vscode.ConfigurationTarget.Global
          ).then(async () => {
            const ack = await vscode.window.showInformationMessage(
              'Do you want to start a new game in ' + selection[0].label + ' mode?',
              'Yes',
              'No'
            )
            if (ack === 'Yes') {
              await provider.newGame()
            } else {
              await vscode.window.showInformationMessage('Your next game will be in ' + selection[0].label + ' mode.')
            }
          })
        }
        quickPick.hide()
        return true
      })
      quickPick.onDidHide(() => quickPick.dispose)
      quickPick.show()
    }),
    vscode.commands.registerCommand('sudoku.theme', async () => {
      const theme = vscode.workspace.getConfiguration().get('sudoku.gameTheme')
      const quickPick = vscode.window.createQuickPick()
      quickPick.title = 'Sudoku theme'
      quickPick.items = [
        {
          label: SudokuGameProvider.THEMES.EDITOR,
          picked: theme === SudokuGameProvider.THEMES.EDITOR,
          description: 'Default (vscode editor theme)'
        },
        {
          label: SudokuGameProvider.THEMES.ORIGINAL,
          picked: theme === SudokuGameProvider.THEMES.ORIGINAL,
          description: 'Original'
        }
      ]
      quickPick.onDidChangeSelection(async (selection) => {
        if (selection.length > 0 && theme !== selection[0].label) {
          void vscode.workspace.getConfiguration().update(
            'sudoku.gameTheme',
            selection[0].label,
            vscode.ConfigurationTarget.Global
          ).then(async () => {
            await provider.setTheme(selection[0].label)
          })
        }
        quickPick.hide()
        return true
      })
      quickPick.onDidHide(() => quickPick.dispose)
      quickPick.show()
    })
  )

  vscode.window.createTreeView(ScoreProvider.viewType, {
		treeDataProvider: scoreProvider,
		showCollapseAll: true
	})
  setTimeout(() => {
    vscode.commands.executeCommand('sudoku.scoreboard.refresh')
  }, 1000)
}

export function deactivate() {}