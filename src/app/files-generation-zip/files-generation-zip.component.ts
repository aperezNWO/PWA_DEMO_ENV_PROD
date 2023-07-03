import { Component, OnInit                   } from '@angular/core';
import { HttpEventType, HttpResponse         } from '@angular/common/http';
import { Observable                          } from 'rxjs';
import { MCSDService                         } from '../mcsd.service';
//
@Component({
  selector: 'app-files-generation-zip',
  templateUrl: './files-generation-zip.component.html',
  styleUrls: ['./files-generation-zip.component.css']
})
//
export class FilesGenerationZIPComponent implements OnInit {
    //--------------------------------------------------------------------------
    // PROPIEDADES COMUNES
    //--------------------------------------------------------------------------
    pageTitle            : string = '[GENERAR ARCHIVO ZIP]';
    static pageTitle()   : string {
      return '[GENERAR ARCHIVOS ZIP]';
    }
    //
    //--------------------------------------------------------------------------
    // PROPIEDADES - FILE UPLOAD COMPONENT
    //--------------------------------------------------------------------------
    selectedFiles?         : FileList;
    currentFile?           : File;
    progress               : number  = 0;
    message                : string  = '';
    fileInfos?             : Observable<any>;
    //--------------------------------------------------------------------------
    // EVENT HANDLERS / CONSTRUCTORS  
    //--------------------------------------------------------------------------
    constructor(private mcsdService: MCSDService) {
      //
    }
    //
    ngOnInit(): void {
      //
      //this.fileInfos = this.mcsdService.getFiles();
    }  
    //--------------------------------------------------------------------------
    // METODOS - FILE UPLOAD COMPONENT
    //--------------------------------------------------------------------------
    selectFile(event: any): void {
      this.selectedFiles = event.target.files;
    }
    //
    upload(): void {
      //  
      this.progress = 0;
      //
      if (this.selectedFiles) {
        const file: File | null = this.selectedFiles.item(0);
        //
        if (file) {
          //
          this.currentFile = file;
          //
          this.mcsdService.upload(this.currentFile).subscribe({
            next: (event: any) => {
              if (event.type === HttpEventType.UploadProgress) 
              {
                //
                this.progress = Math.round(100 * event.loaded / event.total);
              } 
              else if (event instanceof HttpResponse) 
              {
                //
                console.log("RESPONSE : " + event);
                //
                this.message = event.body.message;
                //this.fileInfos = this.mcsdService.getFiles();
              }
            },
            error: (err: any) => {
              //
              console.log(err);
              this.progress = 0;
              //  
              if (err.error && err.error.message) 
              {
                //
                this.message = err.error.message;
              } 
              else 
              {
                //
                this.message = 'Could not upload the file!';
              }
              //
              this.currentFile = undefined;
            }
          });
        }
        //
        this.selectedFiles = undefined;
      }
  }
}
