import { Component, signal, VERSION, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PAGE_ABOUT_TECHNICAL_SPECS } from 'src/app/_models/common';
import { BaseComponent } from 'src/app/_components/base/base.component';
import { SpeechService } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { ConfigService } from 'src/app/_services/__Utils/ConfigService/config.service';
import { VersionBundle, VersionCacheService } from 'src/app/_services/__Utils/VersionCacheService/version-cache.service';
import { BackendService } from '../../../../_services/BackendService/backend.service';

export interface ServiceVersionMeta {
  type?: string  | null;
  name: string;
  features?: string  | null;
  appVersion?: string | null;
  runtimeOrLangVersion?: string | null;
  apiOrServerVersion?: string | null;
  stdVersion?: string | null;
  repoLink?: string | null;
  healthLink?: string | null;
}

@Component({
    selector: 'app-technical-specs',
    templateUrl: './technical-specs.component.html',
    styleUrls: ['./technical-specs.component.css'],
    standalone: false
})
export class TechnicalSpecsComponent extends BaseComponent {

    _appBrand: string | undefined;
    _appVersion: string | undefined;
    _runtimeVersion: string = VERSION.full;

    _webApiAppVersion = this.fromCache('webApiApp');
    _AlgorithmAppVersion = this.fromCache('algorithmApp');
    _Algorithm_CPPSTDVersion = this.fromCache('algorithmCpp');
    _ASPNETCoreCppVersion = this.fromCache('aspNetCoreCpp');
    _OpenCvAppVersion = this.fromCache('openCvApp');
    _OpenCvAPIVersion = this.fromCache('openCvApi');
    _OpenCvCPPSTDVersion = this.fromCache('openCvCpp');
    _tesseractAppVersion = this.fromCache('tesseractApp');
    _tesseractAPIVersion = this.fromCache('tesseractApi');
    _tesseractCPPSTDVersion = this.fromCache('tesseractCpp');
    _TensorFlowAPPVersion = this.fromCache('tfApp');
    _TensorFlowAPIVersion = this.fromCache('tfApi');
    _TensorFlowCPPSTDVersion = this.fromCache('tfCpp');
    _PythonVersion = this.fromCache('pythonVersion');
    _PythonWebServerVersion = this.fromCache('pythonWebServerVersion');
    _PythonVersionTF = this.fromCache('pythonVersionTF');
    _PythonWebServerVersionTF = this.fromCache('pythonWebServerVersionTF');
    _JavaVersion = this.fromCache('javaVersion');
    _JavaWebServerVersion = this.fromCache('javaWebServerVersion');
    _NodeVersion = this.fromCache('nodeVersion');
    _NodeWebServerVersion = this.fromCache('nodeWebServerVersion');
    _NodeVersionOcr = this.fromCache('nodeVersionOcr');
    _NodeWebServerVersionOcr = this.fromCache('nodeWebServerVersionOcr');
    _ZigVersion = this.fromCache('zigVersion');
    _ZigWebServerVersion = this.fromCache('zigWebServerVersion');
    _RustVersion = this.fromCache('rustVersion');
    _RustWebServerVersion = this.fromCache('rustWebServerVersion');
    _GoLangVersion = this.fromCache('goLangVersion');
    _GoLangWebServerVersion = this.fromCache('goLangWebServerVersion');
    _DartVersion = this.fromCache('dartVersion');
    _DartWebServerVersion = this.fromCache('dartWebServerVersion');
    _KotlinVersion = this.fromCache('kotlinVersion');
    _KotlinWebServerVersion = this.fromCache('kotlinWebServerVersion');

    guid = signal<string>('');

    protected _githubRepo                : string | undefined = `${this.configService.getConfigValue('gitHubRepo')}`;
    protected _techDocRoot               : string | undefined = `${this.configService.getConfigValue('techDocRoot')}`;
    protected _techDoc                   : string | undefined = `${this.configService.getConfigValue('techDocRegex').replace('{techDocRoot}', this._techDocRoot ?? '')}`;

    protected __baseUrlNetCoreSwagger    : string | undefined = `${this.configService.getConfigValue('baseUrlNetCore')}swagger`;
    protected __baseUrlNetCoreRepo       : string | undefined = `${this.configService.getConfigValue('baseUrlNetCoreRepo')}`;
    protected __baseUrlNetCoreCPPSwagger : string | undefined = `${this.configService.getConfigValue('baseUrlNetCoreCPPEntry')}swagger`;
    protected __baseUrlNetCoreCPPRepo    : string | undefined = `${this.configService.getConfigValue('baseUrlNetCoreCPPEntryRepo')}`;
    protected __baseUrlNodeJs            : string | undefined = `${this.configService.getConfigValue('baseUrlNodeJs')}`;
    protected __baseUrlNodeJsRepo        : string | undefined = `${this.configService.getConfigValue('baseUrlNodeJsRepo')}`;
    protected _baseUrlPythonDjango       : string | undefined = `${this.configService.getConfigValue('baseUrlDjangoPython')}`;
    protected _PythonDjangoRepo          : string | undefined = `${this.configService.getConfigValue('baseUrlDjangoPythonRepo')}`;
    protected _baseUrlPythonDjangoTF     : string | undefined = `${this.configService.getConfigValue('baseUrlDjangoPythonTF')}`;
    protected _PythonDjangoRepoTF        : string | undefined = `${this.configService.getConfigValue('baseUrlDjangoPythonTFRepo')}`;

