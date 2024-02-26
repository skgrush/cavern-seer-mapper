import { SettingsDialogOpener } from './settings-dialog/settings-dialog.opener';
import { OpenDialogOpener } from './open-dialog/open-dialog.opener';
import { SaveDialogOpener } from './zip-download-model-dialog/save-dialog.opener';
import { CrossSectionRenderDialogOpener } from './cross-section-render-dialog/cross-section-render-dialog.opener';
import { ExportImageDialogOpener } from './export-image-dialog/export-image-dialog.opener';

export { ConfirmationDialogData } from './confirmation-dialog/confirmation-dialog.data';

import { makeEnvironmentProviders } from '@angular/core';
import { ConfirmationDialogService } from './confirmation-dialog/confirmation-dialog.service';
import { ExportModelDialogOpener } from './export-model-dialog/export-model-dialog.opener';

export {
  OpenDialogOpener,
  SaveDialogOpener,
  CrossSectionRenderDialogOpener,
  ConfirmationDialogService,
  SettingsDialogOpener,
  ExportImageDialogOpener,
  ExportModelDialogOpener,
};

export function provideDialogServices() {
  return makeEnvironmentProviders([
    ConfirmationDialogService,
    OpenDialogOpener,
    SaveDialogOpener,
    SettingsDialogOpener,
    CrossSectionRenderDialogOpener,
    ExportImageDialogOpener,
    ExportModelDialogOpener,
  ]);
}
