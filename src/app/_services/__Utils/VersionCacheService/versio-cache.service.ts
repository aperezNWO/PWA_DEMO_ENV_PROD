/* app-core/services/version-cache.service.ts */
import { Injectable, OnDestroy } from '@angular/core';
import { Observable, shareReplay, of, map, catchError, forkJoin, interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
// CUSTOM LIBRARIES
import { ComputerVisionService } from '../../__AI/ComputerVisionService/Computer-Vision.service';
import { OCRService } from '../../__AI/OCRService/ocr.service';
import { TensorFlowService } from '../../__AI/TensorflowService/tensor-flow.service';
import { AlgorithmService } from '../../AlgorithmService/algorithm.service';
import { BackendService } from '../../BackendService/backend.service';
import { ConfigService } from '../ConfigService/config.service';

export interface VersionBundle {
  javaVersion     : string;
  webApiApp       : string;
  algorithmApp    : string;
  algorithmCpp    : string;
  aspNetCoreCpp   : string;
  openCvApp       : string;
  openCvApi       : string;
  openCvCpp       : string;
  tesseractApp    : string;
  tesseractApi    : string;
  tesseractCpp    : string;
  tfApp           : string;
  tfApi           : string;
  tfCpp           : string;
}

@Injectable({ providedIn: 'root' })
export class VersionCacheService implements OnDestroy {
  readonly versions$: Observable<VersionBundle>;
  private pingerSubscription: Subscription | undefined;

  constructor(
    private cfg: ConfigService,
    private back: BackendService,
    private algo: AlgorithmService,
    private ocr: OCRService,
    private cv: ComputerVisionService,
    private tf: TensorFlowService
  ) {
    this.versions$ = this.loadAll().pipe(shareReplay(1));
    this.startHeartbeat();
  }

  private loadAll(): Observable<VersionBundle> {
    return forkJoin({
      javaVersion     : this.back.getJavaVersion(),
      webApiApp       : this.back._GetWebApiAppVersion(),
      algorithmApp    : this.algo._Algorithm_GetAppVersion(),
      algorithmCpp    : this.algo._Algorithm_GetCPPSTDVersion(),
      aspNetCoreCpp   : this.back._GetASPNETCoreCppVersion(),
      tesseractApp    : this.ocr._GetTesseract_AppVersion(),
      tesseractApi    : this.ocr._GetTesseract_APIVersion(),
      tesseractCpp    : this.ocr._GetTesseract_CPPSTDVersion(),
      openCvApp       : this.cv._OpenCv_GetAppVersion(),
      openCvApi       : this.cv._OpenCv_GetAPIVersion(),
      openCvCpp       : this.cv._OpenCv_GetCPPSTDVersion(),
      tfApp           : this.tf._GetTensorFlowAPPVersion(),
      tfApi           : this.tf._GetTensorFlowAPIVersion(),
      tfCpp           : this.tf._TensorFlow_GetCPPSTDVersion()
    }).pipe(
      map(v => {
        localStorage.setItem('version-cache', JSON.stringify(v));
        return v;
      }),
      catchError(() => {
        const raw = localStorage.getItem('version-cache');
        return raw ? of(JSON.parse(raw) as VersionBundle) : of({} as VersionBundle);
      })
    );
  }

  private startHeartbeat() {
    /* Ping every 10 minutes (600,000ms) to keep the Render instance active */
    this.pingerSubscription = interval(600000)
      .pipe(
        switchMap(() => this.back.getJavaVersion())
      )
      .subscribe({
        next: (version) => console.log(`[Heartbeat] Server active, Java version: ${version}`),
        error: (err) => console.error('[Heartbeat] Ping failed', err)
      });
  }

  ngOnDestroy() {
    if (this.pingerSubscription) {
      this.pingerSubscription.unsubscribe();
    }
  }
}