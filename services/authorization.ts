export default async function authorize(login: string, username: string, repo: string) : Promise<boolean> {
    
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
    accessList: Repo_Access[]
}

interface Repo_Access {
    username: string;
    permission: string;
}