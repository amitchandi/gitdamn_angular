import express, { Request, Response } from 'express'
import { MongoClient } from 'mongodb'
import { ObjectId } from 'bson'
import fs from 'fs'
import bcrypt from 'bcrypt'

const saltRound = 10

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

        // print a message if no documents were found
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

router.post('/create', async (req: Request, res: Response) => {
    const client = new MongoClient(mongoURI)
    try {

        const salt = await bcrypt.genSalt(saltRound)
        const hashedPass = await bcrypt.hash(req.body.password, salt)

        if (fs.existsSync(`repos/${req.body.username}`))
            throw Error('User already exists')

        await fsPromises.mkdir(`repos/${req.body.username}`)

        const database = client.db('GIT_DAMN')
        const users = database.collection('users')
        const result = await users.insertOne({
            email: req.body.email,
            username: req.body.username,
            password: hashedPass,
            role: req.body.role,
        })

        res.status(200).json(result)
    } catch (err) {
        console.log(err)
        res.status(400).json(err)
    } finally {
        await client.close()
    }
})

router.post('/validateCredentials/:username/:password', async (req: Request, res: Response) => {
    const client = new MongoClient(mongoURI)
    try {
        const database = client.db('GIT_DAMN')
        const users = database.collection('users')
        const query = {username: req.params.username}
        const result = await users.findOne(query)
        if (!result)
            res.status(400).json('invalid username or password')
        else {
            var match = await bcrypt.compare(req.params.password, result.password)
            if (match) {
                delete result.password
                res.status(200).json(result)
            }
            else 
                res.status(400).json('invalid username or password')
        }
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
        res.status(200).json(result)
    } catch (err) {
        console.log(err)
        res.status(400).json(err)
    } finally {
        await client.close()
    }
})

export default router