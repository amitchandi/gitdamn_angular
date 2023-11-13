import express, { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import simpleGit from 'simple-git'
import { MongoClient } from "mongodb"

const TREE = 'tree'

const mongoURI = process.env.uri || 'mongodb://127.0.0.1:27017'

const fsPromises = fs.promises
const router = express.Router({mergeParams: true})

router.get('/', async (req: Request, res: Response) => {
    const directoryPath = path.join(global.appRoot, 'repos', req.params.username)
	try {
		let dir = await fsPromises.readdir(directoryPath, { withFileTypes: true })
		const results = dir
            .map(file => {
                return {
                    name: file.name,
                    isDirectory: file.isDirectory()
                }
            })
            .filter(file => file.isDirectory)
		res.status(200).json(results)
	} catch(err) {
		console.log(err)
		res.status(400).end()
	}
})

router.get('/:repo_name/branches', async (req: Request, res: Response) => {
    const repo_name = req.params.repo_name
	const repo_dir = path.join(global.appRoot, 'repos', req.params.username, repo_name)
	try {
        const git = simpleGit(repo_dir)
		const result = await git.branchLocal()
		res.status(200).json(result)
        res.end()
	} catch (err) {
        console.log(err)
		res.status(400).end()
	}
})

router.get('/:repo_name', async (req: Request, res: Response) => {
    const repo_name = req.params.repo_name
	const repo_dir = path.join(global.appRoot, 'repos', req.params.username, repo_name)
	try {
        const git = simpleGit(repo_dir)
		const result = await git.branchLocal()
        res.redirect(301, `/${req.params.username}/${repo_name}/tree/${result.current}`)
	} catch (err) {
        console.log(err)
		res.status(400).end()
	}
})

router.get(['/:repo_name/tree/:branch', '/:repo_name/tree/:branch/*'], async (req: Request, res: Response) => {
    try {
        const repo_name = req.params.repo_name
        const branch = req.params.branch
        const repo_location = req.originalUrl.replace(`/${req.params.username}/${repo_name}/${TREE}/${branch}`, '')
        const directoryPath =
        path.join(global.appRoot, 'repos', req.params.username, repo_name, 'files', branch, repo_location)
        
        const lstat = await fsPromises.lstat(directoryPath)
        if (lstat.isDirectory()) {
            let files = await fsPromises.readdir(directoryPath, { withFileTypes: true })
            const results = files
                .filter(file => file.name !== '.git')
                .map(file => {
                    return {
                        name: file.name,
                        isDirectory: file.isDirectory()
                    }
                })
            res.setHeader('type', 'folder')
            res.status(200).json(results)
        } else {
            res.setHeader('type', 'file')
            res.status(200).sendFile(directoryPath)
        }
    } catch (err) {
        console.log(err)
        res.status(404).send('Error: no such file or directory')
    }
})

router.get(['/:repo_name/log', '/:repo_name/log/:branchOrHash'], async (req: Request, res: Response) => {
    const repo_name = req.params.repo_name
    const branchOrHash = req.params.branchOrHash

	const repo_dir = path.join(global.appRoot, 'repos', req.params.username, repo_name)
	try {
        const args: any = []
        if (branchOrHash)
            args[0] = branchOrHash
        const git = simpleGit(repo_dir)
		const result = await git.log(args)
        res.status(200).json(result)
    } catch (err) {
        res.status(404).send(err)
    }
})

router.get(['/:repo_name/log/:branch/:filename'], async (req: Request, res: Response) => {
    const repo_name = req.params.repo_name
    const branch = req.params.branch
    const filename = req.params.filename

	const repo_dir = path.join(global.appRoot, 'repos', req.params.username, repo_name)
	try {
        const commands = [
            'log',
            '--pretty=format:{%n  "hash": "%H"%n,%n  "abbreviated hash": "%h"%n,%n  "date": "%aI",%n  "message": "%s",%n  "refs": "%D",%n  "body": "%b",%n  "author_name": "%an",%n  "author_email": "%ae"},',
            branch,
            '--',
            filename
        ]
        let result = await simpleGit(repo_dir).raw(...commands)
        result = '[' + result.substring(0, result.length - 1) + ']'
        let json = JSON.parse(result)
        res.status(200).json(json)
    } catch (err) {
        console.log(err)
        res.status(404).json(err)
    }
})

router.post('/:new_repo_name', async (req: Request, res: Response) => {
    let new_repo_name = req.params.new_repo_name

    if (!new_repo_name.includes('.git'))
        new_repo_name = new_repo_name + '.git'

    const repo_dir = path.join(global.appRoot, 'repos', req.params.username, new_repo_name)
    const hooks_dir = path.join(repo_dir, 'hooks')
    const source_hooks_dir = path.join(global.appRoot, 'hooks')
    const client = new MongoClient(mongoURI)
    
    try {
        const GIT_DAMN = client.db('GIT_DAMN')
        const repositoryDB = GIT_DAMN.collection('repositories')
        const result = await repositoryDB.insertOne({
            name: new_repo_name,
            visiblity: 'private',
            owner: req.params.username
        })

        await fsPromises.mkdir(repo_dir)
        const git = simpleGit(repo_dir, { binary: 'git'})
        await git.init(true)
        await git.clone('./', './files/main') //needs branch name for folder
        await fsPromises.rm(hooks_dir, {recursive: true, force: true })
        await fsPromises.mkdir(hooks_dir)
        const files = await fsPromises.readdir(source_hooks_dir, { withFileTypes: true })
        
        files.forEach(file => {
            if (file === null) return
            const hook_file = path.join('hooks', file.name)
            fs.readFile(path.join(global.appRoot, hook_file), async (err, contents) => {
                if (err) return console.log(err)
                const filepath = path.join(repo_dir, hook_file)
                console.log(hook_file)
                await fsPromises.writeFile(filepath, contents)
                fsPromises.chmod(filepath, '711')
            })
        })

        console.log(result)
        if (!result.acknowledged)
            res.status(400).send('Database error')
        else
            res.status(200).send(`/${req.params.username}/${new_repo_name}`)
    } catch(err: any) {
        console.log(err)

        await fsPromises.rm(repo_dir, {recursive: true, force: true })

        if (err.code === 'EEXIST')
            res.status(400).send('Repository already exists.')
        else
            res.status(400).send('Cannot create repository.')
    } finally {
        await client.close()
    }
})

router.delete('/:repo_name', async (req: Request, res: Response) => {
    const client = new MongoClient(mongoURI)
    try {
        const repo_dir = path.join(global.appRoot, 'repos', req.params.username, req.params.repo_name)
        await fsPromises.rm(repo_dir, {recursive: true, force: true })

        const GIT_DAMN = client.db('GIT_DAMN')
        const repositoryDB = GIT_DAMN.collection('repositories')
        const result = await repositoryDB.deleteOne({
            name: req.params.repo_name
        })
        if (result.acknowledged)
            res.status(200).send('Deleted repository')
        else
            res.status(400).send('Error running delete query')
        await client.close()
    }
    catch (err) {
        console.log(err)
        res.send('Error deleting repository.')
    } finally {
        await client.close()
    }
})

// add user to repo i think. needs to be checked again
router.put('/addRepo/:repo_id', async (req: Request, res: Response) => {
    const client = new MongoClient(mongoURI)
    try {
        const username: string = req.params.username
        const repo_id: string = req.params.repo_id

        const GIT_DAMN = client.db('GIT_DAMN')
        const users_collection = GIT_DAMN.collection('users')
        const user = await users_collection.findOne({
            username: username
        })
        
        if (!user)
            res.send('Error getting user: ' + username)
        else {
            if (user.repositories.indexOf(repo_id) === -1) {
                res.send('User already has repository.')
                return
            }
            user.repositories.push(repo_id)
            const result = await users_collection.updateOne(
                {
                    username: username
                },
                {
                    repositories: user.repositories
                }
            )
            if (!result.acknowledged)
                res.send('Error updating users\' repositories')
            else
                res.send('Updated successfully')
            await client.close()
        }
    } catch (err) {
        console.log(err)
        res.status(400).send('There was an error adding the rpository.')
    } finally {
        await client.close()
    }
})

export default router