import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class RepositoryService {
  private requestInit: any = {
    cache: "no-cache",
    credentials: "include",
  };

  async createRepository(username: string, data: any) {
    const url = `${environment.apiUrl}/${username}/new_repo`;
    const response = await fetch(url, {
      cache: "no-cache",
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return response;
  }

  async getBranches(username: string, repositoryName: string) {
    const url = `${environment.apiUrl}/${username}/${repositoryName}/branches`;
    const response = await fetch(url, this.requestInit);
    return response.json();
  }

  async getCurrentBranch(username: string, repositoryName: string) {
    const branches = await this.getBranches(username, repositoryName);
    return branches.current;
  }

  async getDirectoryObjects(
    isRoot: boolean,
    username: string,
    repo_name: string,
    hash: string,
    repo_objects: string[],
  ) {
    let url = `${environment.apiUrl}/${username}/${repo_name}/ls_tree/dir/${hash}`;
    if (!isRoot) url += `/${repo_objects.join("%2F")}`;
    const res = await fetch(url, this.requestInit);
    if (!res.ok) {
      console.log(await res.text());
      return "404";
    }
    return await res.json();
  }

  async getFileContent(
    username: string,
    repo_name: string,
    hash: string,
    filepath: string[],
  ) {
    const url = `${environment.apiUrl}/${username}/${repo_name}/show/${hash}/${filepath.join("%2F")}`;
    const res = await fetch(url, this.requestInit);

    if (!res.ok) {
      console.log(await res.text());
      return "404";
    }

    return await res.json();
  }

  async getRepositoryObjectInfo(
    isRoot: boolean,
    username: string,
    repo_name: string,
    hash: string,
    filepath: string[],
  ): Promise<RepositoryObjectInfo | null> {
    let url = `${environment.apiUrl}/${username}/${repo_name}/ls_tree/object/${hash}`;
    if (!isRoot) url += `/${filepath.join("%2F")}`;
    const res = await fetch(url, this.requestInit);

    if (!res.ok) {
      console.log(await res.json());
    }

    const result = await res.json();

    if (result === "") return null;

    return result;
  }

  async getRepositoryLatestCommitInfo(
    username: string,
    repositoryName: string,
    branch: string | undefined = undefined,
  ) {
    let url = `${environment.apiUrl}/${username}/${repositoryName}/log`;
    if (branch) url += `/${branch}`;

    const res = await fetch(url, this.requestInit);

    if (res.status == 204) {
      return {
        hash: "",
        "abbreviated hash": "",
        date: "",
        message: "",
        refs: "",
        body: "",
        author_name: "",
        author_email: "",
      };
    }

    const jsonData = await res.json();
    const latestCommit: CommitInfo = jsonData.latest;
    return latestCommit;
  }

  async getRepositoryObjectCommitInfo(
    username: string,
    repositoryName: string,
    branch: string,
    filename: string,
  ) {
    const url = `${environment.apiUrl}/${username}/${repositoryName}/log/${branch}/${filename}`;

    const res = await fetch(url, this.requestInit);

    const jsonData = await res.json();
    const result: CommitInfo[] = jsonData;
    return result;
  }

  async getRepositoryInfo(username: string, repositoryName: string) {
    const url = `${environment.apiUrl}/${username}/${repositoryName}`;

    const res = await fetch(url, this.requestInit);

    const result: Repository = await res.json();
    return result;
  }

  async changeRepositoryVisibility(username: string, repositoryName: string) {
    const url = `${environment.apiUrl}/${username}/${repositoryName}/changeVisibility`;
    const init: RequestInit = {
      method: "PUT",
      cache: "no-cache",
      credentials: "include",
    };
    const res = await fetch(url, init);
    return res.ok;
  }

  async changeRepositoryName(
    username: string,
    repositoryName: string,
    newName: string,
  ) {
    const url = `${environment.apiUrl}/${username}/${repositoryName}/changeName`;
    const init: RequestInit = {
      method: "PUT",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newName,
      }),
    };
    const res = await fetch(url, init);
    return res.ok;
  }

  async changeRepositoryOwnership(
    username: string,
    repositoryName: string,
    targetUsername: string,
  ) {
    const url = `${environment.apiUrl}/${username}/${repositoryName}/changeOwnership`;
    const init: RequestInit = {
      method: "PUT",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target_username: targetUsername,
      }),
    };
    const res = await fetch(url, init);
    return res.ok;
  }

  async deleteRepository(username: string, repositoryName: string) {
    const url = `${environment.apiUrl}/${username}/${repositoryName}`;
    const init: RequestInit = {
      method: "DELETE",
      cache: "no-cache",
      credentials: "include",
    };
    const res = await fetch(url, init);
    return res.ok;
  }

  async addUserToAccessList(
    username: string,
    repositoryName: string,
    accessListEntry: RepoAccess,
  ) {
    const url = `${environment.apiUrl}/${username}/${repositoryName}/addUser`;
    const init: RequestInit = {
      method: "PUT",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(accessListEntry),
    };
    const res = await fetch(url, init);
    return res.ok;
  }

  async changeUserPermissionInAccessList(
    username: string,
    repositoryName: string,
    accessListEntry: RepoAccess,
  ) {
    const url = `${environment.apiUrl}/${username}/${repositoryName}/changeUserPermission`;
    const init: RequestInit = {
      method: "PUT",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(accessListEntry),
    };
    const res = await fetch(url, init);
    return res.ok;
  }

  async deleteUserFromAccessList(
    username: string,
    repositoryName: string,
    accessListEntry: RepoAccess,
  ) {
    const url = `${environment.apiUrl}/${username}/${repositoryName}/removeUser`;
    console.log(accessListEntry);
    const init: RequestInit = {
      method: "PUT",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(accessListEntry),
    };
    const res = await fetch(url, init);
    return res.ok;
  }
}

export interface CommitInfo {
  hash: string;
  "abbreviated hash": string | undefined;
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

export interface Repository {
  _id: string;
  name: string;
  owner: string;
  visibility: string;
  accessList: RepoAccess[];
}

export interface RepoAccess {
  username: string;
  permission: string;
}
