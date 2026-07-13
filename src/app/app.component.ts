import { Component, OnInit, inject, signal } from '@angular/core';
import { Title                             } from '@angular/platform-browser';
import { BackendService                    } from './_services/BackendService/backend.service';
import { AlgorithmService                  } from './_services/AlgorithmService/algorithm.service';
import { ConfigService                     } from './_services/__Utils/ConfigService/config.service';
import { VersionCacheService } from './_services/__Utils/VersionCacheService/versio-cache.service';

@Component({
  selector    :    'app-root',
  templateUrl : './app.component.html',
  styleUrls   :  ['./app.component.css'],
  standalone  : false // Siguiendo tu preferencia de usar AppModule
})
export class AppComponent implements OnInit {
  // Inyección de servicios (v21 Style)
  private readonly _configService      = inject(ConfigService);
  private readonly backendService      = inject(BackendService);
  private readonly titleService        = inject(Title);
  private readonly algorithmService    = inject(AlgorithmService);
  private readonly versionCacheService = inject(VersionCacheService);

  // Propiedades reactivas usando Signals
  public readonly title      = signal<string>('');
  public readonly appBrand   = signal<string>('');
  public readonly appVersion = signal<string>('');

  ngOnInit(): void {
    this.initializeConfig();
    this.setupCache();
  }

  private initializeConfig(): void {
    // Obtenemos valores de configuración
    const brand   = this._configService.getConfigValue('appBrand')   ?? 'App';
    const version = this._configService.getConfigValue('appVersion') ?? '1.0.0';

    // Actualizamos Signals
    this.appBrand.set(brand);
    this.appVersion.set(version);
    this.title.set(brand);

    // Actualizamos el título de la pestaña del navegador
    this.titleService.setTitle(`${brand} - ${version}`);
  }

  private setupCache(): void {
    const baseUrl = this._configService.getConfigValue('baseUrlNetCore');
    
    if (baseUrl) {
      // Inicialización de procesos de caché
      this.algorithmService._SetXmlDataToCache(baseUrl);
      this.backendService._SetSTATPieCache(baseUrl);
      this.backendService._SetSTATBarCache(baseUrl);
    }
  }
}