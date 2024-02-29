import { Injectable } from '@angular/core';

declare global {
  interface NavigatorUAData {
    readonly brands: readonly { brand: string, version: string }[];
    readonly mobile: boolean;
    readonly platform: string;
  }

  interface Navigator {
    readonly userAgentData?: NavigatorUAData;
  }
}

export enum Platform {
  Windows = 1,
  MacOS = 2,
  iDevice = 3,
  Android = 4,
  Linux = 5,
  Other = 100,
}

@Injectable()
export class PlatformService {

  readonly platform =
    PlatformService.getPlatformFromUserAgentDataPlatform(window.navigator.userAgentData?.platform)
    ?? PlatformService.getPlatformFromNavigatorPlatform(window.navigator.platform)
    ?? Platform.Other;


  static getPlatformFromNavigatorPlatform(platform?: string | null) {
    if (!platform) {
      return undefined;
    }
    if (platform.startsWith('iP')) {
      return Platform.iDevice;
    }

    platform = platform.toLowerCase();

    if (platform === 'win32') {
      return Platform.Windows;
    }
    if (platform.startsWith('linux')) {
      return Platform.Linux;
    }
    if (platform.startsWith('mac')) {
      return Platform.MacOS;
    }

    return undefined;
  }

  static getPlatformFromUserAgentDataPlatform(userAgentDataPlatform?: string) {
    if (!userAgentDataPlatform) {
      return undefined;
    }

    userAgentDataPlatform = userAgentDataPlatform.toLowerCase();

    if (userAgentDataPlatform.startsWith('macos')) {
      return Platform.MacOS;
    }
    if (userAgentDataPlatform.startsWith('windows')) {
      return Platform.Windows;
    }
    if (userAgentDataPlatform.startsWith('android')) {
      return Platform.Android;
    }
    if (userAgentDataPlatform.startsWith('linux')) {
      return Platform.Linux;
    }

    return undefined;
  }
}