    // Lookup table array
    services: ServiceVersionMeta[] = [];

    constructor(
        private versionCache: VersionCacheService,
        private cdr: ChangeDetectorRef,
        public override configService: ConfigService,
        public override backendService: BackendService,
        public override route: ActivatedRoute,
        public override speechService: SpeechService,
    ) {
        super(configService, backendService, route, speechService, PAGE_ABOUT_TECHNICAL_SPECS);
        this._appBrand = this.configService.getConfigValue('appBrand');
        this._appVersion = this.configService.getConfigValue('appVersion');
        this.rebuildServicesTable();
    }

    ngOnInit(): void {
        this.versionCache.versions$.subscribe(v => {
            this.applyBundle(v);
            this.cdr.markForCheck();
        });
    }

    private applyBundle(v: VersionBundle): void {
        this._webApiAppVersion = v.webApiApp ?? '(..loading..)';
        this._AlgorithmAppVersion = v.algorithmApp ?? '(..loading..)';
        this._Algorithm_CPPSTDVersion = v.algorithmCpp ?? '(..loading..)';
        this._ASPNETCoreCppVersion = v.aspNetCoreCpp ?? '(..loading..)';
        this._tesseractAppVersion = v.tesseractApp ?? '(..loading..)';
        this._tesseractAPIVersion = v.tesseractApi ?? '(..loading..)';
        this._tesseractCPPSTDVersion = v.tesseractCpp ?? '(..loading..)';
        this._OpenCvAppVersion = v.openCvApp ?? '(..loading..)';
        this._OpenCvAPIVersion = v.openCvApi ?? '(..loading..)';
        this._OpenCvCPPSTDVersion = v.openCvCpp ?? '(..loading..)';
        this._TensorFlowAPPVersion = v.tfApp ?? '(..loading..)';
        this._TensorFlowAPIVersion = v.tfApi ?? '(..loading..)';
        this._TensorFlowCPPSTDVersion = v.tfCpp ?? '(..loading..)';
        this._PythonVersion = v.pythonVersion ?? '(..loading..)';
        this._PythonWebServerVersion = v.pythonWebServerVersion ?? '(..loading..)';
        this._PythonVersionTF = v.pythonVersionTF ?? '(..loading..)';
        this._PythonWebServerVersionTF = v.pythonWebServerVersionTF ?? '(..loading..)';
        this._JavaVersion = v.javaVersion ?? '(..loading..)';
        this._JavaWebServerVersion = v.javaWebServerVersion ?? '(..loading..)';
        this._NodeVersion = v.nodeVersion ?? '(..loading..)';
        this._NodeWebServerVersion = v.nodeWebServerVersion ?? '(..loading..)';
        this._NodeVersionOcr = v.nodeVersionOcr ?? '(..loading..)';
        this._NodeWebServerVersionOcr = v.nodeWebServerVersionOcr ?? '(..loading..)';
        this._ZigVersion = v.zigVersion ?? '(..loading..)';
        this._ZigWebServerVersion = v.zigWebServerVersion ?? '(..loading..)';
        this._GoLangVersion = v.goLangVersion ?? '(..loading..)';
        this._GoLangWebServerVersion = v.goLangWebServerVersion ?? '(..loading..)';
        this._DartVersion = v.dartVersion ?? '(..loading..)';
        this._DartWebServerVersion = v.dartWebServerVersion ?? '(..loading..)';
        this._KotlinVersion = v.kotlinVersion ?? '(..loading..)';
        this._KotlinWebServerVersion = v.kotlinWebServerVersion ?? '(..loading..)';

        // Rebuild table when cache resolves
        this.rebuildServicesTable();
    }

