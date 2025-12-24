import { Injectable, signal } from '@angular/core';
import { of } from 'rxjs';
import { BaseExclusiveToolService } from './base-tool.service';

@Injectable()
export class NoToolService extends BaseExclusiveToolService {

  override readonly id = 'no-tool';
  override readonly label = 'No tool';
  override readonly icon = signal(({ icon: 'open_with' } as const)).asReadonly();
  override readonly cursor$ = of('grab');

  override start() {
    return true;
  }
  override stop() {
    return true;
  }
}
