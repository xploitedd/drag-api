import { Request, Response, NextFunction } from "express"
import { ApiError } from "../app"
import MongoHandler from "../handlers/mongoHandler"
import { AuthEntry, isAuthEntry, isAuthRequest } from "./auth"

const MAX_REQUESTS_PER_SECOND_IP = 2
const MAX_REQUESTS_PER_SECOND_KEY = 4

interface IRateLimit {
    key: string
    isIp: boolean
    requests: number
    firstRequestTime: number
    maxRequestsPerSecond: number
}

export default function rateLimit(mongo: MongoHandler) {
    return (req: Request, _: Response, next: NextFunction) => {
        const limiter = isAuthRequest(req) ? req.authEntry! : req.ip
        limitBy(mongo, limiter)
            .then(() => next())
            .catch(next)
    }
}

async function limitBy(mongo: MongoHandler, limiter: AuthEntry | string): Promise<void> {
    return mongo.execute(async db => {
        const col = db.collection('rate_limit')
        const curTime = Date.now()
        const keyObject = getKeyObject(limiter, curTime)
        const res = await col.findOne({ key: keyObject.key })

        if (res) {
            const limit = res as IRateLimit
            const isLimited = checkRateLimit(limit, curTime)
            if (isLimited)
                return Promise.reject(isLimited)

            const requests = 1 + limit.requests % limit.maxRequestsPerSecond
            const firstRequestTime = requests == 1 ? curTime : limit.firstRequestTime
            await col.updateOne({ key: limit.key }, {
                $set: {
                    requests,
                    firstRequestTime,
                    maxRequestsPerSecond: keyObject.maxRequestsPerSecond
                }
            })
        } else {
            await col.insertOne(keyObject)
        }
    })
}

function getKeyObject(limiter: AuthEntry | string, time: number): IRateLimit {
    let keyObj: IRateLimit
    if (isAuthEntry(limiter)) {
        keyObj = {
            key: limiter.key,
            isIp: false,
            requests: 1,
            firstRequestTime: time,
            maxRequestsPerSecond: limiter.requestsPerSecond || MAX_REQUESTS_PER_SECOND_KEY
        }
    } else {
        keyObj = {
            key: limiter,
            isIp: true,
            requests: 1,
            firstRequestTime: time,
            maxRequestsPerSecond: MAX_REQUESTS_PER_SECOND_IP
        }
    }

    return keyObj
}

function checkRateLimit(limit: IRateLimit, curTime: number): ApiError | null {
    const maxPerSecond = limit.maxRequestsPerSecond
    if (maxPerSecond >= 0 && limit.requests == maxPerSecond) {
        if (curTime - limit.firstRequestTime < 1000) {
            return {
                status: 429,
                message: 'Rate limited'
            }
        }
    }

    return null
}