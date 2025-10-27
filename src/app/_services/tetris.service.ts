// src/app/tetris/tetris.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AIMove {
  action: number;
  action_name: string;
  q_values: number[];
}

@Injectable({ providedIn: 'root' })
export class TetrisService {
  private apiUrl = 'https://sxcqd6-8000.csb.app/api/tetris/move/';

  constructor(private http: HttpClient) {}

  getAIMove(board: number[][]): Observable<AIMove> {
    return this.http.post<AIMove>(this.apiUrl, { board });
  }
}