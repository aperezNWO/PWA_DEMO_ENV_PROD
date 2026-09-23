import { Component, signal, VERSION, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute                     } from '@angular/router';
import { PAGE_ABOUT_TECHNICAL_SPECS         } from 'src/app/_models/common';
import { BaseComponent                      } from 'src/app/_components/base/base.component';
import { SpeechService                      } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { ConfigService                      } from 'src/app/_services/__Utils/ConfigService/config.service'
import { VersionBundle, VersionCacheService } from 'src/app/_services/__Utils/VersionCacheService/version-cache.service';
import { BackendService                     } from '../../../../_services/BackendService/backend.service';

export interface ServiceVersionMeta {
  name: string;                         // e.g., "(Backend | [Java / SpringBoot])" or "(DLL C++ | [OpenCv])"
  appVersion?: string | null;           // e.g., "1.0.33.0" or "1.0.4"
  runtimeOrLangVersion?: string | null; // e.g., "21.0.12" or "2021"
  apiOrServerVersion?: string | null;   // e.g., "3.3.5", "6.0.8", or "4.13.0"
  stdVersion?: string | null;           // e.g., "C++20" or "C++17"
  repoLink?: string | null;             //
  healthLink?: string | null;           //
}

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
    _PythonWebServerVersion     = this.fromCache('pythonWebServerVersion');
    _PythonVersionTF            = this.fromCache('pythonVersionTF');
    _PythonWebServerVersionTF   = this.fromCache('pythonWebServerVersionTF');
    _JavaVersion                = this.fromCache('javaVersion');
    _JavaWebServerVersion       = this.fromCache('javaWebServerVersion');
    _NodeVersion                = this.fromCache('nodeVersion');
    _NodeWebServerVersion       = this.fromCache('nodeWebServerVersion');
    _NodeVersionOcr             = this.fromCache('nodeVersionOcr');
    _NodeWebServerVersionOcr    = this.fromCache('nodeWebServerVersionOcr');
    _ZigVersion                 = this.fromCache('zigVersion');
    _ZigWebServerVersion        = this.fromCache('zigWebServerVersion');
    _RustVersion                = this.fromCache('rustVersion');
    _RustWebServerVersion       = this.fromCache('rustWebServerVersion');
    _GoLangVersion              = this.fromCache('goLangVersion');
    _GoLangWebServerVersion     = this.fromCache('goLangWebServerVersion');
    _DartVersion                = this.fromCache('dartVersion');
    _DartWebServerVersion       = this.fromCache('dartWebServerVersion');
    _KotlinVersion              = this.fromCache('kotlinVersion');
    _KotlinWebServerVersion     = this.fromCache('kotlinWebServerVersion');
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

    ///////////////////////////////////////////////////////////////////////////////
    // REPO LINKS
    //////////////////////////////////////////////////////////////////////////////

    protected _baseUrlPythonDjango       : string | undefined = `${this.configService.getConfigValue('baseUrlDjangoPython')}`;
    protected _PythonDjangoRepo          : string | undefined = `${this.configService.getConfigValue('baseUrlDjangoPythonRepo')}`;
    protected _baseUrlPythonDjangoTF     : string | undefined = `${this.configService.getConfigValue('baseUrlDjangoPythonTF')}`;
    protected _PythonDjangoRepoTF        : string | undefined = `${this.configService.getConfigValue('baseUrlDjangoPythonTFRepo')}`;

    ///////////////////////////////////////////////////////////////////////////////
    // VERSIONS LOOKUP TABLE
    //////////////////////////////////////////////////////////////////////////////

  services: ServiceVersionMeta[] = [
        // <!-- .NET CORE / c#        -->
        // <tr><td><a [href]="[this._baseUrlNetCoreSwagger]"     target="_blank">(Backend | App Version |.NET Core Version | [ASP.NET Core x32 / C#])</a></td><td><b> v[{{this._webApiAppVersion    }}]/ v[5.0] </b></td></tr>
        {
          name                : '(Backend | App Version | .NET Core Version | [ASP.NET Core x32 / C#])',
          appVersion          : this._webApiAppVersion,
          runtimeOrLangVersion: 'v[5.0]', // PENDING FROM SERVER
          //repoLink          : PENDING,
          healthLink          : this._baseUrlNetCoreSwagger,
        },
        //<!-- SPRINGBOOT / JAVA       -->
        // <tr><td>(Backend | [Java   / SpringBoot)]                  </td><td><b>v[{{this._JavaVersion}}]       / v[{{this._JavaWebServerVersion}}]   </b></td></tr>
        {
          name: '(Backend | [Java / SpringBoot])',
          runtimeOrLangVersion: this._JavaVersion,
          apiOrServerVersion  : this._JavaWebServerVersion,
        },
        // <!-- Kotlin     / web server -->
        // <tr><td>(Backend | [Kotlin / SpringBoot)]                  </td><td><b>v[{{this._KotlinVersion}}]     / v[{{this._KotlinWebServerVersion}}] </b></td></tr>
        {
          name : '(Backend | [Kotlin / SpringBoot])',
          runtimeOrLangVersion: this._KotlinVersion,
          apiOrServerVersion  : this._KotlinWebServerVersion,
        },
/*
<!-- NODE.JS    / JAVASCRIPT -->
<tr><td>(Backend | [Node.js    / Javascript)(db/smtp/chat)]</td><td><b>v[{{this._NodeVersion      | cleanVersion }}]     / v[{{this._NodeWebServerVersion}}]       </b></td></tr>
<tr><td>(Backend | [Node.js    / Javascript)(Ocr/Opencv)  ]</td><td><b>v[{{this._NodeVersionOcr   | cleanVersion }}]    / v[{{this._NodeWebServerVersionOcr}}]    </b></td></tr>
<!-- DJANGO     / PYTHON-        -->
<tr><td>(Backend | [Python    / Django)(db)               </td><td><b><a [href]="[this._PythonDjangoRepo]" target="_blank">
                                                                    v[{{this.cleanPythonVersion}}]
                                                                   </a>
                                                                    /
                                                                   <a [href]="[`${this._baseUrlPythonDjango}health/?format=json` ]" target="_blank">
                                                                    v[{{ this._PythonWebServerVersion}}]
                                                                   </a>
                                                       </b></td></tr>
<!-- DJANGO     / PYTHON-/ TF    -->
<tr><td>(Backend | [Python    / Django)(Tensorflow)]       </td><td><b><a [href]="[this._PythonDjangoRepoTF]" target="_blank">
                                                                   v[{{this.cleanPythonVersionTF}}]
                                                                   </a>
                                                                   /
                                                                   <a [href]="[`${this._baseUrlPythonDjangoTF}health/?format=json` ]" target="_blank">
                                                                    v[{{ this._PythonWebServerVersionTF}}]
                                                                   </a>
                                                       </b></td></tr>
<!-- ZIG        / web server -->
<tr><td>(Backend | [Zig    / std.http.Server])             </td><td><b>v[{{this._ZigVersion}}]                           / v[{{this._ZigWebServerVersion       | cleanVersion }}]           </b></td></tr>
<!-- GoLang     / web server -->
<tr><td>(Backend | [GoLang / net-http])                    </td><td><b>v[{{this._GoLangVersion      | cleanVersion  }}]  / v[{{this._GoLangWebServerVersion    | cleanVersion }}]           </b></td></tr>
<!-- Dart       / web server -->
<tr><td>(Backend | [Dart   / Shelf])                       </td><td><b>v[{{this.cleanDartVersion}}]                      / v[{{this._DartWebServerVersion                     }}]           </b></td></tr>

*/
        // <!-- RUST / ACTIX-WEB       -->
        // <tr><td>(Backend | [Rust / Actix-web])                  </td><td><b>v[{{this._RustVersion}}]       / v[{{this._RustWebServerVersion}}]   </b></td></tr>
        {
          name: '(Backend | [Rust / Actix-web])',
          runtimeOrLangVersion: this._RustVersion,
          apiOrServerVersion  : this._RustWebServerVersion,
        },
        //<!-- .NET CORE / C++         -->
        //<tr><td><a [href]="[this._baseUrlNetCoreCPPSwagger]"  target="_blank">(Backend | App Version | .NET Core Version | [ASP.NET Core x64 / C++])</a></td><td><b>v[{{this._ASPNETCoreCppVersion}}] / v[8.0]  </b></td></tr>
        {
          name                : '(Backend | App Version | .NET Core Version | [ASP.NET Core x64 / C++])',
          appVersion          : this._ASPNETCoreCppVersion,
          runtimeOrLangVersion: 'v[8.0]', // PENDING FROM SERVER
          //repoLink          : PENDING,
          healthLink          : this._baseUrlNetCoreCPPSwagger,
        },
        /*
        <!-- C++ -->
        */
        //<tr><td>(DLL C++ | App Version  | Std Version | API Version | [Algorithm]  )</td><td><b>v[{{this._AlgorithmAppVersion}}]        / v[{{this._Algorithm_CPPSTDVersion}}]                                       </b></td></tr>
        {
            name      : '(DLL C++ | App Version | Std Version | API Version | [Algorithm])',
            appVersion: this._AlgorithmAppVersion,
            stdVersion: this._Algorithm_CPPSTDVersion,
        },
        // <tr><td>(DLL C++ | App Version  | Std Version | API Version | [OpenCv]     )</td><td><b>v[{{this._OpenCvAppVersion}}]           / v[{{this._OpenCvCPPSTDVersion}}]      / v[{{this._OpenCvAPIVersion}}]      </b></td></tr>
        {
            name               : '(DLL C++ | App Version | Std Version | API Version | [OpenCv])',
            appVersion         : this._OpenCvAppVersion,
            stdVersion         : this._OpenCvCPPSTDVersion,
            apiOrServerVersion : this._OpenCvAPIVersion,
        },
        //<tr><td>(DLL C++ | App Version  | Std Version | API Version | [Tesseract]  )</td><td><b>v[{{this._tesseractAppVersion}}]        / v[{{this._tesseractCPPSTDVersion}}]   / v[{{this._tesseractAPIVersion}}]   </b></td></tr>
        {
            name: '(DLL C++ | App Version | Std Version | API Version | [Tesseract])',
            appVersion        : this._tesseractAppVersion,
            stdVersion        : this._tesseractCPPSTDVersion,
            apiOrServerVersion: this._tesseractAPIVersion,
        },
        //  <tr><td>(DLL C++ | App Version  | Std Version | API Version | [Tensorflow] )</td><td><b>v[{{this._TensorFlowAPPVersion}}]       / v[{{this._TensorFlowCPPSTDVersion}}]  / v[{{this._TensorFlowAPIVersion}}]  </b></td></tr>
        {
            name: '(DLL C++ | App Version | Std Version | API Version | [Tensorflow])',
            appVersion        : this._TensorFlowAPPVersion,
            stdVersion        : this._TensorFlowCPPSTDVersion,
            apiOrServerVersion: this._TensorFlowAPIVersion,
        },
      ];

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

    //
    public get cleanPythonVersion(): string {
        if (!this._PythonVersion) return '';
        const match = this._PythonVersion.match(/^(\d+\.\d+\.\d+)/);
        return match ? match[1] : this._PythonVersion;
    }

    //
    public get cleanPythonVersionTF(): string {
        if (!this._PythonVersionTF) return '';
        const match = this._PythonVersionTF.match(/^(\d+\.\d+\.\d+)/);
        return match ? match[1] : this._PythonVersion;
    }

    //
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
        this._PythonWebServerVersion    = v.pythonWebServerVersion   ?? '(..loading..)';
        this._PythonVersionTF           = v.pythonVersionTF          ?? '(..loading..)';
        this._PythonWebServerVersionTF  = v.pythonWebServerVersionTF ?? '(..loading..)';
        this._JavaVersion               = v.javaVersion              ?? '(..loading..)';
        this._JavaWebServerVersion      = v.javaWebServerVersion   ?? '(..loading..)';
        this._NodeVersion               = v.nodeVersion            ?? '(..loading..)';
        this._NodeWebServerVersion      = v.nodeWebServerVersion   ?? '(..loading..)';
        this._NodeVersionOcr            = v.nodeVersionOcr           ?? '(..loading..)';
        this._NodeWebServerVersionOcr   = v.nodeWebServerVersionOcr  ?? '(..loading..)';
        this._ZigVersion                = v.zigVersion             ?? '(..loading..)';
        this._ZigWebServerVersion       = v.zigWebServerVersion    ?? '(..loading..)';
        this._GoLangVersion             = v.goLangVersion          ?? '(..loading..)';
        this._GoLangWebServerVersion    = v.goLangWebServerVersion ?? '(..loading..)';
        this._DartVersion               = v.dartVersion            ?? '(..loading..)';
        this._DartWebServerVersion      = v.dartWebServerVersion   ?? '(..loading..)';
        this._KotlinVersion             = v.kotlinVersion          ?? '(..loading..)';
        this._KotlinWebServerVersion    = v.kotlinWebServerVersion ?? '(..loading..)';
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

    //////////////////////////////////////////////////////////////////////////////

}
