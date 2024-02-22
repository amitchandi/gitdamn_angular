import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  async getUsers() : Promise<GD_User[]> {
    const response = await fetch(`${environment.apiUrl}/users`,
    {
      cache: 'no-cache',
      credentials: 'include',
    })
    return response.json()
  }
  
  async getUserRepos(username: string) {
    const response = await fetch(`${environment.apiUrl}/${username}`,
    {
      cache: 'no-cache',
      credentials: 'include',
    })
    return response
  }

  async registerUser(data: any) {
    const response = await fetch(`${environment.apiUrl}/users/create`,
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