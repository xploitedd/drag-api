import { Db, MongoClient } from "mongodb"

export interface MongoConnectionInfo {
    host: string
    port: number
    dbname: string
}

export default class MongoHandler {

    private readonly _options: MongoConnectionInfo

    constructor(connInfo: MongoConnectionInfo) {
        this._options = connInfo
    }

    public async execute<T>(query: (db: Db) => T): Promise<T> {
        const client = await MongoClient.connect(this.getUri(), { useUnifiedTopology: true })
        const db = client.db(this._options.dbname)
        const res = await query(db)
        client.close()
        return res
    }

    private getUri(): string {
        return `mongodb://${this._options.host}:${this._options.port}`
    }
    
}