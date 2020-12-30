import MongoHandler from "../handlers/mongoHandler";

export default class ApiController {

    private readonly _mongo: MongoHandler

    constructor(mongo: MongoHandler) {
        this._mongo = mongo
    }

}