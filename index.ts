declare global {
    var appRoot: string
}

import * as dotenv from 'dotenv'
dotenv.config()

import * as http from 'http'
import { spawn } from 'child_process'
import * as path from 'path'
import backend from 'git-http-backend'
import * as zlib from 'zlib'
import express from 'express'
import cors from 'cors'

import fs from 'fs'
import * as https from 'https'

import users from './routes/users'
import username from './routes/username'

global.appRoot = __dirname.replace('\\dist', '').replace('/dist', '')

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
git_server.listen(process.env.GIT_PORT)

const expressApp = express()
expressApp.use(express.json())
expressApp.use(cors({
	origin: '*',
	allowedHeaders: ['type', 'content-type'],
	exposedHeaders: ['type'],
	methods: ['GET', 'POST', 'PUT', 'DELETE']
}))

expressApp.use('/users', users)

expressApp.use('/:username', username)

if (process.env['USE_HTTPS'] === 'true') {
	const port = process.env.HTTPS_PORT
	const ssl_key = process.env.SSL_KEY
	const ssl_cert = process.env.SSL_CERT
	if (!ssl_key || !ssl_cert)
		throw new Error('SSL_KEY and SSL_CERT environment variables are required')
	
	const httpsServer = https.createServer({
		key: fs.readFileSync(ssl_key),
		cert: fs.readFileSync(ssl_cert),
	}, expressApp)
	
	httpsServer.listen(port, () => {
		console.log(`HTTPS Server running on port ${port}`)
	})

} else {
	const port = process.env.HTTP_PORT
	expressApp.listen(port, () => {
		console.log(`Example app listening on port ${port}`)
	})
}
