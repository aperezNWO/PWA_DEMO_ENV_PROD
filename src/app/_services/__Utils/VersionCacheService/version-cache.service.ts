/* app-core/services/version-cache.service.ts */
import {  Injectable
        , OnDestroy             } from '@angular/core';
import { Observable
       , BehaviorSubject
       , of
       , map
       , catchError
       , forkJoin
       , interval
       , Subscription          } from 'rxjs';
import { switchMap, timeout    } from 'rxjs/operators';
// CUSTOM LIBRARIES
import { ComputerVisionService } from '../../__AI/ComputerVisionService/Computer-Vision.service';
import { OCRService            } from '../../__AI/OCRService/ocr.service';
import { TensorFlowService     } from '../../__AI/TensorflowService/tensor-flow.service';
import { AlgorithmService      } from '../../AlgorithmService/algorithm.service';
import { BackendService        } from '../../BackendService/backend.service';
import { ConfigService         } from '../ConfigService/config.service';

export interface VersionBundle {
  pythonVersion       : string;
  nodeVersion         : string;
  nodeVersionOcr      : string;
  javaVersion         : string;
  webApiApp           : string;
  algorithmApp        : string;
  algorithmCpp        : string;
  aspNetCoreCpp       : string;
  openCvApp           : string;
  openCvApi           : string;
  openCvCpp           : string;
  tesseractApp        : string;
  tesseractApi        : string;
  tesseractCpp        : string;
  tfApp               : string;
  tfApi               : string;
  tfCpp               : string;
  zigVersion          : string;
  zigWebServerVersion : string;
}

@Injectable({ providedIn: 'root' })
export class VersionCacheService implements OnDestroy {

  // BehaviorSubject: push-based, no shareReplay race condition.
  // Seeded from localStorage so the first paint shows cached values immediately.
  private readonly _subject = new BehaviorSubject<VersionBundle>(
    this.readCache()
  );

  /** Components subscribe here. Always replays the latest known bundle. */
  readonly versions$: Observable<VersionBundle> = this._subject.asObservable();

  private fetchSub : Subscription | undefined;
  private heartSub : Subscription | undefined;

  constructor(
    private cfg : ConfigService,
    private back: BackendService,
    private algo: AlgorithmService,
    private ocr : OCRService,
    private cv  : ComputerVisionService,
    private tf  : TensorFlowService,
  ) {
    // Kick off real fetch immediately — no need to wait for a subscriber
    this.reload();
    this.startHeartbeat();
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Force a fresh fetch from all backends. Safe to call multiple times. */
  reload(): void {
    this.fetchSub?.unsubscribe();
    this.fetchSub = this.loadAll().subscribe({
      next : bundle => {
        console.log('[VersionCache] Bundle received:', bundle);
        this._subject.next(bundle);
      },
      error: err => console.error('[VersionCache] Unexpected error in loadAll():', err),
    });
  }

  // ── Core loader ─────────────────────────────────────────────────────────────

  private loadAll(): Observable<VersionBundle> {

    // Each HTTP call is individually guarded:
    //   timeout(8000) → if nothing emits in 8 s, throw TimeoutError
    //   catchError    → swallow any error (CORS, network, timeout) → emit fallback
    // This guarantees every inner observable completes, so forkJoin always emits.
    const safeSub = (obs$: Observable<string>, fallback = 'Offline'): Observable<string> =>
      obs$.pipe(
        timeout(8000),
        catchError(err => {
          console.warn('[VersionCache] Request failed:', err?.message ?? err);
          return of(fallback);
        }),
      );

    return forkJoin({
      pythonVersion       : safeSub(this.back.getPythonVersion()),
      nodeVersion         : safeSub(this.back.getNodeVersion()),
      nodeVersionOcr      : safeSub(this.back.getNodeVersionOcr()),
      javaVersion         : safeSub(this.back.getJavaVersion()),
      webApiApp           : safeSub(this.back._GetWebApiAppVersion()),
      algorithmApp        : safeSub(this.algo._Algorithm_GetAppVersion()),
      algorithmCpp        : safeSub(this.algo._Algorithm_GetCPPSTDVersion()),
      aspNetCoreCpp       : safeSub(this.back._GetASPNETCoreCppVersion()),
      tesseractApp        : safeSub(this.ocr._GetTesseract_AppVersion()),
      tesseractApi        : safeSub(this.ocr._GetTesseract_APIVersion()),
      tesseractCpp        : safeSub(this.ocr._GetTesseract_CPPSTDVersion()),
      openCvApp           : safeSub(this.cv._OpenCv_GetAppVersion()),
      openCvApi           : safeSub(this.cv._OpenCv_GetAPIVersion()),
      openCvCpp           : safeSub(this.cv._OpenCv_GetCPPSTDVersion()),
      tfApp               : safeSub(this.tf._GetTensorFlowAPPVersion()),
      tfApi               : safeSub(this.tf._GetTensorFlowAPIVersion()),
      tfCpp               : safeSub(this.tf._TensorFlow_GetCPPSTDVersion()),
      zigVersion          : safeSub(this.back.getZigVersion()),
      zigWebServerVersion : safeSub(this.back.getZigWebServerVersion()),
    }).pipe(
      map(bundle => {
        this.writeCache(bundle);
        return bundle;
      }),
      catchError(err => {
        console.error('[VersionCache] forkJoin failed:', err);
        return of(this.readCache());
      }),
    );
  }

  // ── Heartbeat ───────────────────────────────────────────────────────────────

  private startHeartbeat(): void {
    this.heartSub = interval(600_000)
      .pipe(
        switchMap(() =>
          forkJoin({
            java   : this.back.getJavaVersion().pipe(catchError(() => of('Offline'))),
            node   : this.back.getNodeVersion().pipe(catchError(() => of('Offline'))),
            nodeOcr: this.back.getNodeVersionOcr().pipe(catchError(() => of('Offline'))),
            python : this.back.getPythonVersion().pipe(catchError(() => of('Offline'))),
          })
        )
      )
      .subscribe({
        next : r => {
          console.log(`[Heartbeat] java=${r.java} node=${r.node} nodeOcr=${r.nodeOcr}`);
          this.reload(); // refresh full bundle so recovered services appear in UI
        },
        error: err => console.error('[Heartbeat] Ping failed:', err),
      });
  }

  // ── localStorage helpers ────────────────────────────────────────────────────

  private readCache(): VersionBundle {
    const L = '(..loading..)';
    const blank: VersionBundle = {
      pythonVersion: L, nodeVersion: L, nodeVersionOcr: L, javaVersion: L,
      webApiApp: L,     algorithmApp: L, algorithmCpp: L, aspNetCoreCpp: L,
      openCvApp: L,     openCvApi: L,    openCvCpp: L,
      tesseractApp: L,  tesseractApi: L, tesseractCpp: L,
      tfApp: L,         tfApi: L,        tfCpp: L,
      zigVersion: L,    zigWebServerVersion: L,
    };
    try {
      const raw = localStorage.getItem('version-cache');
      if (!raw) return blank;
      // Spread over blank so any missing key still gets the loading sentinel
      return { ...blank, ...(JSON.parse(raw) as Partial<VersionBundle>) };
    } catch {
      return blank;
    }
  }

  private writeCache(v: VersionBundle): void {
    try {
      localStorage.setItem('version-cache', JSON.stringify(v));
    } catch (e) {
      console.warn('[VersionCache] localStorage write failed:', e);
    }
  }

  ngOnDestroy(): void {
    this.fetchSub?.unsubscribe();
    this.heartSub?.unsubscribe();
  }
}