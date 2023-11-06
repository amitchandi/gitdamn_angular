import { Injectable } from '@angular/core';
import { RepositoryObject } from 'src/app/username/username.component';

@Injectable({
  providedIn: 'root'
})
export class RepositoryService {
  backendURL: string = ''

  constructor() {
    this.backendURL = `${location.protocol}//${location.hostname}:4000`
  }

  async getBranches(username: string, repositoryName: string) {
    const response = await fetch(`${this.backendURL}/${username}/${repositoryName}/branches`,
    {
      cache: 'no-cache'
    })
    return response.json()
  }

  async getCurrentBranch(username: string, repositoryName: string) {
    const branches = await this.getBranches(username, repositoryName)
    return branches.current
  }

  async getRepositoryData(username: string, repositoryObjects: string[]) {
    const res = await fetch(
      `${this.backendURL}/${username}/${repositoryObjects.join('/')}`,
      {
        cache: 'no-cache'
      }
    )
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

  async getRepositoryLatestCommitInfo(username: string, repositoryName: string, branch: string | undefined) {
    let url = `${this.backendURL}/${username}/${repositoryName}/log`
    if (branch)
      url += `/${branch}`

    const res = await fetch(url,
      {
        cache: 'no-cache'
      }
    )

    const jsonData = await res.json()
    const latestCommit: CommitInfo = jsonData.latest
    return latestCommit
  }

  async getRepositoryObjectInfo(username: string, repositoryName: string, branch: string, filename: string) {
    let url = `http://localhost:4000/${username}/${repositoryName}/log/${branch}/${filename}`

    const res = await fetch(url,
      {
        cache: 'no-cache'
      }
    )

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