    private rebuildServicesTable(): void {
            this.services = [
                {
                    type               : '(Backend)',
                    name               : '[App v. / .NET  v.]',
                    features           : '<x32,C#>',
                    appVersion         : this._webApiAppVersion,
                    apiOrServerVersion : '5.0',
                    healthLink         : this.__baseUrlNetCoreSwagger,
                    repoLink           : this.__baseUrlNetCoreRepo,
                },
                {
                    type                  : '(Backend)',
                    name                  : '[Java / SpringBoot]',
                    features              : '<db>',
                    runtimeOrLangVersion  : this._JavaVersion,
                    apiOrServerVersion    : this._JavaWebServerVersion,
                },
                {
                    type                  : '(Backend)',
                    name                  : '[Kotlin / SpringBoot]',
                    features              : '<db>',
                    runtimeOrLangVersion  : this._KotlinVersion,
                    apiOrServerVersion    : this._KotlinWebServerVersion,
                },
                {
                    type                 : '(Backend)',
                    name                 : '[Node.js / Express]',
                    features             : '<db,smtp,chat>',
                    runtimeOrLangVersion : this._NodeVersion,
                    apiOrServerVersion   : this._NodeWebServerVersion,
                    healthLink           : `${this.__baseUrlNodeJs}apí-docs`,
                    repoLink             : this.__baseUrlNodeJsRepo,
                },
                {
                    type                  : '(Backend)',
                    name                  : '[Node.js / Express]',
                    features              : '<Ocr,Opencv>',
                    runtimeOrLangVersion  : this._NodeVersionOcr,
                    apiOrServerVersion    : this._NodeWebServerVersionOcr,
                },
                {
                    type                  : '(Backend)',
                    name                  : '[Python / Django]',
                    features              : '<db>',
                    runtimeOrLangVersion  : this._PythonVersion,
                    apiOrServerVersion    : this._PythonWebServerVersion,
                    repoLink              : this._PythonDjangoRepo,
                    healthLink            : `${this._baseUrlPythonDjango}api/docs/`,
                },
                {
                    type                  : '(Backend)',
                    name                  : '[Python / Django]',
                    features              : '<Tensorflow>',
                    runtimeOrLangVersion  : this._PythonVersionTF,
                    apiOrServerVersion    : this._PythonWebServerVersionTF,
                    repoLink              : this._PythonDjangoRepoTF,
                    healthLink            : `${this._baseUrlPythonDjangoTF}api/docs/`,
                },
                {
                    type                  : '(Backend)',
                    name                  : '[Dart / Shelf]',
                    features              : '<Google UIx lang>',
                    runtimeOrLangVersion  : this._DartVersion,
                    apiOrServerVersion    : this._DartWebServerVersion,
                },
                {
                    type                  : '(Backend)',
                    name                  : '[Rust / Actix-web]',
                    features              : '<WASM>',
                    runtimeOrLangVersion  : this._RustVersion,
                    apiOrServerVersion    : this._RustWebServerVersion,
                },
                {
                    type                  : '(Backend)',
                    name                  : '[GoLang / net-http]',
                    features              : '<gRPC>',
                    runtimeOrLangVersion  : this._GoLangVersion,
                    apiOrServerVersion    : this._GoLangWebServerVersion,
                },
                {
                    type                 : '(Backend)',
                    name                 : '[Zig / std.http.Server]',
                    features             : '<c/c++ alt>',
                    runtimeOrLangVersion : this._ZigVersion,
                    apiOrServerVersion   : this._ZigWebServerVersion,
                },
                {
                    type               : '(Backend)',
                    name               : '[App v. / .NET  v.]',
                    features           : '<x64,C++>',
                    appVersion         : this._ASPNETCoreCppVersion,
                    repoLink           : this.__baseUrlNetCoreCPPRepo,
                    apiOrServerVersion : '8.0',
                    healthLink         : this.__baseUrlNetCoreCPPSwagger,
                },
                {
                    type                  : '(DLL C++)',
                    name                  : '[App v. / Std v.]',
                    features              : '<Algorithm>',
                    appVersion            : this._AlgorithmAppVersion,
                    stdVersion            : this._Algorithm_CPPSTDVersion,
                },
                {
                    type               : '(DLL C++)',
                    name               : '[App v. / Std v. / API v.]',
                    features           : '<OpenCv>',
                    appVersion         : this._OpenCvAppVersion,
                    stdVersion         : this._OpenCvCPPSTDVersion,
                    apiOrServerVersion : this._OpenCvAPIVersion,
                },
                {
                    type                : '(DLL C++)',
                    name                : '[App v. / Std v. / API v.]',
                    features            : '<Tesseract>',
                    appVersion          : this._tesseractAppVersion,
                    stdVersion          : this._tesseractCPPSTDVersion,
                    apiOrServerVersion  : this._tesseractAPIVersion,
                },
                {
                    type               : '(DLL C++)',
                    name               : '[App v. / Std v. / API v.]',
                    features           : '<Tensorflow>',
                    appVersion         : this._TensorFlowAPPVersion,
                    stdVersion         : this._TensorFlowCPPSTDVersion,
                    apiOrServerVersion : this._TensorFlowAPIVersion,
                },
            ];
    }

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
