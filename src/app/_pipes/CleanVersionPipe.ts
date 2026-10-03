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

    // 2. Strip surrounding brackets if present: v[Swift 6.0+] -> Swift 6.0+
    cleaned = cleaned.replace(/^v?\[(.*?)\]$/gi, '$1');

    // 3. Remove language/framework text prefixes (e.g., "Swift", "Vapor Server", "go", "Edition")
    cleaned = cleaned.replace(/^(Swift|Vapor\s+Server|go|Edition)\s*/i, '');

    // 4. Remove internal framework/suffix tags
    cleaned = cleaned.replace(/-http$/i, '');

    // 5. Strip any remaining leading 'v' or 'v.' (e.g., "v4.x" -> "4.x")
    cleaned = cleaned.replace(/^v+/i, '');

    // 6. Strip trailing '+' or build flags (e.g., "6.0+" -> "6.0")
    cleaned = cleaned.replace(/\+$/, '');

    // 7. Strip build/platform metadata starting at '(' or '['
    cleaned = cleaned.replace(/[\(\[].*$/, '');

    // 8. Final trim for any remaining whitespace
    return cleaned.trim();
  }
}
