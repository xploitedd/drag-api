const fetch = require('node-fetch')
const fs = require('fs').promises

async function doTask() {
    const word_list = {}
    const word_list_en = {}
    while (true) {
        const params = new URLSearchParams()
        params.append('method', 'newround')
        params.append('locale', 'pt_PT')
        params.append('bwords', Object.keys(word_list).join(','))

        const res = await fetch('https://quickdraw.withgoogle.com/api', {
            method: 'POST',
            body: params
        })

        const obj = await res.json()

        const ptword = obj.challenge
        const enword = obj.en_challenge

        if (word_list[ptword])
            console.log('repetition')
        else
            console.log(ptword)

        word_list[ptword] = 1
        word_list_en[enword] = 1

        fs.writeFile('words_pt.json', JSON.stringify(Object.keys(word_list)))
        fs.writeFile('words_en.json', JSON.stringify(Object.keys(word_list_en)))
        await new Promise(r => setTimeout(r, 300))
    }
}

doTask()