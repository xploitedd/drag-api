import { promises as fs } from 'fs'

const WORDS_DIR = `./data/`

export default class WordController {

    private _availableWordFiles: string[] = []

    public async getRandomWord(lang: string): Promise<string> {
        const wordsArr: string[] = await this.readWordsFile(lang)
        const randomIdx = Math.floor(Math.random() * wordsArr.length)
        return wordsArr[randomIdx]
    }

    private async readWordsFile(lang: string) {
        if (this._availableWordFiles.length == 0) {
            // cache the available word files
            const files = await fs.readdir(WORDS_DIR)
                .then(files => {
                    return files.filter(f => f.startsWith('words_') && f.endsWith('.json'))
                        .map(f => f.substring(6, f.length - 5))
                })

            this._availableWordFiles = files
        }

        if (this._availableWordFiles.includes(lang)) {
            return fs.readFile(`${WORDS_DIR}words_${lang}.json`)
                .then(data => JSON.parse(data.toString()))
        }

        return Promise.reject({
            status: 400,
            message: `Invalid language. Available: ${this._availableWordFiles.join(', ')}`
        })
    }

}