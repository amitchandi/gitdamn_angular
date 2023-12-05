import { Request } from 'express'

export default async function isAuthorized(req: Request, username: string, repo: string) : Promise<boolean> {
    
    const repo_object: Repo_Object = await getRepoInformation(username, repo)

    if (repo_object.visiblity === 'public') {
        return true
    } else {
        return false
    }
}

async function getRepoInformation(username: string, repo: string) : Promise<any> {
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
    allowed: string[]
}