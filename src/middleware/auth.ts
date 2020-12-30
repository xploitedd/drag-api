import { NextFunction, Request, Response } from "express";
import MongoHandler from "../handlers/mongoHandler";

export interface AuthEntry {
    key: string
    lastUsage: number
    requestsPerSecond?: number
}

export function isAuthEntry(val: any): val is AuthEntry {
    const entry = val as AuthEntry
    return entry.key !== undefined
}

export interface AuthRequest extends Request {
    validAuth?: boolean
    authEntry?: AuthEntry
}

export function isAuthRequest(res: Request): res is AuthRequest {
    const auth = res as AuthRequest
    return auth.validAuth !== undefined && auth.validAuth
}

export default function auth(mongo: MongoHandler, mandatory = true) {
    return (req: AuthRequest, _: Response, next: NextFunction) => {
        req.validAuth = false
        const keyQuery = req.query.key
        let key: string

        if (req.method == 'GET' && keyQuery && typeof keyQuery == 'string') {
            key = keyQuery as string
        } else {
            const auth = req.headers.authorization
            if (!auth) {
                if (!mandatory)
                    return next()

                return next({
                    status: 401,
                    message: 'Authorization key not provided!'
                })
            }

            if (!auth.startsWith('Bearer')) {
                return next({
                    status: 400,
                    message: 'Authorization header isn\'t a Bearer!'
                })
            }

            key = auth.substring(7)
        }

        verifyKey(mongo, key).then(entry => {
            if (entry) {
                req.validAuth = true
                req.authEntry = entry
                return next()
            }

            next({
                status: 403,
                message: 'Invalid authorization key!'
            })
        }).catch(next)
    }
}

async function verifyKey(mongo: MongoHandler, key: string): Promise<AuthEntry | null> {
    // verify if the key is valid
    return mongo.execute(async db => {
        const col = db.collection('api_keys')
        const res = await col.findOneAndUpdate({ key }, { $set: { 
            lastUsage: new Date().getTime() 
        }})

        return res.value
    })
}