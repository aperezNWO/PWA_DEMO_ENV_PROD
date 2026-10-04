import {
  Component,
  signal,
  VERSION,
  ChangeDetectorRef
}                                              from '@angular/core';
import { ActivatedRoute                      } from '@angular/router';
import { BaseComponent                       } from '../../../_components/base/base.component';
import { PAGE_ABOUT_TECHNICAL_SPECS          } from '../../../_models/common';
import { ConfigService                       } from '../../../_services/__Utils/ConfigService/config.service';
import { SpeechService                       } from '../../../_services/__Utils/SpeechService/speech.service';
import { VersionBundle, VersionCacheService  } from '../../../_services/__Utils/VersionCacheService/version-cache.service';
import { BackendService                      } from '../../../_services/BackendService/backend.service';

export interface ServiceVersionMeta {
  type?:                 string | null;
  name:                  string;
  features?:             string | null;
  stdVersion?:           string | null;
  appVersion?:           string | null;
  //runtimeOrLangVersion?: string | null;
  apiOrServerVersion?:   string | null;
  repoLink?:             string | null;
  healthLink?:           string | null;
  moduleLink?:           string | null;
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

  _webApiAppVersion                = this.fromCache('webApiApp');
  _AlgorithmAppVersion             = this.fromCache('algorithmApp');
  _Algorithm_CPPSTDVersion         = this.fromCache('algorithmCpp');
  _ASPNETCoreCppVersion            = this.fromCache('aspNetCoreCpp');
  _OpenCvAppVersion                = this.fromCache('openCvApp');
  _OpenCvAPIVersion                = this.fromCache('openCvApi');
  _OpenCvCPPSTDVersion             = this.fromCache('openCvCpp');
  _tesseractAppVersion             = this.fromCache('tesseractApp');
  _tesseractAPIVersion             = this.fromCache('tesseractApi');
  _tesseractCPPSTDVersion          = this.fromCache('tesseractCpp');
  _TensorFlowAPPVersion            = this.fromCache('tfApp');
  _TensorFlowAPIVersion            = this.fromCache('tfApi');
  _TensorFlowCPPSTDVersion         = this.fromCache('tfCpp');
  _PythonVersion                   = this.fromCache('pythonVersion');
  _PythonWebServerVersion          = this.fromCache('pythonWebServerVersion');
  _PythonVersionTF                 = this.fromCache('pythonVersionTF');
  _PythonWebServerVersionTF        = this.fromCache('pythonWebServerVersionTF');
  _JavaVersion                     = this.fromCache('javaVersion');
  _JavaWebServerVersion            = this.fromCache('javaWebServerVersion');
  _NodeVersion                     = this.fromCache('nodeVersion');
  _NodeWebServerVersion            = this.fromCache('nodeWebServerVersion');
  _NodeVersionOcr                  = this.fromCache('nodeVersionOcr');
  _NodeWebServerVersionOcr         = this.fromCache('nodeWebServerVersionOcr');
  _ZigVersion                      = this.fromCache('zigVersion');
  _ZigWebServerVersion             = this.fromCache('zigWebServerVersion');
  _CppVersion                      = this.fromCache('cppVersion');
  _CppWebServerVersion             = this.fromCache('cppWebServerVersion');
  _RustVersion                     = this.fromCache('rustVersion');
  _RustWebServerVersion            = this.fromCache('rustWebServerVersion');
  _GoLangVersion                   = this.fromCache('goLangVersion');
  _GoLangWebServerVersion          = this.fromCache('goLangWebServerVersion');
  _DartVersion                     = this.fromCache('dartVersion');
  _DartWebServerVersion            = this.fromCache('dartWebServerVersion');
  _KotlinVersion                   = this.fromCache('kotlinVersion');
  _KotlinWebServerVersion          = this.fromCache('kotlinWebServerVersion');
  _SwiftAppVersion                 = this.fromCache('swiftAppVersion');
  _SwiftVersion                    = this.fromCache('swiftVersion');
  _SwiftWebServerVersion           = this.fromCache('swiftWebServerVersion');

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
    protected __baseUrlNodeJsOcr         : string | undefined = `${this.configService.getConfigValue('baseUrlNodeJsOcr')}`;
    protected __baseUrlNodeJsOcrRepo     : string | undefined = `${this.configService.getConfigValue('baseUrlNodeJsOcrRepo')}`;
    protected __baseUrlCppWebServer      : string | undefined = `${this.configService.getConfigValue('baseUrlCppWebServer')}`;
    protected __baseUrlCppWebServerRepo  : string | undefined = `${this.configService.getConfigValue('baseUrlCppWebServerRepo')}`;
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
        this._appBrand    = this.configService.getConfigValue('appBrand');
        this._appVersion  = this.configService.getConfigValue('appVersion');
        this.rebuildServicesTable();
    }

    ngOnInit(): void {
        this.versionCache.versions$.subscribe(v => {
            this.applyBundle(v);
            this.cdr.markForCheck();
        });
    }

    private applyBundle(v: VersionBundle): void {
        this._webApiAppVersion             = v.webApiApp ?? '(..loading..)';
        this._AlgorithmAppVersion          = v.algorithmApp ?? '(..loading..)';
        this._Algorithm_CPPSTDVersion      = v.algorithmCpp ?? '(..loading..)';
        this._ASPNETCoreCppVersion         = v.aspNetCoreCpp ?? '(..loading..)';
        this._tesseractAppVersion          = v.tesseractApp ?? '(..loading..)';
        this._tesseractAPIVersion          = v.tesseractApi ?? '(..loading..)';
        this._tesseractCPPSTDVersion       = v.tesseractCpp ?? '(..loading..)';
        this._OpenCvAppVersion             = v.openCvApp ?? '(..loading..)';
        this._OpenCvAPIVersion             = v.openCvApi ?? '(..loading..)';
        this._OpenCvCPPSTDVersion          = v.openCvCpp ?? '(..loading..)';
        this._TensorFlowAPPVersion         = v.tfApp ?? '(..loading..)';
        this._TensorFlowAPIVersion         = v.tfApi ?? '(..loading..)';
        this._TensorFlowCPPSTDVersion      = v.tfCpp ?? '(..loading..)';
        this._PythonVersion                = v.pythonVersion ?? '(..loading..)';
        this._PythonWebServerVersion       = v.pythonWebServerVersion ?? '(..loading..)';
        this._PythonVersionTF              = v.pythonVersionTF ?? '(..loading..)';
        this._PythonWebServerVersionTF     = v.pythonWebServerVersionTF ?? '(..loading..)';
        this._JavaVersion                  = v.javaVersion ?? '(..loading..)';
        this._JavaWebServerVersion         = v.javaWebServerVersion ?? '(..loading..)';
        this._NodeVersion                  = v.nodeVersion ?? '(..loading..)';
        this._NodeWebServerVersion         = v.nodeWebServerVersion ?? '(..loading..)';
        this._NodeVersionOcr               = v.nodeVersionOcr ?? '(..loading..)';
        this._NodeWebServerVersionOcr      = v.nodeWebServerVersionOcr ?? '(..loading..)';
        this._ZigVersion                   = v.zigVersion ?? '(..loading..)';
        this._ZigWebServerVersion          = v.zigWebServerVersion ?? '(..loading..)';
        this._CppVersion                   = v.cppVersion ?? '(..loading..)';
        this._CppWebServerVersion          = v.cppWebServerVersion ?? '(..loading..)';
        this._GoLangVersion                = v.goLangVersion ?? '(..loading..)';
        this._GoLangWebServerVersion       = v.goLangWebServerVersion ?? '(..loading..)';
        this._DartVersion                  = v.dartVersion ?? '(..loading..)';
        this._DartWebServerVersion         = v.dartWebServerVersion ?? '(..loading..)';
        this._KotlinVersion                = v.kotlinVersion ?? '(..loading..)';
        this._KotlinWebServerVersion       = v.kotlinWebServerVersion ?? '(..loading..)';
        this._SwiftVersion                 = v.swiftVersion ?? '(..loading..)';
        this._SwiftAppVersion              = v.swiftAppVersion ?? '(..loading..)';
        this._SwiftWebServerVersion        = v.swiftWebServerVersion ?? '(..loading..)';

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
                    moduleLink         : `${this.configService.getConfigValue('baseUrlNetCoreModule')}`,
                },
                {
                    type                  : '(Backend)',
                    name                  : '[App v. / Java / SpringBoot]',
                    features: '<db>',
                    appVersion            : '1.0.0',
                    stdVersion            : this._JavaVersion,
                    apiOrServerVersion    : this._JavaWebServerVersion,
                    repoLink              : `${this.configService.getConfigValue('baseUrlSpringBootJavaRepo')}`,
                    healthLink            : `${this.configService.getConfigValue('baseUrlSpringBootJava')}getSpringBootVersion`,
                    moduleLink            : `${this.configService.getConfigValue('baseUrlSpringBootJavaModule')}`,
                },
                {
                    type                  : '(Backend)',
                    name                  : '[App v. / Kotlin / SpringBoot]',
                    features              : '<db>',
                    appVersion            : '1.0.0',
                    stdVersion            : this._KotlinVersion,
                    apiOrServerVersion    : this._KotlinWebServerVersion,
                    repoLink              : `${this.configService.getConfigValue('baseUrlSpringBoot_KotlinRepo')}`,
                    healthLink            : `${this.configService.getConfigValue('baseUrlSpringBoot_Kotlin')}api/system/server-version`,
                    moduleLink            : `${this.configService.getConfigValue('baseUrlSpringBoot_KotlinModule')}`,
                },
                {
                    type                 : '(Backend)',
                    name                 : '[App v. / Node.js / Express]',
                    features             : '<db>',
                    appVersion           : '1.0.0',
                    stdVersion           : this._NodeVersion,
                    apiOrServerVersion   : this._NodeWebServerVersion,
                    healthLink           : `${this.__baseUrlNodeJs}api-docs`,
                    repoLink             : this.__baseUrlNodeJsRepo,
                    moduleLink           : `${this.configService.getConfigValue('baseUrlNodeJsModule')}`,
                },
                {
                    type                  : '(Backend)',
                    name                  : '[App v / Node.js / Express]',
                    features              : '<Ocr>',
                    appVersion            : '1.0.0',
                    stdVersion            : this._NodeVersionOcr,
                    apiOrServerVersion    : this._NodeWebServerVersionOcr,
                    healthLink            : `${this.__baseUrlNodeJsOcr}api-docs`,
                    repoLink              : this.__baseUrlNodeJsOcrRepo,
                    moduleLink            : `${this.configService.getConfigValue('baseUrlNodeJsOcrModule')}`,
                },
                {
                    type                  : '(Backend)',
                    name                  : '[App v / Python / Django]',
                    features              : '<db>',
                    appVersion            : '1.0.0',
                    stdVersion            : this._PythonVersion,
                    apiOrServerVersion    : this._PythonWebServerVersion,
                    repoLink              : this._PythonDjangoRepo,
                    healthLink            : `${this._baseUrlPythonDjango}api/docs/`,
                    moduleLink            : `${this.configService.getConfigValue('baseUrlDjangoPythonModule')}`,
                },
                {
                    type                  : '(Backend)',
                    name                  : '[App v / Python / Django]',
                    features              : '<Tensorflow>',
                    appVersion            : this._PythonVersionTF,
                    stdVersion            : this._PythonVersionTF,
                    apiOrServerVersion    : this._PythonWebServerVersionTF,
                    repoLink              : this._PythonDjangoRepoTF,
                    healthLink            : `${this._baseUrlPythonDjangoTF}api/docs/`,
                    moduleLink            : `${this.configService.getConfigValue('baseUrlDjangoPythonTFModule')}`,
                },
                {
                    type                  : '(Backend)',
                    name                  : '[App v. / Dart / Shelf]',
                    features              : '<Google lang>',
                    appVersion            : '1.0.0',
                    stdVersion            : this._DartVersion,
                    apiOrServerVersion    : this._DartWebServerVersion,
                    repoLink              : `${this.configService.getConfigValue('baseUrlDartRepo')}`,
                    healthLink            : `${this.configService.getConfigValue('baseUrlDart')}api/system/server-version`,
                    moduleLink            : `${this.configService.getConfigValue('baseUrlDartModule')}`,
                },
                {
                    type                  : '(Backend)',
                    name                  : '[App v. / Swift / Vapor]',
                    features              : '<Apple lang>',
                    appVersion            : this._SwiftAppVersion,
                    stdVersion            : this._SwiftVersion,
                    apiOrServerVersion    : this._SwiftWebServerVersion,
                    repoLink              : `${this.configService.getConfigValue('baseUrlSwiftLangRepo')}`,
                    healthLink            : `${this.configService.getConfigValue('baseUrlSwiftLang')}health`,
                    moduleLink            : `${this.configService.getConfigValue('baseUrlSwiftLangModule')}`,
                },
                {
                    type                  : '(Backend)',
                    name                  : '[Rust / Actix-web]',
                    features              : '<WASM>',
                    appVersion            : '1.0.0',
                    stdVersion            : this._RustVersion,
                    apiOrServerVersion    : this._RustWebServerVersion,
                    repoLink              : `${this.configService.getConfigValue('baseUrlRustLangRepo')}`,
                    healthLink            : `${this.configService.getConfigValue('baseUrlRustLang')}api/version/server`,
                },
                {
                    type                  : '(Backend)',
                    name                  : '[GoLang / net-http]',
                    features              : '<gRPC>',
                    appVersion            : '1.0.0',
                    stdVersion            : this._GoLangVersion,
                    apiOrServerVersion    : this._GoLangWebServerVersion,
                    repoLink              : `${this.configService.getConfigValue('baseUrlGoLangRepo')}`,
                    healthLink            : `${this.configService.getConfigValue('baseUrlGoLang')}api/version/server`,
                },
                {
                    type                 : '(Backend)',
                    name                 : '[Zig / std.http.Server]',
                    features            : '<c++ alt>',
                    appVersion           : '1.0.0',
                    stdVersion           : this._ZigVersion,
                    apiOrServerVersion   : this._ZigWebServerVersion,
                    repoLink             : `${this.configService.getConfigValue('baseUrlZigLangRepo')}`,
                    healthLink           : `${this.configService.getConfigValue('baseUrlZigLang')}api/getZigWebServerVersion`,
                },
                {
                    type                 : '(Backend)',
                    name                 : '[C++ / httplib::Server]',
                    features             : '<Fractals>',
                    appVersion           : '1.0.0',
                    stdVersion           : this._CppVersion,
                    apiOrServerVersion   : this._CppWebServerVersion,
                    repoLink             : `${this.__baseUrlCppWebServerRepo}fractalEngine/FractalDemo.cpp`,
                    healthLink           : `${this.__baseUrlCppWebServer}getServerVersion`,
                    moduleLink           : `${this.configService.getConfigValue('baseUrlCppWebServerModule')}`,
                },
                {
                    type               : '(Backend)',
                    name               : '[App v. / .NET  v.]',
                    features           : '<x64,C++>',
                    appVersion         : this._ASPNETCoreCppVersion,
                    repoLink           : this.__baseUrlNetCoreCPPRepo,
                    apiOrServerVersion : '8.0',
                    healthLink         : this.__baseUrlNetCoreCPPSwagger,
                    moduleLink         : `${this.configService.getConfigValue('baseUrlNetCoreCPPEntryModule')}`,
                },
                {
                    type                  : '(DLL C++)',
                    name                  : '[App v. / Std v.]',
                    features              : '<Algorithm>',
                    appVersion            : this._AlgorithmAppVersion,
                    apiOrServerVersion    : this._Algorithm_CPPSTDVersion,
                    repoLink              : `${this.__baseUrlCppWebServerRepo}Algorithm.cpp`,
                    moduleLink            : `${this.configService.getConfigValue('baseUrlNetCoreCPPAlgorithmModule')}`,
                },
                {
                    type               : '(DLL C++)',
                    name               : '[App v. / Std v. / API v.]',
                    features           : '<OpenCv>',
                    appVersion         : this._OpenCvAppVersion,
                    stdVersion         : this._OpenCvCPPSTDVersion,
                    apiOrServerVersion : this._OpenCvAPIVersion,
                    repoLink           : `${this.configService.getConfigValue('baseUrlNetCoreCPPOpenCvRepo')}`,
                    moduleLink         : `${this.configService.getConfigValue('baseUrlNetCoreCPPOpenCvModule')}`,
                },
                {
                    type                : '(DLL C++)',
                    name                : '[App v. / Std v. / API v.]',
                    features            : '<Tesseract>',
                    appVersion          : this._tesseractAppVersion,
                    stdVersion          : this._tesseractCPPSTDVersion,
                    apiOrServerVersion  : this._tesseractAPIVersion,
                    repoLink            : `${this.configService.getConfigValue('baseUrlNetCoreCPPTesseractRepo')}`,
                    moduleLink          : `${this.configService.getConfigValue('baseUrlNetCoreCPPTesseractModule')}`,

                },
                {
                    type               : '(DLL C++)',
                    name               : '[App v. / Std v. / API v.]',
                    features           : '<Tensorflow>',
                    appVersion         : this._TensorFlowAPPVersion,
                    stdVersion         : this._TensorFlowCPPSTDVersion,
                    apiOrServerVersion : this._TensorFlowAPIVersion,
                    repoLink           : `${this.configService.getConfigValue('baseUrlNetCoreCPPTensorflowRepo')}`,
                    moduleLink         : `${this.configService.getConfigValue('baseUrlNetCoreCPPTensorflowModule')}`,
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
