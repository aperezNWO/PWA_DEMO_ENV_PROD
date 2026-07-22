import { Component, signal        } from '@angular/core';
import { Groq                     } from 'groq-sdk';
import { BaseReferenceComponent   } from 'src/app/_components/base-reference/base-reference.component';
import { PAGE_MISCELANEOUS_LLM_TESTING, PAGE_TITLE_LOG, PAGE_TITLE_NO_SOUND } from 'src/app/_models/common';

@Component({
  selector: 'app-LLMTesting',
  templateUrl: './LLMTesting.component.html',
  styleUrls: ['./LLMTesting.component.css'],
  providers: [{ provide: PAGE_TITLE_LOG, useValue: PAGE_MISCELANEOUS_LLM_TESTING }],
  standalone: false 
})
export class LLMTesting  extends BaseReferenceComponent  {
  apiKey = signal<string>('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');
  prompt = signal<string>('List of the best programming languages in 2026 - Stack Overflow or TIOBE');
  responseStream = signal<string>('');
  isLoading = signal<boolean>(false);

  async testGroq() {
    const key = this.apiKey().trim();
    const promptText = this.prompt().trim();

    if (!key) {
      alert('Please, introduce your Groq API Key.');
      return;
    }

    this.isLoading.set(true);
    this.responseStream.set('Connecting and getting response from Groq API...');

    try {
      const groq = new Groq({
        apiKey: key,
        dangerouslyAllowBrowser: true // Requerido para ejecución en cliente web
      });

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: promptText
          }
        ],
        model: 'openai/gpt-oss-120b',
        temperature: 1,
        max_completion_tokens: 2048,
        top_p: 1,
        stream: true,
        reasoning_effort: 'medium',
        stop: null
      });

      this.responseStream.set(''); // Limpiar antes de recibir el stream

      for await (const chunk of chatCompletion) {
        const content = chunk.choices[0]?.delta?.content || '';
        // Actualizamos la señal acumulando el texto en tiempo real
        this.responseStream.update(current => current + content);
      }
    } catch (error: any) {
      console.error(error);
      this.responseStream.set('Error: ' + error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  clearApiKey() {
    this.apiKey.set('');
  }

  clearPrompt() {
    this.prompt.set('');
  }

  clearResults() {
    this.responseStream.set('');
  }
}