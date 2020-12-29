import { Request, Response, NextFunction } from "express"
import MongoHandler from "../handlers/mongoHandler"
import { isAuthRequest } from "./auth"

const MAX_REQUESTS_PER_SECOND = 4

export default function rateLimit(mongoHandler: MongoHandler): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, _: Response, next: NextFunction) => {
        if (isAuthRequest(req)) {
            limitByKey(mongoHandler, req.key!)
                .then(() => next())
                .catch(next)
        }
    }
}

async function limitByKey(mongoHandler: MongoHandler, key: string) {
    return mongoHandler.execute(async db => {
        const col = db.collection('rate_limit')
        const res = await col.findOne({ key })
        const curTime = Date.now()

        if (res) {
            const limit = res as RateLimitKey
            if (limit.requests === MAX_REQUESTS_PER_SECOND) {
                if (curTime - limit.first_request_time < 1000) {
                    return Promise.reject({
                        status: 429,
                        message: 'Rate limited'
                    })
                }
            }

            await col.updateOne({ key }, { $set: {
                requests: 1, 
                first_request_time: curTime
            }})
        } else {
            await col.insertOne({ 
                key,
                requests: 1,
                first_request_time: curTime
            })
        }
    }).catch(err => Promise.reject({
        status: 500,
        message: err.message
    }))
}

interface RateLimitKey {
    key: string
    requests: number
    first_request_time: number
}