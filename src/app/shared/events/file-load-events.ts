
export function convertFileLoadEvent<TIn, TOut>(
  inEvent: BaseFileLoadEvent<TIn>,
  convert: (inpObj: TIn) => TOut,
) {
  if (inEvent instanceof FileLoadCompleteEvent) {
    return new FileLoadCompleteEvent(convert(inEvent.result));
  }
  return inEvent as BaseFileLoadEvent<TOut>;
}

export abstract class BaseFileLoadEvent<T> { }
export class FileLoadStartEvent<T> extends BaseFileLoadEvent<T> { }
export class FileLoadProgressEvent<T> extends BaseFileLoadEvent<T> {
  constructor(readonly loaded: number, readonly total: number) {
    super();
  }
}
export class FileLoadCompleteEvent<T> extends BaseFileLoadEvent<T> {
  constructor(readonly result: T) {
    super();
  }
}
export type FileLoadEvent<T> =
  | FileLoadStartEvent<T>
  | FileLoadProgressEvent<T>
  | FileLoadCompleteEvent<T>;
