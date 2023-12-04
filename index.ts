declare global {
    var appRoot: string
}

import * as dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'

import fs from 'fs'
import * as https from 'https'

import users from './routes/users'
import username from './routes/username'

import gitMiddleware from './services/gitMiddleware'

global.appRoot = __dirname.replace('\\dist', '').replace('/dist', '')

const expressApp = express()
expressApp.use(express.json())
expressApp.use(cors({
	origin: '*',
	allowedHeaders: ['type', 'content-type'],
	exposedHeaders: ['type'],
	methods: ['GET', 'POST', 'PUT', 'DELETE']
}))

expressApp.use(gitMiddleware)

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
