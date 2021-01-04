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
    router.get('/word', auth(mongo, false), rateLimitMd, (req, res, next) => {
        const lang = req.query.lang as string
        wordController.getRandomWord(lang)
            .then(r => res.json(r))
            .catch(next)
    })

    router.get('/word/:id', auth(mongo, false), rateLimitMd, (req, res, next) => {
        const id = parseInt(req.params.id)
        if (!id) {
            return next({
                status: 400,
                message: 'The word id must be a number!'
            })
        }

        const lang = req.query.lang as string
        wordController.getWord(id, lang)
            .then(r => res.json(r))
            .catch(next)
    })

    return router
}