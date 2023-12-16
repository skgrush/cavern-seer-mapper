import { Injectable } from '@angular/core';
import { BaseToolService } from './base-tool.service';
import { of } from 'rxjs';

@Injectable()
export class NoToolService extends BaseToolService {

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
