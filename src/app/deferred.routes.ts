import { importProvidersFrom } from "@angular/core";
import { Routes } from "@angular/router";
import { provideStore } from "@ngrx/store";
import { MainComponent } from "./pages/main/main.component";
import { RightTabNavComponent } from "./pages/right-tab-nav/right-tab-nav.component";
import { FileIconModule } from "./shared/components/file-icon/file-icon.module";
import { SidenavComponent } from "./pages/sidenav/sidenav.component";
import { MeshNormalMaterialService } from "./shared/services/materials/mesh-normal-material.service";
import { AnnotationBuilderService } from "./shared/services/annotation-builder.service";
import { CanvasService } from "./shared/services/canvas.service";
import { DialogOpenerService } from "./shared/services/dialog-opener.service";
import { ExportService } from "./shared/services/export.service";
import { FileTypeService } from "./shared/services/file-type.service";
import { LocalizeService } from "./shared/services/localize.service";
import { ModelLoadService } from "./shared/services/model-load.service";
import { ModelManagerService } from "./shared/services/model-manager.service";
import { ResizeService } from "./shared/services/resize.service";
import { provideSettings } from "./shared/services/settings";
import { ThemeService } from "./shared/services/theme.service";
import { ToolManagerService } from "./shared/services/tool-manager.service";
import { toolsProviders } from "./shared/services/tools";
import { MeshStandardMaterialService } from './shared/services/materials/mesh-standard-material.service';
import { CompressionService } from './shared/services/compression.service';

const deferredRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        outlet: 'main',
        component: MainComponent,
      },
      {
        path: '',
        outlet: 'left-side-nav',
        component: SidenavComponent,
      },
      {
        path: '',
        outlet: 'right-tab-nav',
        component: RightTabNavComponent,
      }
    ],
    providers: [
      provideStore(),
      CanvasService,
      ResizeService,
      ExportService,
      CompressionService,
      ThemeService,
      importProvidersFrom(FileIconModule),
      FileTypeService,
      LocalizeService,
      ModelLoadService,
      ModelManagerService,
      MeshNormalMaterialService,
      MeshStandardMaterialService,
      ToolManagerService,
      AnnotationBuilderService,
      DialogOpenerService,

      toolsProviders(),
      provideSettings(),
    ]
  }
];

export default deferredRoutes;
