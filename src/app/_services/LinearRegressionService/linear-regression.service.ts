// src/app/services/apollo-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PredictionRequest {
  mission_number: number;
}

export interface PredictionResponse {
  input_mission_number: number;
  predicted_total_time_hours: number;
  predicted_duration_days: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApolloApiService {

  // Use the exact URL from your curl command
  private apiUrl = 'https://6rtfk8-8000.csb.app/predict/'; 

  constructor(private http: HttpClient) { }

  predictTime(missionNumber: number): Observable<PredictionResponse> {
    const body: PredictionRequest = { mission_number: missionNumber };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<PredictionResponse>(this.apiUrl, body, { headers });
  }
}
