import { Component } from '@angular/core';
//
@Component({
  selector: 'app-files-generation-zip',
  templateUrl: './files-generation-zip.component.html',
  styleUrls: ['./files-generation-zip.component.css']
})
//
export class FilesGenerationZIPComponent {
    //--------------------------------------------------------------------------
    // PROPIEDADES COMUNES
    //--------------------------------------------------------------------------
    pageTitle            : string = '[GENERAR ARCHIVO ZIP]';
    //
    static pageTitle()   : string {
      return '[GENERAR ARCHIVOS ZIP]';
    }
}
