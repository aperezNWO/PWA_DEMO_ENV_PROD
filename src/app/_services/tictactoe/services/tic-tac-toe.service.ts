import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { _environment } from 'src/environments/environment';

export interface TicTacToeResult {
  finalBoard: number[];
  moves: number[];
  winner: number;
  moveCount: number;
  history: number[][];
}

@Injectable({ providedIn: 'root' })
export class TicTacToeService {
  //private readonly apiUrl = 'https://tensorflownetcore64.tryasp.net/api/tictactoe/play';
  private readonly apiUrl = `${this.getConfigValue('baseUrlNetCoreCPPEntry')}api/tictactoe/play`;

  constructor(private http: HttpClient) {}

  playGame(): Observable<TicTacToeResult> {
    return this.http.get<TicTacToeResult>(this.apiUrl);
  }
  //
  getConfigValue(key: string) {
    //
    let jsonData : string = JSON.parse(JSON.stringify(_environment.externalConfig))[key];
    //
    return jsonData;
    }
}