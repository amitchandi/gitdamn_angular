declare global {
    var appRoot: string;
	var repos_location: string;
}

import * as dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import os from 'os'
import path from 'path'
import cookieParser from 'cookie-parser'
import fs from 'fs'
import * as https from 'https'

import users from './routes/users'
import username from './routes/username'
import authRoute from './routes/auth'

import gitMiddleware from './services/gitMiddleware'
import { userAutheticate } from './services/authenticationMiddleware'

global.appRoot = __dirname.replace('\\dist', '').replace('/dist', '')

if (process.env.REPOSITORIES_LOCATION == '') {
	global.repos_location = path.join(global.appRoot, 'repos')
} else if (os.type() === 'Windows_NT') {
	if (process.env.REPOSITORIES_LOCATION.startsWith(':/', 1))
		global.repos_location = process.env.REPOSITORIES_LOCATION
	else
		global.repos_location = path.join(global.appRoot, process.env.REPOSITORIES_LOCATION)
} else if (os.type() === 'Linux') {
	if (process.env.REPOSITORIES_LOCATION.startsWith('/'))
		global.repos_location = process.env.REPOSITORIES_LOCATION
	else
		global.repos_location = path.join(global.appRoot, process.env.REPOSITORIES_LOCATION)
} else if (os.type() === 'Darwin') {
	throw Error('Mac is not supported')
}

const expressApp = express()

expressApp.use(cors({
	origin: 'http://localhost:4200',
	credentials: true,
	allowedHeaders: ['type', 'content-type'],
	exposedHeaders: ['type'],
	methods: ['GET', 'POST', 'PUT', 'DELETE']
}))

expressApp.use(express.json())
expressApp.use(cookieParser())
expressApp.use(gitMiddleware)

expressApp.use('/auth', authRoute)
expressApp.use('/users', userAutheticate, users)
expressApp.use('/:username', userAutheticate, username)

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
