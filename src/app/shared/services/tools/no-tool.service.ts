import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { BaseExclusiveToolService } from './base-tool.service';

@Injectable()
export class NoToolService extends BaseExclusiveToolService {

  override readonly id = 'no-tool';
  override readonly label = 'No tool';
  override readonly icon = 'open_with';
  override readonly cursor$ = of('grab');

  override start() {
    return true;
  }
  override stop() {
    return true;
  }
}
