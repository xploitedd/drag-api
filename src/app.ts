import express, { NextFunction, Request, Response } from 'express'
import MongoHandler from './handlers/mongoHandler'
import router from './router'

const serverPort = process.env.SERVER_PORT || 8080
const mongo = new MongoHandler({
    host: process.env.MONGODB_HOST || 'localhost',
    port: parseInt(process.env.MONGODB_PORT!) || 27017,
    dbname: process.env.MONGODB_DB || 'dragapi'
})

const app = express()
app.set('trust proxy', process.env.SHOULD_TRUST_PROXY || true)

app.use('/v1', router(mongo))
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (!isApiError(err)) {
        console.error(err)
        err = {
            status: 500,
            message: 'Unexpected Error!'
        }
    }

    const apiErr = err as ApiError
    res.status(apiErr.status)
    res.json(apiErr)
})

app.listen(serverPort, () => {
    console.log(`Listening on port ${serverPort}`)
})

export interface ApiError {
    status: number,
    message: string
}

function isApiError(err: any): err is ApiError {
    const apiErr = err as ApiError
    return apiErr.message !== undefined && apiErr.status !== undefined
}