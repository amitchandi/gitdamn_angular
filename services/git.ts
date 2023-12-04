import simpleGit from 'simple-git'
import path from 'path'

export interface ls_tree_object {
    objectId: string;
    type: string;
    name: string | undefined;
}

export async function lsTree_Root(username: string, repo_name: string, hash: string) {
    const repo_dir = path.join(global.appRoot, 'repos', username, repo_name)
    const git = simpleGit(repo_dir)
    const commands = [
        'ls-tree',
        '--abbrev',
        '--format={"objectId":"%(objectname)","type":"%(objecttype)","name":"%(path)"},',
        '-t',
        hash,
    ]
    let result = await git.raw(...commands)
    result = '[' + result.substring(0, result.length - 2) + ']'
    let git_objects: ls_tree_object[] = JSON.parse(result)
    return git_objects
}

export async function lsTree_Directory(username: string, repo_name: string, hash: string, filepath: string) {
    const repo_dir = path.join(global.appRoot, 'repos', username, repo_name)
    const git = simpleGit(repo_dir)
    const commands = [
        'ls-tree',
        '--abbrev',
        '--format={"objectId":"%(objectname)","type":"%(objecttype)","name":"%(path)"},',
        hash,
        filepath + '/'
    ]
    let result = await git.raw(...commands)
    result = '[' + result.substring(0, result.length - 2) + ']'
    let git_objects: ls_tree_object[] = JSON.parse(result)
    git_objects.forEach(value => {
        value.name = value.name?.replace(`${filepath}/`, '')
    })
    
    return git_objects
}

export async function lsTree_Object(username: string, repo_name: string, hash: string, filepath: string) {
	const repo_dir = path.join(global.appRoot, 'repos', username, repo_name)
    const git = simpleGit(repo_dir)
    const commands = [
        'ls-tree',
        hash,
        filepath,
        '--abbrev',
        '--format={"objectId":"%(objectname)","type":"%(objecttype)","path":"%(path)"}'
    ]
    let result = await git.raw(...commands)
    if (result === '')
        return ''
    let git_objects: ls_tree_object = JSON.parse(result)
    return git_objects
}

export async function show_File(username: string, repo_name: string, objectId: string) {
    const repo_dir = path.join(global.appRoot, 'repos', username, repo_name)
    const git = simpleGit(repo_dir)
    return await git.show([objectId])
}
