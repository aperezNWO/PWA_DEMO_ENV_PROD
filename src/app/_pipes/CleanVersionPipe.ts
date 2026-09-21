import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cleanVersion',
  standalone: true
})
export class CleanVersionPipe implements PipeTransform {
  transform(rawVersion: string): string {
    if (!rawVersion) return '0.0.0';

    // 1. Convert to string and remove all whitespace characters (\s) globally
    let cleaned = String(rawVersion).replace(/\s+/g, '');

    // 2. Strip surrounding brackets if present: v[2021] -> 2021
    cleaned = cleaned.replace(/^v?\[(.*?)\]$/gi, '$1');

    // 3. Remove language-specific or textual prefixes
    cleaned = cleaned.replace(/^go/i, '');
    cleaned = cleaned.replace(/^Edition/i, '');

    // 4. Remove internal framework/suffix tags
    cleaned = cleaned.replace(/-http$/i, '');

    // 5. Strip any remaining leading 'v'
    cleaned = cleaned.replace(/^v+/i, '');

    return cleaned;
  }
}
