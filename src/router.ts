import express, { Router } from 'express'
import MongoHandler from './handlers/mongoHandler';
import auth from './middleware/auth';
import rateLimit from './middleware/rateLimit';

export default (mongoHandler: MongoHandler): Router => {
    const router = express.Router()
    const authMd = auth(mongoHandler)
    const rateLimitMd = rateLimit(mongoHandler)

    router.get('/', authMd, rateLimitMd, (req, res) => {
        res.json({
            status: 200,
            message: 'DRAG API'
        })
    })

    return router
}