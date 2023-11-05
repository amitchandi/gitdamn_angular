import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  async getUsers() : Promise<GD_User[]> {
    const response = await fetch('http://localhost:4000/users',
    {
      cache: 'no-cache'
    })
    return response.json()
  }
  
  async getUserRepos(username: string) {
    const response = await fetch(`http://localhost:4000/${username}`,
    {
      cache: 'no-cache'
    })
    return response.json()
  }

  async registerUser(data: any) {
    const response = await fetch('http://localhost:4000/users/create',
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