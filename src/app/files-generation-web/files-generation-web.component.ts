import { Component } from '@angular/core';
//
@Component({
  selector: 'app-files-generation-web',
  templateUrl: './files-generation-web.component.html',
  styleUrls: ['./files-generation-web.component.css']
})
//
export class FilesGenerationWebComponent {
  //
  pageTitle            : string = '[GENERAR ARCHIVOS]';
  //
  static pageTitle()   : string {
    return '[GENERAR ARCHIVOS]';
  }
}