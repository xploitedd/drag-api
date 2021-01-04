import { promises as fs } from 'fs'

const WORDS_DIR = `./data/`
const DEFAULT_LANG = 'en'

export interface WordResult {
    id: number,
    word: string
}

export default class WordController {

    private _availableWordFiles: string[] = []
    private _words: Map<string, string[]> = new Map()

    public async getWord(id: number, lang: string): Promise<WordResult> {
        const words = await this.readWordsFile(lang)
        if (id < 0 || id >= words.length) {
            return Promise.reject({
                status: 400,
                message: 'Invalid word id!'
            })
        }

        return {
            id,
            word: words[id]
        }
    }

    public async getRandomWord(lang: string): Promise<WordResult> {
        const wordsArr = await this.readWordsFile(lang)
        const randomIdx = Math.floor(Math.random() * wordsArr.length)

        return {
            id: randomIdx,
            word: wordsArr[randomIdx]
        }
    }

    private async readWordsFile(lang: string): Promise<string[]> {
        lang = lang || DEFAULT_LANG
        if (this._availableWordFiles.length == 0)
            await this.loadWordFiles()

        const wdata = this._words.get(lang)
        if (wdata)
            return wdata

        if (this._availableWordFiles.includes(lang)) {
            const data = await fs.readFile(`${WORDS_DIR}words_${lang}.json`)
            const json: string[] = JSON.parse(data.toString())
            if (json.length == 0) {
                return Promise.reject({
                    status: 500,
                    message: 'No words have been found!'
                })
            }

            this._words.set(lang, json)
            return json
        }

        return Promise.reject({
            status: 400,
            message: `Invalid language. Available: ${this._availableWordFiles.join(', ')}`
        })
    }

    private async loadWordFiles(): Promise<void> {
        // cache the available word files
        const files = await fs.readdir(WORDS_DIR)
            .then(files => {
                return files.filter(f => f.startsWith('words_') && f.endsWith('.json'))
                    .map(f => f.substring(6, f.length - 5))
            })

        this._availableWordFiles = files
    }

}