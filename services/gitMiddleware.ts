import { NextFunction, Request, Response } from 'express'

import { spawn } from 'child_process'
import * as path from 'path'
import backend from 'git-http-backend'
import * as zlib from 'zlib'
import authenticate from './authentication'

export default async function gitMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const user_agent = req.headers['user-agent']
        const urlSegments = req.url.split('/')
        const user = urlSegments[1]
        const repo = urlSegments[2]
        
        if (!user_agent || user_agent?.indexOf('git') === -1) {
            next()
            return
        }
    
        const validLogin = await authenticate(req);
    
        if (!validLogin) {
            res.set('www-Authenticate', 'Basic realm="401"')
            res.status(401).send('Authentication required.')
            return
        }

        if (!req.url)
            throw new Error('missing url')
        
        const dir = path.join(global.appRoot, 'repos', `${user}/${repo}`)
        const reqStream = req.headers['content-encoding'] == 'gzip' ? req.pipe(zlib.createGunzip()) : req
        
        reqStream.pipe(new backend(req.url, function (err, service) {
            if (err) return res.end(err + '\n')

            res.setHeader('content-type', service.type)
            //console.log(service.cmd, service.args.concat(dir))
            const ps = spawn(service.cmd, service.args.concat(dir))
            ps.stdout.pipe(service.createStream()).pipe(ps.stdin)

        })).pipe(res)
    } catch(err) {
        console.log(err)
    }
}