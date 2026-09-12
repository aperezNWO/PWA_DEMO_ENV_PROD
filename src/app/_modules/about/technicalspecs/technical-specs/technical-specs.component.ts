import { Component, signal, VERSION, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute                     } from '@angular/router';
import { PAGE_ABOUT_TECHNICAL_SPECS         } from 'src/app/_models/common';
import { BaseComponent                      } from 'src/app/_components/base/base.component';
import { SpeechService                      } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { ConfigService                      } from 'src/app/_services/__Utils/ConfigService/config.service'
import { VersionBundle, VersionCacheService } from 'src/app/_services/__Utils/VersionCacheService/version-cache.service';
import { BackendService                     } from '../../../../_services/BackendService/backend.service';

@Component({
    selector: 'app-technical-specs',
    templateUrl: './technical-specs.component.html',
    styleUrls: ['./technical-specs.component.css'],
    standalone: false
})
export class TechnicalSpecsComponent extends BaseComponent {
    ////////////////////////////////////////////////////////////////  
    // [PROPIEDADES]
    //////////////////////////////////////////////////////////////// 

    _appBrand               : string | undefined;
    _appVersion             : string | undefined;
    _runtimeVersion         : string = VERSION.full;

    _webApiAppVersion           = this.fromCache('webApiApp');
    _AlgorithmAppVersion        = this.fromCache('algorithmApp');
    _Algorithm_CPPSTDVersion    = this.fromCache('algorithmCpp');
    _ASPNETCoreCppVersion       = this.fromCache('aspNetCoreCpp');
    _OpenCvAppVersion           = this.fromCache('openCvApp');
    _OpenCvAPIVersion           = this.fromCache('openCvApi');
    _OpenCvCPPSTDVersion        = this.fromCache('openCvCpp');
    _tesseractAppVersion        = this.fromCache('tesseractApp');
    _tesseractAPIVersion        = this.fromCache('tesseractApi');
    _tesseractCPPSTDVersion     = this.fromCache('tesseractCpp');
    _TensorFlowAPPVersion       = this.fromCache('tfApp');
    _TensorFlowAPIVersion       = this.fromCache('tfApi');
    _TensorFlowCPPSTDVersion    = this.fromCache('tfCpp');
    _PythonVersion              = this.fromCache('pythonVersion');
    _JavaVersion                = this.fromCache('javaVersion');
    _NodeVersion                = this.fromCache('nodeVersion');
    _NodeVersionOcr             = this.fromCache('nodeVersionOcr');
    _ZigVersion                 = this.fromCache('zigVersion');
    _ZigWebServerVersion        = this.fromCache('zigWebServerVersion');
    _RustVersion                = this.fromCache('rustVersion');
    _RustWebServerVersion       = this.fromCache('rustWebServerVersion');
    _GoLangVersion              = this.fromCache('goLangVersion');
    _GoLangWebServerVersion     = this.fromCache('goLangWebServerVersion'); 
    _DartVersion                = this.fromCache('dartVersion');
    _DartWebServerVersion       = this.fromCache('dartWebServerVersion');

    guid = signal<string>('');

    public get _baseUrlNetCoreSwagger(): string | undefined {
        return this.__baseUrlNetCoreSwagger;
    }
    public get _baseUrlNetCoreCPPSwagger(): string | undefined {
        return this.__baseUrlNetCoreCPPSwagger;
    }
    protected __baseUrlNetCoreSwagger    : string | undefined = `${this.configService.getConfigValue('baseUrlNetCore')}swagger`;
    protected __baseUrlNetCoreCPPSwagger : string | undefined = `${this.configService.getConfigValue('baseUrlNetCoreCPPEntry')}swagger`;
    protected _githubRepo                : string | undefined = `${this.configService.getConfigValue('gitHubRepo')}`;
    protected _techDocRoot               : string | undefined = `${this.configService.getConfigValue('techDocRoot')}`;
    protected _techDoc                   : string | undefined = `${this.configService.getConfigValue('techDocRegex').replace('{techDocRoot}', this._techDocRoot ?? '')}`;

    ////////////////////////////////////////////////////////////////  
    // [EVENT HANDLERS]
    ////////////////////////////////////////////////////////////////  

