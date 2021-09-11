/// <reference lib="WebWorker" />

import {
  CompilationError,
  CompileResult,
  RequestCompileData,
  transpileImports,
} from '@showroomjs/core';
import * as esbuild from 'esbuild-wasm';
import wasmPath from 'esbuild-wasm/esbuild.wasm';
import { serverData } from './server-data';

const esBuildIsReady = esbuild.initialize({
  wasmURL: wasmPath,
  worker: false,
});

self.onmessage = (ev) => {
  const data: RequestCompileData = ev.data;

  const handleError = (err: unknown) => {
    const errString = err instanceof Error ? err.message : String(err);

    const match = errString.match(errorRegex);

    const meta: CompilationError | undefined = match
      ? {
          type: 'compilationError',
          line: Number(match[1]),
        }
      : undefined;

    const errorResult: CompileResult = {
      type: 'error',
      error: String(err),
      messageId: data.messageId,
      meta,
    };
    self.postMessage(errorResult);
  };

  esBuildIsReady
    .then(() =>
      esbuild
        .transform(data.source, {
          loader: 'tsx',
          target: 'es2018',
        })
        .then((transformOutput) => {
          const result: CompileResult = {
            type: 'success',
            code: transpileImports(transformOutput.code, serverData.packages),
            messageId: data.messageId,
          };
          self.postMessage(result);
        })
    )
    .catch(handleError);
};

const errorRegex = /Transform failed with \d+ error:\s+<stdin>:(\d+):(\d+):/;