import express, { Router } from 'express'
import WordController from './controllers/wordController';
import MongoHandler from './handlers/mongoHandler';
import auth from './middleware/auth';
import rateLimit from './middleware/rateLimit';

export default (mongo: MongoHandler): Router => {
    const router = express.Router()
    const rateLimitMd = rateLimit(mongo)

    router.get('/', rateLimitMd, (req, res) => {
        res.json({
            status: 200,
            message: 'DRAG API'
        })
    })

    const wordController = new WordController()
    router.get('/randomWord', auth(mongo, false), rateLimitMd, (req, res, next) => {
        const lang = req.query.lang as string || 'en'
        wordController.getRandomWord(lang)
            .then(word => res.json({ word }))
            .catch(next)
    })

    return router
}