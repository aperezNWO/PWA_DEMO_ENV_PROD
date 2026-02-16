// angular core modules
import { Injectable, inject                 } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
// services
import { BaseService   }    from '../__baseService/base.service';
import { ConfigService }    from '../__Utils/ConfigService/config.service';
// third party
import html2canvas          from 'html2canvas';
import jsPDF                from 'jspdf';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PdfService extends BaseService {
  // v21 preferred injection pattern
  private readonly http = inject(HttpClient);
  private readonly _configService = inject(ConfigService);

  constructor() {
    super();
  }

  /**
   * Preserved Signature: Original logic updated with async/await internally
   */
  getPdf(pageTitle: string, c_canvas: any, divCanvas_Pdf: any, fileName: string, observer: any): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const finalFileName = `${fileName}_${timestamp}.pdf`;

    const areaToPrint = c_canvas.nativeElement;
    const borderToPrint = divCanvas_Pdf.nativeElement;

    // We use a self-invoking async function to handle the promise while 
    // keeping the outer function return type as 'void'
    (async () => {
      try {
        const canvas = await html2canvas(areaToPrint);
        
        const w: number = borderToPrint.offsetWidth;
        const h: number = borderToPrint.offsetHeight;
        const imgData: string = canvas.toDataURL('image/jpeg', 0.95);

        const pdfDoc: jsPDF = new jsPDF("landscape", "px", [w, h]);
        pdfDoc.addImage(imgData, 'JPEG', 0, 0, w, h);
        
        pdfDoc.save(finalFileName);

        // Notify the observer
        observer.next(finalFileName);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    })();
  }

  /**
   * Preserved Signature: Uses the updated getPdf
   */
  public _GetPDF(pageTitle: string, c_canvas: any, divCanvas_Pdf: any, fileName: string): Observable<string> {
    return new Observable<string>((observer) => 
      this.getPdf(pageTitle, c_canvas, divCanvas_Pdf, fileName, observer)
    );
  }

  /**
   * Preserved Signature: Backend PDF Generation
   */
  public GetPDF(subjectName: string | undefined): Observable<HttpEvent<any>> {
    const baseUrl = this._configService.getConfigValue('baseUrlNetCore');
    const p_url = `${baseUrl}api/PDFManager/GetPdf?subjectName=${subjectName}`;

    // HttpRequest remains the standard for progress reporting in v21
    const req = new HttpRequest('GET', p_url, {
      reportProgress: true,
      responseType: 'text',
    });

    return this.http.request<any>(req);
  }
}