declare global {
    var appRoot: string
	var reposRoot: string
}

// require('./loadEnvironment')
import ('./loadEnvironment')

import * as http from 'http'
import { spawn } from 'child_process'
import * as path from 'path'
import backend from 'git-http-backend'
import * as zlib from 'zlib'
import express from 'express'
import cors from 'cors'

import users from './routes/users'
import username from './routes/username'

global.appRoot = __dirname.replace('\\dist', '')

//REPLACE WITH CONFIG FILE AT SOME POINT
const uri = "mongodb://localhost/"
//REPLACE WITH CONFIG FILE AT SOME POINT

var git_server = http.createServer(function (req, res) {
	try {
        if (!req.url)
        	throw new Error('missing url')
		const user = req.url.split('/')[1]
		const repo = req.url.split('/')[2]
		const dir = path.join(global.appRoot, 'repos', `${user}/${repo}`)
		const reqStream = req.headers['content-encoding'] == 'gzip' ? req.pipe(zlib.createGunzip()) : req
		
		reqStream.pipe(new backend(req.url, function (err, service) {
			if (err) return res.end(err + '\n')

			res.setHeader('content-type', service.type)
			console.log(service.action, repo, service.fields)
			const ps = spawn(service.cmd, service.args.concat(dir))
			ps.stdout.pipe(service.createStream()).pipe(ps.stdin)

		})).pipe(res)
	} catch(err) {
		console.log(err)
	}
})
git_server.listen(5000)

const expressApp = express()
expressApp.use(express.json())
expressApp.use(cors({
	origin: 'http://localhost:4200',
	allowedHeaders: ['type', 'content-type'],
	exposedHeaders: ['type'],
	methods: ['GET', 'POST']
}))
const port = 4000

expressApp.use('/users', users)

expressApp.use('/:username', username)

expressApp.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})