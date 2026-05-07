// ANGULAR CORE & COMMON
import { NgModule, ErrorHandler, isDevMode, inject, provideAppInitializer, Injectable               } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe, HashLocationStrategy, LocationStrategy  } from '@angular/common';
import { BrowserModule                                                                              } from '@angular/platform-browser';
import { BrowserAnimationsModule                                                                    } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule                                                           } from '@angular/forms';
import { ServiceWorkerModule                                                                        } from '@angular/service-worker';
import { provideHttpClient, withInterceptors, HttpInterceptorFn, HttpRequest,  HttpHandlerFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';


// CUSTOM MODULES & COMPONENTS
import { AppRoutingModule      } from './app-routing.module';
import { SharedModule          } from './_modules/shared/shared.module';
import { FileGenerationModule  } from './_modules/_Demos/_DemosFeatures/files-generation/file-generation.module';
import { GamesModule           } from './_modules/_Demos/_DemosFeatures/games/games.module';
import { AlgorithmModule       } from './_modules/_Demos/_DemosFeatures/algorithm/algorithm.module';
import { MiscelaneousModule    } from './_modules/_Demos/_DemosFeatures/miscelaneous/miscelaneous.module';
import { AboutModule           } from './_modules/about/about.module';
import { NavComponent          } from './_modules/home/nav/nav.component';
import { PageNotFoundComponent } from './_modules/home/page-not-found/page-not-found.component';
import { AppComponent          } from './app.component';
import { GridParamComponent    } from './_components/grid-param/grid-param.component';
import { PageUrlListComponent  } from './_components/page-url-list/page-url-list.component';
import { SpeechPanelComponent  } from 'src/app/_components/speech-panel/speech-panel.component';

// DIRECTIVES / ENTITIES / SERVICES
import { LogType                } from './_models/entity.model';
import { BaseSortableHeader     } from './_directives/sortable.directive';
import { ConfigService          } from './_services/__Utils/ConfigService/config.service';
import { BackendService         } from './_services/BackendService/backend.service';

// THIRD PARTY
import { NgbModule     } from '@ng-bootstrap/ng-bootstrap';
import { tap, finalize } from 'rxjs';
/**
 * 1. GLOBAL HTTP INTERCEPTOR (Functional Style)
 * Captures all network traffic and logs it.
 */
export const loggingInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const started = Date.now();
  const backend = inject(BackendService); // Injecting service inside function
  let status: string = 'pending';

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) status = 'succeeded';
      },
      error: (error: HttpErrorResponse) => {
        status = 'failed';
        // Auto-report network errors to your backend log
        backend.SetLog("[HTTP ERROR]", `URL: ${req.url} - Status: ${error.status}`, LogType.Error);
      }
    }),
    finalize(() => {
      const elapsed = Date.now() - started;
      console.warn(`[HTTP LOG]: ${req.method} "${req.urlWithParams}" ${status} in ${elapsed} ms.`);
    })
  );
};

/**
 * 2. GLOBAL ERROR HANDLER
 * Captures TypeScript/Runtime exceptions.
 */
@Injectable({ providedIn: 'root' })
export class CustomErrorHandler implements ErrorHandler {
    private backendService = inject(BackendService);

    handleError(_error: Error): void { 
      console.error("[RUNTIME ERROR]:\n", _error); 
      this.backendService.SetLog("[RUNTIME ERROR]", _error.message, LogType.Error);
    } 
}

/**
 * 3. MAIN APP MODULE
 */
@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    PageNotFoundComponent,
    GridParamComponent,
    PageUrlListComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    SharedModule,
    FileGenerationModule,
    GamesModule,
    AlgorithmModule,
    MiscelaneousModule,
    AboutModule,
    SpeechPanelComponent,  // Standalone
    BaseSortableHeader,    // Standalone
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    DecimalPipe,
    DatePipe,
    CurrencyPipe,
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    { provide: ErrorHandler, useClass: CustomErrorHandler },
    
    // Modern HttpClient configuration with the functional interceptor
    provideHttpClient(
      withInterceptors([loggingInterceptor])
    ),

    // App Initializer using the modern provideAppInitializer
    provideAppInitializer(() => {
      const configService = inject(ConfigService);
      return configService.loadConfig();
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }