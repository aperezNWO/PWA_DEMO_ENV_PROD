/* tslint:disable */
/* eslint-disable */

export class FractalEngine {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Generates the fractal using primitive boundary inputs to avoid Wasm ABI mapping errors,
     * returning a flat Float64Array [x1, y1, intensity1, x2, y2, intensity2, ...]
     */
    generate(kind: number, x_min: number, x_max: number, y_min: number, y_max: number, max_iterations: number): Float64Array;
    constructor();
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_fractalengine_free: (a: number, b: number) => void;
    readonly fractalengine_generate: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly fractalengine_new: () => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
