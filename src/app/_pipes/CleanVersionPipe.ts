import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cleanVersion',
  standalone: true
})
export class CleanVersionPipe implements PipeTransform {
  transform(rawVersion: string): string {
    if (!rawVersion) return '0.0.0';

    // 1. Convert to string and trim surrounding whitespace
    let cleaned = String(rawVersion).trim();

    // 2. Strip surrounding brackets if present: v[2021] -> 2021
    cleaned = cleaned.replace(/^v?\[(.*?)\]$/gi, '$1');

    // 3. Remove language-specific or textual prefixes
    cleaned = cleaned.replace(/^go/i, '');
    cleaned = cleaned.replace(/^Edition\s*/i, ''); // Strip "Edition " cleanly including trailing spaces

    // 4. Remove internal framework/suffix tags
    cleaned = cleaned.replace(/-http$/i, '');

    // 5. Strip any remaining leading 'v'
    cleaned = cleaned.replace(/^v+/i, '');

    // 6. Strip build/platform metadata starting at the first '(' or '['
    // e.g. "3.12.14(main...)" -> "3.12.14"
    // e.g. "3.13.3(stable)..." -> "3.13.3"
    cleaned = cleaned.replace(/[\(\[].*$/, '');

    // 7. Final trim for any remaining whitespace
    return cleaned.trim();
  }
}
