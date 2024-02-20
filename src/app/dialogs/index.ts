import { makeEnvironmentProviders } from '@angular/core';
import { ConfirmationDialogService } from './confirmation-dialog/confirmation-dialog.service';
export { ConfirmationDialogData } from './confirmation-dialog/confirmation-dialog.data';
export { ConfirmationDialogService } from './confirmation-dialog/confirmation-dialog.service';


export function provideDialogServices() {
  return makeEnvironmentProviders([
    ConfirmationDialogService,
  ]);
}
