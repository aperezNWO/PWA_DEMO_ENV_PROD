// ANGULAR CORE & COMMON
import { NgModule, ErrorHandler, isDevMode, inject, provideAppInitializer, Injectable              } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { BrowserModule           } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { FormsModule, ReactiveFormsModule          } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ServiceWorkerModule                       } from '@angular/service-worker';

// CUSTOM MODULES & COMPONENTS
import { AppRoutingModule     } from './app-routing.module';
import { SharedModule         } from './_modules/shared/shared.module';
import { FileGenerationModule } from './_modules/_Demos/_DemosFeatures/files-generation/file-generation.module';
import { GamesModule          } from './_modules/_Demos/_DemosFeatures/games/games.module';
import { AlgorithmModule      } from './_modules/_Demos/_DemosFeatures/algorithm/algorithm.module';
import { MiscelaneousModule   } from './_modules/_Demos/_DemosFeatures/miscelaneous/miscelaneous.module';
import { AboutModule          } from './_modules/about/about.module';

// CUSTOM COMPONENTS
import { AppComponent          } from './app.component';
import { NavComponent          } from './_modules/home/nav/nav.component';
import { PageNotFoundComponent } from './_modules/home/page-not-found/page-not-found.component';
import { GridParamComponent    } from './_components/grid-param/grid-param.component';
import { PageUrlListComponent  } from './_components/page-url-list/page-url-list.component';
import { SpeechPanelComponent  } from 'src/app/_components/speech-panel/speech-panel.component';

// DIRECTIVES / ENTITIES 
import { LogType               } from './_models/entity.model';
import { BaseSortableHeader    } from './_directives/sortable.directive';

// SERVICES
import { ConfigService  } from './_services/__Utils/ConfigService/config.service';
import { BackendService } from './_services/BackendService/backend.service';


// THIRD PARTY
import { NgbModule      } from '@ng-bootstrap/ng-bootstrap';

// --- MANTENEMOS LA CLASE AQUÍ PARA EVITAR EL ERROR DE IMPORTACIÓN ---
@Injectable({
  providedIn: 'root'
})
export class CustomErrorHandler implements ErrorHandler {
    private backendService = inject(BackendService); // Usamos inject() estilo v21

    handleError(_error: Error): void { 
      console.error("[CUSTOM ERROR HANDLING]:\n" + _error); 
      this.backendService.SetLog("[CUSTOM ERROR HANDLING]", _error.message, LogType.Error);
    } 
}

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    PageNotFoundComponent,
    GridParamComponent,
    PageUrlListComponent
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
    SpeechPanelComponent,
    BaseSortableHeader,
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
    // Referenciamos la clase que definimos arriba
    { provide: ErrorHandler, useClass: CustomErrorHandler },
    provideHttpClient(withInterceptorsFromDi()),
    provideAppInitializer(() => {
      const configService = inject(ConfigService);
      return configService.loadConfig();
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }