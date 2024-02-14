import { Injectable } from '@angular/core';
import { defer, from, tap } from 'rxjs';

@Injectable()
export class CompressionService {

  compressOrDecompressBlob$(compress: boolean, blob: Blob, format: CompressionFormat, ) {
    return defer(() => {
      const abortController = new AbortController();

      let pipedStream = blob.stream()
        .pipeThrough(
          compress ? new CompressionStream(format) : new DecompressionStream(format),
          {
            signal: abortController.signal,
          },
        );

      pipedStream = pipedStream.pipeThrough(
        new ByteLoggerStream(bytes => console.info(bytes)),
      );

      return from(
        new Response(pipedStream).blob()
      ).pipe(
        tap({
          unsubscribe: () => abortController.abort('unsubscribed'),
        }),
      );
    });
  }
}


class ByteLoggerStream extends TransformStream<Uint8Array, Uint8Array> {
  constructor(cb: (bytes: number) => void) {
    super({
      start() { },
      async transform(chunk, controller) {
        cb(chunk.length);

        controller.enqueue(chunk);
      }
    });
  }
}
