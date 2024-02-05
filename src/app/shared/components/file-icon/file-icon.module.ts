import { NgModule } from '@angular/core';
import { FileIconComponent } from './file-icon.component';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';



@NgModule({
  imports: [FileIconComponent, MatIconModule],
  exports: [FileIconComponent],
})
export class FileIconModule {
  constructor(
    registry: MatIconRegistry,
    sanitizer: DomSanitizer,
  ) {
    registry.addSvgIconInNamespace(
      'svg',
      'glTF_White',
      sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/svg/glTF_White_June16.svg'),
    );
    registry.addSvgIconInNamespace(
      'svg',
      'CavernSeer',
      sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/fav/iconflat.svg'),
    );
  }
}