    constructor(
           private         versionCache  : VersionCacheService,
           private         cdr           : ChangeDetectorRef,   // ← KEY FIX
           public override configService : ConfigService,
           public override backendService: BackendService,
           public override route         : ActivatedRoute,
           public override speechService : SpeechService,
    ) {
        super(configService, backendService, route, speechService, PAGE_ABOUT_TECHNICAL_SPECS);
        this._appBrand   = this.configService.getConfigValue('appBrand');
        this._appVersion = this.configService.getConfigValue('appVersion');
    }

    ngOnInit(): void {
        this.versionCache.versions$.subscribe(v => {
            this.applyBundle(v);
            // Force Angular to pick up the property changes.
            // Required when the observable emits outside Angular's zone
            // (common with providedIn:'root' services + Render.com cold starts).
            this.cdr.markForCheck();
        });
    }

    ////////////////////////////////////////////////////////////////  
    // [MÉTODOS COMUNES]
    ////////////////////////////////////////////////////////////////  

    setNewGuid(): string {
        const guid = this.configService.generateGuid();
        this.guid.set(guid);
        return guid;
    }

    async generateNewGuid(): Promise<void> {
        try {
            await navigator.clipboard.writeText(this.setNewGuid());
            alert('Text copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy text: ', error);
            alert('Failed to copy text.');
        }
    }

    public get cleanPythonVersion(): string {
        if (!this._PythonVersion) return '';
        const match = this._PythonVersion.match(/^(\d+\.\d+\.\d+)/);
        return match ? match[1] : this._PythonVersion;
    }

    public get cleanDartVersion(): string {
        if (!this._DartVersion) return '';
        const match = this._DartVersion.match(/(\d+\.\d+\.\d+)/);
        return match ? match[1] : this._DartVersion;
    }

    ////////////////////////////////////////////////////////////////  
    // [PRIVADOS]
    ////////////////////////////////////////////////////////////////

    private applyBundle(v: VersionBundle): void {
        this._webApiAppVersion          = v.webApiApp           ?? '(..loading..)';
        this._AlgorithmAppVersion       = v.algorithmApp        ?? '(..loading..)';
        this._Algorithm_CPPSTDVersion   = v.algorithmCpp        ?? '(..loading..)';
        this._ASPNETCoreCppVersion      = v.aspNetCoreCpp       ?? '(..loading..)';
        this._tesseractAppVersion       = v.tesseractApp        ?? '(..loading..)';
        this._tesseractAPIVersion       = v.tesseractApi        ?? '(..loading..)';
        this._tesseractCPPSTDVersion    = v.tesseractCpp        ?? '(..loading..)';
        this._OpenCvAppVersion          = v.openCvApp           ?? '(..loading..)';
        this._OpenCvAPIVersion          = v.openCvApi           ?? '(..loading..)';
        this._OpenCvCPPSTDVersion       = v.openCvCpp           ?? '(..loading..)';
        this._TensorFlowAPPVersion      = v.tfApp               ?? '(..loading..)';
        this._TensorFlowAPIVersion      = v.tfApi               ?? '(..loading..)';
        this._TensorFlowCPPSTDVersion   = v.tfCpp               ?? '(..loading..)';
        this._PythonVersion             = v.pythonVersion       ?? '(..loading..)';
        this._JavaVersion               = v.javaVersion         ?? '(..loading..)';
        this._NodeVersion               = v.nodeVersion         ?? '(..loading..)';
        this._NodeVersionOcr            = v.nodeVersionOcr      ?? '(..loading..)';
        this._ZigVersion                = v.zigVersion          ?? '(..loading..)';
        this._ZigWebServerVersion       = v.zigWebServerVersion ?? '(..loading..)';
        this._GoLangVersion             = v.goLangVersion          ?? '(..loading..)';
        this._GoLangWebServerVersion    = v.goLangWebServerVersion ?? '(..loading..)';
        this._DartVersion               = v.dartVersion            ?? '(..loading..)';
        this._DartWebServerVersion      = v.dartWebServerVersion   ?? '(..loading..)'; 
    }

    private fromCache(key: keyof VersionBundle): string {
        try {
            const raw = localStorage.getItem('version-cache');
            if (!raw) return '(..loading..)';
            const v = JSON.parse(raw) as VersionBundle;
            return v[key] ?? '(..loading..)';
        } catch {
            return '(..loading..)';
        }
    }
}