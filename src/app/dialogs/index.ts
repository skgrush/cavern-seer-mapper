export { ConfirmationDialogData } from './confirmation-dialog/confirmation-dialog.data';

import { makeEnvironmentProviders } from '@angular/core';
import { ConfirmationDialogService } from './confirmation-dialog/confirmation-dialog.service';
import { OpenDialogOpener } from './open-dialog/open-dialog.opener';
import { SaveDialogOpener } from './zip-download-model-dialog/save-dialog.opener';

export {
  OpenDialogOpener,
  SaveDialogOpener,
  ConfirmationDialogService,
};

export function provideDialogServices() {
  return makeEnvironmentProviders([
    ConfirmationDialogService,
    OpenDialogOpener,
    SaveDialogOpener,
  ]);
}
