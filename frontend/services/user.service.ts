import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  backendURL: string = ''

  constructor() {
    this.backendURL = `${location.protocol}//${location.hostname}:4000`
  }

  async getUsers() : Promise<GD_User[]> {
    const response = await fetch(`${this.backendURL}/users`,
    {
      cache: 'no-cache'
    })
    return response.json()
  }
  
  async getUserRepos(username: string) {
    const response = await fetch(`${this.backendURL}/${username}`,
    {
      cache: 'no-cache'
    })
    return response.json()
  }

  async registerUser(data: any) {
    const response = await fetch(`${this.backendURL}/users/create`,
    {
      method: 'POST',
      cache: 'no-cache',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })

    return response
  }

}

export interface GD_User {
  _id: string;
  email: string;
  username: string;
  role: string;
}