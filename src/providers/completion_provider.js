const vscode = require('vscode')
const protypoCompletions = require('../protypo_defs').completions
const simvolioCompletions = require('../simvolio_defs').completions

class CompleteProvider {
    constructor(type) {
        this.type = type
        if (type === 'simvolio') {
            this.completions = simvolioCompletions
            this.isSimvolio = true
            this.varMatch = /\$(\w+)[\s,]|var\s/g
        }
        if (type === 'protypo') {
            this.completions = protypoCompletions
            this.isProtypo = true
            this.varMatch = /#\w+#/g
        }
        this.completionsKeys = Object.keys(this.completions)
        this.completes = []

    }
    provideCompletionItems(document, position, token) {
        const text = document.lineAt(position.line).text,
            currentText = text.substr(0, position.character),
            items = []
        const tag = this.getTag(currentText)
        const word = this.getWord(currentText)
        const scope = currentText.substring(currentText.indexOf(tag), position.character)

        // console.log("tag:", tag, "word:", word)
        if (tag) {
            this.completionsKeys.forEach(key => {
                if (key.toLowerCase() === tag) { // Element complete - params helper
                    this.completions[key].params.forEach(it => {
                        if (scope.indexOf(it.insertText) < 0) { // not repeat params
                            items.push(new vscode.CompletionItem(it.insertText))
                        }
                    })
                }
            })

        }
        if (word) {
            this.completionsKeys.forEach(key => {
                if (key.toLowerCase().indexOf(word) > -1) { // Element NOT complete - element helper
                    items.push(new vscode.CompletionItem(this.completions[key].insertText))
                }
            })
        }


        const vars = document.getText(document.getWordRangeAtPosition(position))
            .split(/[\s,:"'`\]\[(><)=]+/) // get str tokens
            .map(w => w.match(this.varMatch) ? w.substr(1, w.length - 1) : null)
            .filter(w => w)

        vars.forEach(v => {
            if (this.completes.indexOf(v) < 0) {
                this.completes.push(v)
            }
        })
        this.completes.forEach(c => {
            if (c.length > 3) {
                let item = new vscode.CompletionItem(c)
                // item.detail = c
                // item.filterText = c
                item.insertText = c
                items.push(item)
            }
        })


        return new vscode.CompletionList(items)
    }

    getTag(line) {
        line = line.replace(/\([^\(]+?\)/, "").trim()
        let res,
            i = line.length - 1,
            right = i
        while (i > 0 && '('.indexOf(line.charAt(i)) === -1) {
            right = --i
        }
        if (right > 0) {
            let left = --i
            while (i > 0 && ' ,}({)'.indexOf(line.charAt(i)) === -1) {
                left = --i
            }
            let res = line.substring(left, right)
        } else {
            res = null
        }
        return res
    }
    getWord(line) {
        let res,
            i = line.length - 1,
            right = i + 1,
            left = i
        while (i-- > 0 && ' <>,.(){}"[]`'.indexOf(line.charAt(i)) === -1) {
            left = i
        }
        res = line.substring(left, right).toLowerCase()
        return res
    }
}

module.exports = CompleteProvider