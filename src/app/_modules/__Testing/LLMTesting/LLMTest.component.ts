import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Groq } from 'groq-sdk';

@Component({
  selector: 'app-LLMTest',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './LLMTest.component.html',
  styleUrls: ['./LLMTest.component.css']
})
export class LLMTest {
  apiKey = signal<string>('');
  prompt = signal<string>('Escribe un poema corto sobre la programacion');
  responseStream = signal<string>('');
  isLoading = signal<boolean>(false);

  async testGroq() {
    const key = this.apiKey().trim();
    const promptText = this.prompt().trim();

    if (!key) {
      alert('Por favor, introduce tu API Key de Groq.');
      return;
    }

    this.isLoading.set(true);
    this.responseStream.set('Conectando y generando respuesta...');

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
}