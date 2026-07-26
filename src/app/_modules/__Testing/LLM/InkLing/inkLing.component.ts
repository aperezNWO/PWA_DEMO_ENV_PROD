import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders   } from '@angular/common/http';
import { CommonModule              } from '@angular/common';
import { FormsModule               } from '@angular/forms';
import { BaseComponent } from 'src/app/_components/base/base.component';
import { PAGE_NOT_FOUND } from 'src/app/_models/common';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from 'src/app/_services/__Utils/ConfigService/config.service';
import { SpeechService } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { BackendService } from 'src/app/_services/BackendService/backend.service';

@Component({
  selector: 'inkLing-api-testing',
  templateUrl: './inkLing.component.html',
  styleUrls: ['./inkLing.component.css'],
  standalone: false,
})
export class inkLingComponent extends BaseComponent {

    private http = inject(HttpClient);

    // OpenRouter Endpoint
    // get key at : https://openrouter.ai/workspaces/default/keys
    apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    apiKey = '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'; // Must start with sk-or-v1-
    
    //
    prompt = 'Hello!';
    response = signal<string>('');
    loading = signal<boolean>(false);

    //
    constructor(
          configServivce : ConfigService,
          backendService : BackendService,
          route          : ActivatedRoute,
          speechService  : SpeechService,
      )
      {
          //
          super(configServivce,
                backendService,
                route,
                speechService,
                PAGE_NOT_FOUND,
          );
  }
  
  //
  testApi() {

    //
    if (!this.apiKey || this.apiKey.startsWith('tml-') && this.apiUrl.includes('openrouter.ai')) {
        alert('OpenRouter endpoint requires an OpenRouter key starting with "sk-or-v1-".');
        return;
      }

    this.loading.set(true);

    // Keep headers simple to prevent browser CORS preflight issues
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey.trim()}`
    });

    const body = {
      model: 'thinkingmachines/inkling',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: this.prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      // 🟢 Enable Real-Time Web Search across OpenRouter
      tools: [
          { type: 'openrouter:web_search' }
      ]   
    };

    this.http.post<any>(this.apiUrl, body, { headers }).subscribe({
      next: (res) => {
        
        const text    = res.choices?.[0]?.message?.content || JSON.stringify(res);
        const clean   = this.convertHtmlToPlainText(text);


        this.response.set(clean);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Request failed:', err);
        this.response.set(`Error (${err.status}): ${err.error?.error?.message || err.error?.message || err.message}`);
        this.loading.set(false);
      }
    });
  }
  //
  private convertHtmlToPlainText(htmlText: string): string {
    if (!htmlText) return '';

    // Only target explicit HTML line break tags, leaving code angle-brackets intact
    let processed = htmlText.replace(/<br\s*[\/]?>/gi, '\n');

    // Clean up search citation artifacts if present
    processed = processed.replace(/【\d+†[^\】]*】/g, '').trim();

    return processed;
  }
}