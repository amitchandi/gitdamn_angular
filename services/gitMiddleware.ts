import { NextFunction, Request, Response } from 'express'

import { spawn } from 'child_process'
import * as path from 'path'
import backend from 'git-http-backend'
import * as zlib from 'zlib'

export default function gitMiddleware(req: Request, res: Response, next: NextFunction) {
	const user_agent = req.headers['user-agent']
    console.log(user_agent)
	if (!user_agent || user_agent?.indexOf('git') === -1) {
        next()
        return
    }

    try {
        if (!req.url)
            throw new Error('missing url')
        
        const urlSegments = req.url.split('/')
        const user = urlSegments[1]
        const repo = urlSegments[2]
        const dir = path.join(global.appRoot, 'repos', `${user}/${repo}`)
        const reqStream = req.headers['content-encoding'] == 'gzip' ? req.pipe(zlib.createGunzip()) : req
        
        reqStream.pipe(new backend(req.url, function (err, service) {
            if (err) return res.end(err + '\n')

            res.setHeader('content-type', service.type)
            console.log(res.getHeaders())
            console.log(service.cmd, service.args.concat(dir))
            const ps = spawn(service.cmd, service.args.concat(dir))
            ps.stdout.pipe(service.createStream()).pipe(ps.stdin)

        })).pipe(res)
    } catch(err) {
        console.log(err)
    }
}