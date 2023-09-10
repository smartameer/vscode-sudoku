import * as vscode from 'vscode'

export default class SudokuGameProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'sudoku.game'
  private _view?: vscode.WebviewView
  public static MODE = {
    EASY: 'easy',
    NORMAL: 'normal',
    HARD: 'hard'
  }

  constructor (
    private readonly _extensionUri: vscode.Uri
  ) { }

  public resolveWebviewView (
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'media')
      ]
    }

    webviewView.webview.html = this.getWebviewContent(webviewView.webview)
    if (!vscode.workspace.getConfiguration().has('sudoku.gameLevel')) {
      void vscode.workspace.getConfiguration().update(
        'sudoku.gameLevel',
        SudokuGameProvider.MODE.EASY,
        vscode.ConfigurationTarget.Global
      )
    }
  }

  private getWebviewContent (webview: vscode.Webview): string {
    const nonce = this.getNonce()
    const scriptGamePathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'game.js')
    const scriptGameUri = webview.asWebviewUri(scriptGamePathOnDisk)
    const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk)
    const stylesPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')
    const styleMainUri = webview.asWebviewUri(stylesPathOnDisk)

    return `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <title>Sudoku</title>
          <link href="${styleMainUri.toString()}" rel="stylesheet">
        </head>
        <body data-vscode-context='{"preventDefaultContextMenuItems":true,"webviewSection":"game"}'>
          <div class="wrap">
            <div class="container"></div>
          </div>
          <script nonce="${nonce}" src="${scriptGameUri.toString()}"></script>
          <script nonce="${nonce}" src="${scriptUri.toString()}"></script>
        </body>
      </html>`
  }

  private getNonce (): string {
    let text = ''
    // eslint-disable-next-line max-len
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  }

  public async newGame (): Promise<void> {
    const currentView = this._view
    const level = vscode.workspace.getConfiguration().get('sudoku.gameLevel')
    await currentView?.webview.postMessage({ command: 'new', level })
  }

  public async solveGame (): Promise<void> {
    const currentView = this._view
    await currentView?.webview.postMessage({ command: 'solve' })
  }

  public async validateGame (): Promise<void> {
    const currentView = this._view
    await currentView?.webview.postMessage({ command: 'validate' })
  }
}
