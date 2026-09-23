import { Component, signal, VERSION, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PAGE_ABOUT_TECHNICAL_SPECS } from 'src/app/_models/common';
import { BaseComponent } from 'src/app/_components/base/base.component';
import { SpeechService } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { ConfigService } from 'src/app/_services/__Utils/ConfigService/config.service';
import { VersionBundle, VersionCacheService } from 'src/app/_services/__Utils/VersionCacheService/version-cache.service';
import { BackendService } from '../../../../_services/BackendService/backend.service';

export interface ServiceVersionMeta {
  name: string;
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

    protected __baseUrlNetCoreSwagger: string | undefined = `${this.configService.getConfigValue('baseUrlNetCore')}swagger`;
    protected __baseUrlNetCoreCPPSwagger: string | undefined = `${this.configService.getConfigValue('baseUrlNetCoreCPPEntry')}swagger`;
    protected _githubRepo: string | undefined = `${this.configService.getConfigValue('gitHubRepo')}`;
    protected _techDocRoot: string | undefined = `${this.configService.getConfigValue('techDocRoot')}`;
    protected _techDoc: string | undefined = `${this.configService.getConfigValue('techDocRegex').replace('{techDocRoot}', this._techDocRoot ?? '')}`;

    protected _baseUrlPythonDjango: string | undefined = `${this.configService.getConfigValue('baseUrlDjangoPython')}`;
    protected _PythonDjangoRepo: string | undefined = `${this.configService.getConfigValue('baseUrlDjangoPythonRepo')}`;
    protected _baseUrlPythonDjangoTF: string | undefined = `${this.configService.getConfigValue('baseUrlDjangoPythonTF')}`;
    protected _PythonDjangoRepoTF: string | undefined = `${this.configService.getConfigValue('baseUrlDjangoPythonTFRepo')}`;

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
                    name: '(Backend | App Version | .NET Core Version | [ASP.NET Core x32 / C#])',
                    appVersion: this._webApiAppVersion,
                    apiOrServerVersion: '5.0',
                    healthLink: this.__baseUrlNetCoreSwagger,
                },
                {
                    name: '(Backend | [Java / SpringBoot])',
                    runtimeOrLangVersion: this._JavaVersion,
                    apiOrServerVersion: this._JavaWebServerVersion,
                },
                {
                    name: '(Backend | [Kotlin / SpringBoot])',
                    runtimeOrLangVersion: this._KotlinVersion,
                    apiOrServerVersion: this._KotlinWebServerVersion,
                },
                {
                    name: '(Backend | [Node.js / Javascript)(db/smtp/chat)])',
                    runtimeOrLangVersion: this._NodeVersion,
                    apiOrServerVersion: this._NodeWebServerVersion,
                },
                {
                    name: '(Backend | [Node.js / Javascript)(Ocr/Opencv)])',
                    runtimeOrLangVersion: this._NodeVersionOcr,
                    apiOrServerVersion: this._NodeWebServerVersionOcr,
                },
                {
                    name: '(Backend | [Python / Django)(db)])',
                    runtimeOrLangVersion: this._PythonVersion,
                    apiOrServerVersion: this._PythonWebServerVersion,
                    repoLink: this._PythonDjangoRepo,
                    healthLink: `${this._baseUrlPythonDjango}health/?format=json`,
                },
                {
                    name: '(Backend | [Python / Django)(Tensorflow)])',
                    runtimeOrLangVersion: this._PythonVersionTF,
                    apiOrServerVersion: this._PythonWebServerVersionTF,
                    repoLink: this._PythonDjangoRepoTF,
                    healthLink: `${this._baseUrlPythonDjangoTF}health/?format=json`,
                },
                {
                    name: '(Backend | [Zig / std.http.Server])',
                    runtimeOrLangVersion: this._ZigVersion,
                    apiOrServerVersion: this._ZigWebServerVersion,
                },
                {
                    name: '(Backend | [GoLang / net-http])',
                    runtimeOrLangVersion: this._GoLangVersion,
                    apiOrServerVersion: this._GoLangWebServerVersion,
                },
                {
                    name: '(Backend | [Dart / Shelf])',
                    runtimeOrLangVersion: this._DartVersion,
                    apiOrServerVersion: this._DartWebServerVersion,
                },
                {
                    name: '(Backend | [Rust / Actix-web])',
                    runtimeOrLangVersion: this._RustVersion,
                    apiOrServerVersion: this._RustWebServerVersion,
                },
                {
                    name: '(Backend | App Version | .NET Core Version | [ASP.NET Core x64 / C++])',
                    appVersion: this._ASPNETCoreCppVersion,
                    apiOrServerVersion: '8.0',
                    healthLink: this.__baseUrlNetCoreCPPSwagger,
                },
                {
                    name: '(DLL C++ | App Version | Std Version | API Version | [Algorithm])',
                    appVersion: this._AlgorithmAppVersion,
                    stdVersion: this._Algorithm_CPPSTDVersion,
                },
                {
                    name: '(DLL C++ | App Version | Std Version | API Version | [OpenCv])',
                    appVersion: this._OpenCvAppVersion,
                    stdVersion: this._OpenCvCPPSTDVersion,
                    apiOrServerVersion: this._OpenCvAPIVersion,
                },
                {
                    name: '(DLL C++ | App Version | Std Version | API Version | [Tesseract])',
                    appVersion: this._tesseractAppVersion,
                    stdVersion: this._tesseractCPPSTDVersion,
                    apiOrServerVersion: this._tesseractAPIVersion,
                },
                {
                    name: '(DLL C++ | App Version | Std Version | API Version | [Tensorflow])',
                    appVersion: this._TensorFlowAPPVersion,
                    stdVersion: this._TensorFlowCPPSTDVersion,
                    apiOrServerVersion: this._TensorFlowAPIVersion,
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
