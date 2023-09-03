import * as vscode from 'vscode'

export function activate (context: vscode.ExtensionContext): void {
  const provider = new SudokuGameProvider(context.extensionUri)
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SudokuGameProvider.viewType, provider)
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('sudoku.new', async () => {
      await provider.newGame()
    }),
    vscode.commands.registerCommand('sudoku.solve', async () => {
      await provider.solveGame()
    }),
    vscode.commands.registerCommand('sudoku.validate', async () => {
      await provider.validateGame()
    }),
    vscode.commands.registerCommand('sudoku.info', () => {
      // console.log('info')
    })
  )
}

class SudokuGameProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'sudoku.game'
  private _view?: vscode.WebviewView

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
        this._extensionUri
      ]
    }

    webviewView.webview.html = this.getWebviewContent(webviewView.webview)
  }

  private getWebviewContent (webview: vscode.Webview): string {
    const nonce = this.getNonce()
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'))
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'))

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <!--meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"-->
        <title>Sudoku</title>
        <link href="${styleMainUri.toString()}" rel="stylesheet">
      </head>
      <body>
        <div class="wrap">
          <div class="container"></div>
        </div>
        <script nonce="${nonce}" src="${scriptUri.toString()}"></script>
      </body>
      </html>`
  }

  private getNonce (): string {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  }

  public async newGame (): Promise<void> {
    const currentView = this._view
    await currentView?.webview.postMessage({ command: 'new' })
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
