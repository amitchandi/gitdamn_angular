import { NextFunction, Request, Response } from 'express'

import { spawn } from 'child_process'
import * as path from 'path'
import backend from 'git-http-backend'
import * as zlib from 'zlib'

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

        // basic auth
        const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
        const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')
    
        const validLogin = await authenticate(login, password)
    
        if (!validLogin) {
            res.set('www-Authenticate', 'Basic realm="401"')
            res.status(401).send('Authentication required.')
            return
        }

        const isAuthorized = await authorize(login, user, repo)

        if (!isAuthorized) {
            res.status(403).send('Not authorized to access this repository.')
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

async function authenticate(login: string, password: string) : Promise<boolean> {
    const url = `${process.env.API_URI}/users/login/${login}/${password}`
    const options: RequestInit =  {
       method: 'POST',
       cache: 'no-cache'
    }
    const response = await fetch(url, options)
    if (!response.ok)
       console.log('Login Failed: ' + await response.json())
    return response.ok
 }

 async function authorize(login: string, username: string, repo: string) : Promise<boolean> {
    
    const repo_object: Repo_Object = await getRepoInformation(username, repo)

    if (repo_object.visiblity === 'public') {
        return true
    } else {
        var user = repo_object.accessList.find(e => e.username === login)
        if (user)
            return true
        else
            return false
    }
}

async function getRepoInformation(username: string, repo: string) : Promise<Repo_Object> {
    const response = await fetch(`${process.env.API_URI}/${username}/${repo}`,
    {
        method: 'GET',
        cache: 'no-cache'
    })

    if (response.ok) {
        return await response.json()
    } else {
        throw Error('Error retrieving repo information')
    }
}

interface Repo_Object {
    _id: string;
    name: string;
    visiblity: string;
    owner: string;
    accessList: Repo_Access[];
}

interface Repo_Access {
    username: string;
    permission: string;
}