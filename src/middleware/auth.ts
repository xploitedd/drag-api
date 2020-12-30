import e, { NextFunction, Request, Response } from "express";
import MongoHandler from "../handlers/mongoHandler";

export interface AuthRequest extends Request {
    validAuth?: boolean
    key?: string
}

export function isAuthRequest(res: Request): res is AuthRequest {
    return (res as AuthRequest).validAuth !== undefined
}

export default function auth(mongoHandler: MongoHandler): (req: AuthRequest, res: Response, next: NextFunction) => void {
    return (req: AuthRequest, _: Response, next: NextFunction) => {
        req.validAuth = false
        const keyQuery = req.query.key

        if (req.method == 'GET' && keyQuery) {
            req.key = keyQuery as string
        } else {
            const auth = req.headers.authorization
            if (!auth) {
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

            req.key = auth.substring(7)
        }

        verifyKey(mongoHandler, req.key!).then(valid => {
            if (valid) {
                req.validAuth = true
                return next()
            }

            next({
                status: 403,
                message: 'Invalid authorization key!'
            })
        }).catch(next)
    }
}

async function verifyKey(mongoHandler: MongoHandler, key: string): Promise<boolean> {
    // verify if the key is valid
    return mongoHandler.execute(async db => {
        const col = db.collection('api_keys')
        const res = await col.find({ key })
            .toArray()

        // for now just verify if the key exists
        return res.length === 1
    }).catch(err => Promise.reject({
        status: 500,
        message: err.message
    }))
}