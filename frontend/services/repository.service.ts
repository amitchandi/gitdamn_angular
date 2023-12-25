import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RepositoryService {

  no_cache: any = {
    cache: 'no-cache'
  }

  async getBranches(username: string, repositoryName: string) {
    const url = `${environment.apiUrl}/${username}/${repositoryName}/branches`
    const response = await fetch(url, this.no_cache)
    return response.json()
  }

  async getCurrentBranch(username: string, repositoryName: string) {
    const branches = await this.getBranches(username, repositoryName)
    return branches.current
  }

  async getRepositoryData(username: string, repositoryObjects: string[]) {
    const url = `${environment.apiUrl}/${username}/${repositoryObjects.join('/')}`
    const res = await fetch(url, this.no_cache)
    if (!res.ok) {
      return {
        type: '404',
        body: null
      }
    }
    const contentType = res.headers.get('type') as string
    
    if (contentType === 'file') {
      let fileContents: Array<any> = []
      for await (const line of makeTextFileLineIterator(res.body?.getReader())) {
        fileContents.push(line)
      }
      return {
        type: contentType,
        body: fileContents
      }
    }

    return {
      type: contentType,
      body: await res.json()
    }
  }

  async getDirectoryObjects(isRoot: boolean, username: string, repo_name: string, hash: string, repo_objects: string[]) {
    let url = `${environment.apiUrl}/${username}/${repo_name}/ls_tree/dir/${hash}`
    if (!isRoot)
      url += `/${repo_objects.join('%2F')}`
    const res = await fetch(url, this.no_cache)
    if (!res.ok) {
      console.log(await res.text())
      return '404'
    }
    return await res.json()
  }

  async getFileContent(username: string, repo_name: string, hash: string, filepath: string[]) {
    const url = `${environment.apiUrl}/${username}/${repo_name}/show/${hash}/${filepath.join('%2F')}`
    const res = await fetch(url, this.no_cache)

    if (!res.ok) {
      console.log(await res.text())
      return '404'
    }

    return await res.json()
  }

  async getRepositoryObjectInfo(isRoot: boolean, username: string, repo_name: string, hash: string, filepath: string[]) : Promise<RepositoryObjectInfo | null> {
    let url = `${environment.apiUrl}/${username}/${repo_name}/ls_tree/object/${hash}`
    if (!isRoot)
      url += `/${filepath.join('%2F')}`
    const res = await fetch(url, this.no_cache)

    if (!res.ok) {
      console.log(await res.json())
    }

    const result = await res.json()
    
    if (result === '')
      return null

    return result
  }

  async getRepositoryLatestCommitInfo(username: string, repositoryName: string, branch: string | undefined) {
    let url = `${environment.apiUrl}/${username}/${repositoryName}/log`
    if (branch)
      url += `/${branch}`

    const res = await fetch(url, this.no_cache)

    const jsonData = await res.json()
    const latestCommit: CommitInfo = jsonData.latest
    return latestCommit
  }

  async getRepositoryObjectCommitInfo(username: string, repositoryName: string, branch: string, filename: string) {
    let url = `${environment.apiUrl}/${username}/${repositoryName}/log/${branch}/${filename}`

    const res = await fetch(url, this.no_cache)

    const jsonData = await res.json()
    const result: CommitInfo[] = jsonData
    return result
  }
}

async function* makeTextFileLineIterator(reader: any) {
  const utf8Decoder = new TextDecoder("utf-8");
  let { value: chunk, done: readerDone } = await reader.read();
  chunk = chunk ? utf8Decoder.decode(chunk) : "";

  const newline = /\r?\n/gm;
  let startIndex = 0;

  while (true) {
    const result = newline.exec(chunk);
    if (!result) {
      if (readerDone) break;
      const remainder = chunk.substr(startIndex);
      ({ value: chunk, done: readerDone } = await reader.read());
      chunk = remainder + (chunk ? utf8Decoder.decode(chunk) : "");
      startIndex = newline.lastIndex = 0;
      continue;
    }
    yield chunk.substring(startIndex, result.index);
    startIndex = newline.lastIndex;
  }

  if (startIndex < chunk.length) {
    // Last line didn't end in a newline char
    yield chunk.substr(startIndex);
  }
}

export interface CommitInfo {
  hash: string;
  "abbreviated hash": string | undefined
  date: string;
  message: string;
  refs: string;
  body: string;
  author_name: string;
  author_email: string;
}

export interface RepositoryObjectInfo {
  objectId: string;
  type: string;
  path: string;
}