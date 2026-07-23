import { Component, signal        } from '@angular/core';
import { Groq                     } from 'groq-sdk';
import { BaseReferenceComponent   } from 'src/app/_components/base-reference/base-reference.component';
import { PAGE_MISCELANEOUS_LLM_TESTING, PAGE_TITLE_LOG, PAGE_TITLE_NO_SOUND } from 'src/app/_models/common';

interface GroqModel {
  id: string;
  name: string;
  isGptOss?: boolean;
  isCompound?: boolean;
  isAudio?: boolean;
}

@Component({
  selector: 'app-LLMApiTesting',
  templateUrl: './LLMApiTesting.component.html',
  styleUrls: ['./LLMApiTesting.component.css'],
  providers: [{ provide: PAGE_TITLE_LOG, useValue: PAGE_MISCELANEOUS_LLM_TESTING }],
  standalone: false 
})
export class LLMApiTestingComponent  extends BaseReferenceComponent  {
  apiKey = signal<string>('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');
  prompt = signal<string>('Latest Stable C++ Version');
  responseStream = signal<string>('');
  isLoading = signal<boolean>(false);

  // Complete model inventory matching Groq specifications
  models: GroqModel[] = [
    { id: 'qwen/qwen3.6-27b'   , name: 'Qwen 3.6 27B (Web Search)'                   , isCompound : true   },
    //{ id: 'groq/compound'      , name: 'Groq Compound (Managed Web Search & Tools)'  , isCompound : true   }, // OVERFLOWS RATE LIMITS
    { id: 'groq/compound-mini' , name: 'Groq Compound Mini (Fast Tool Orchestration)', isCompound : true   },
    { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B (Native Browser Search)'        , isGptOss   : true   },
    { id: 'openai/gpt-oss-20b' , name: 'GPT-OSS 20B (Native Browser Search)'         , isGptOss   : true   },
    //{ id: 'canopylabs/orpheus-v1-english', name: 'Orpheus v1 English (TTS)' },  // DOES NOT SUPPORT CHAT COMPLETIONS
    //{ id: 'meta-llama/llama-prompt-guard-2-86m', name: 'Llama Prompt Guard 2 86M' },  // TEXT CLASSIFICATIONS DOES NOT SUPPORT STREAMING
    //{ id: 'meta-llama/llama-prompt-guard-2-22m', name: 'Llama Prompt Guard 2 22M' },  // TEXT CLASSIFICATIONS DOES NOT SUPPORT STREAMING 
    //{ id: 'whisper-large-v3', name: 'Whisper Large V3 (Speech-to-Text)', isAudio: true },      // NEEDS AUDIO FILE UPLOAD
    //{ id: 'whisper-large-v3-turbo', name: 'Whisper Large V3 Turbo (Fast STT)', isAudio: true } // NEEDS AUDIO FILE UPLOAD
  ];

  selectedModel = signal<string>(this.models[0].id);

  clearApiKey() {
    this.apiKey.set('');
  }

  clearPrompt() {
    this.prompt.set('');
  }

  clearResults() {
    this.responseStream.set('');
  }

  // Helper method to convert HTML elements and entities to plain text equivalents
  private convertHtmlToPlainText(htmlText: string): string {
    if (!htmlText) return '';

    // 1. Replace various forms of <br> tags with a newline character
    let processed = htmlText.replace(/<br\s*[\/]?>/gi, '\n');

    // 2. Decode HTML entities and strip unwanted HTML tags safely using DOMParser
    const doc = new DOMParser().parseFromString(processed, 'text/html');
    let plainText = doc.documentElement.textContent || '';

    // 3. Clean up search citation artifacts if present
    plainText = plainText.replace(/【\d+†[^\】]*】/g, '').trim();

    return plainText;
  }

  //
  async testGroq() {
    if (!this.apiKey() || !this.prompt()) return;

    this.isLoading.set(true);
    this.responseStream.set('');

    const currentModelId = this.selectedModel();
    const modelConfig = this.models.find(m => m.id === currentModelId);

    if (modelConfig?.isAudio) {
      this.responseStream.set('Note: Whisper speech-to-text models require an audio file upload payload (FormData), not a text prompt.');
      this.isLoading.set(false);
      return;
    }

    const payload: any = {
      model                 : currentModelId,
      messages              : [{ role: 'user', content: this.prompt() }],
      max_completion_tokens : 1024,
    };

    if (modelConfig?.isGptOss) {
      payload.stream                = false;
      payload.tool_choice           = 'auto';
      payload.tools                 = [{ type: 'browser_search' }];
      payload.reasoning_effort      = 'low';
      payload.temperature           = 1;
    } else if (modelConfig?.isCompound) {
      payload.stream = false;
    } else {
      payload.stream                = true;
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      if (modelConfig?.isGptOss || modelConfig?.isCompound) {
        const data    = await response.json();
        const content = data.choices?.[0]?.message?.content ?? '';
        const clean   = this.convertHtmlToPlainText(content);
        this.responseStream.set(clean);
        this.isLoading.set(false);
      } else {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Response body reader not available');

        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const jsonStr = trimmed.replace('data: ', '');
              if (jsonStr === '[done]' || jsonStr === '[DONE]') continue;

              try {
                const parsed     = JSON.parse(jsonStr);
                const content    = parsed.choices?.[0]?.delta?.content || '';
                accumulatedText += content;
                // Parse and format stream chunks to handle HTML tags/entities gracefully
                this.responseStream.set(this.convertHtmlToPlainText(accumulatedText));
              } catch (e) {
                // Ignore parsing errors on partial chunks
              }
            }
          }
        }
        this.isLoading.set(false);
      }
    } catch (error: any) {
      this.responseStream.set(`Error: ${error.message || error}`);
      this.isLoading.set(false);
    }
  }
}