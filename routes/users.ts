import express, { Request, Response } from 'express'
import { MongoClient } from 'mongodb'
import { ObjectId } from 'bson'
import fs from 'fs'
import path from 'path'

const fsPromises = fs.promises
const router = express.Router()
const mongoURI = process.env.uri || 'mongodb://127.0.0.1:27017'

router.get('/', (_req: Request, res: Response) => {
    res.redirect('/users/list')
})

router.get('/list', async (_req: Request, res: Response) => {
    const client = new MongoClient(mongoURI)
    try {
        const database = client.db('GIT_DAMN')
        const users = database.collection('users')

        const options = {
            projection: { _id: 1, email: 1, username: 1, role: 1, repositories: 1 },
        }

        const cursor = users.find({}, options)

        if ((await users.countDocuments({})) === 0) {
            res.status(400).send("No documents found!")
            return
        }
        const list = [];
        for await (const doc of cursor) {
            list.push(doc)
        }
        res.json(list)
    } catch (err) {
        console.log(err)
        res.status(400).json(err)
    } finally {
        await client.close()
    }
})

router.delete('/delete/:id', async (req: Request, res: Response) => {
    const client = new MongoClient(mongoURI)
    try {
        const database = client.db('GIT_DAMN')
        const users = database.collection('users')
        const query = {_id: new ObjectId(req.params.id)}
        const result = await users.deleteOne(query)

        const repo_path = path.join(global.repos_location, req.body.username)
        await fsPromises.rmdir(repo_path)

        res.status(200).json(result)
    } catch (err) {
        console.log(err)
        res.status(400).json(err)
    } finally {
        await client.close()
    }
})

export default router