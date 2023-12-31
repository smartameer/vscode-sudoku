import * as vscode from 'vscode'

type ISCORE = {
  mode: string
  date: number
}
type ISCORES = {
  title: string
  description?: string
  tooltip?: string
  scores?: ISCORE[]
}

class Dependency extends vscode.TreeItem {
  scores?: ISCORE[]

	constructor(
		public readonly data: ISCORES,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
	) {
		super(data.title, collapsibleState)

		this.data = data
    this.label = data.title
    if (data.description) {
      this.description = data.description
      this.iconPath = new vscode.ThemeIcon('arrow-small-right')
    } else {
      this.iconPath = new vscode.ThemeIcon('gift')
    }
    if (data.tooltip) {
      this.tooltip = data.tooltip
    }
    this.scores = data.scores
	}

	contextValue = 'score-item-' + this.data.title
}

export class ScoreProvider implements vscode.TreeDataProvider<Dependency> {
  public static readonly viewType = 'sudoku.scoreboard'
  private _items: Dependency[] = []
  private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | null | void> = new vscode.EventEmitter<Dependency | undefined | null | void>()
  readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | null | void> = this._onDidChangeTreeData.event

  constructor(context: vscode.ExtensionContext) {
  }

  parseTreeData(items: any[]): Dependency[] {
    const list: any = {}
    for (var i in items) {
      const d = items[i]
      const date = (new Date(d.date)).toDateString()
      list[date] = list[date] ?? []
      list[date].push(d)
    }

    const scores = []
    for (var i in list) {
      scores.push(new Dependency({ title: i, scores: list[i] }, vscode.TreeItemCollapsibleState.Collapsed))
    }
    return scores as Dependency[]
  }

  getTreeItem(element: Dependency): vscode.TreeItem {
		return element
	}

  getChildren(element?: Dependency): Thenable<Dependency[]> {
    if (typeof element === "undefined") {
			return Promise.resolve(this._items)
    }

    if (typeof element.scores !== "undefined") {
			return Promise.resolve(element.scores.map(item => {
        const timeObj = new Date(item.date)
				return new Dependency({
					title: timeObj.getHours().toString().padStart(2, '0') + ':' + timeObj.getMinutes().toString().padStart(2, '0'),
					description: `\tMode: ${item.mode.toUpperCase()}`,
          tooltip: `Date: ${timeObj.toLocaleString()}\nMode: ${item.mode.toUpperCase()}`
				}, vscode.TreeItemCollapsibleState.None)
      }))
		}
    return Promise.resolve([])
  }

  public refresh(scores: ISCORE[]): void {
    this._items = this.parseTreeData(scores)
    this._onDidChangeTreeData.fire()
  }
}
