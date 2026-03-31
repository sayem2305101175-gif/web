import * as React from 'react';
import { useReducedMotion } from './useReducedMotion';

interface DeviceConnection {
  effectiveType?: string;
  saveData?: boolean;
}

interface ViewerNavigator extends Navigator {
  deviceMemory?: number;
  connection?: DeviceConnection;
}

interface ThreeDViewerProfile {
  isConstrainedDevice: boolean;
  prefersReducedMotion: boolean;
}

export function use3DViewerProfile(): ThreeDViewerProfile {
  const prefersReducedMotion = useReducedMotion();
  const [isConstrainedDevice, setIsConstrainedDevice] = React.useState(false);

  React.useEffect(() => {
    if (typeof navigator === 'undefined') {
      return;
    }

    const currentNavigator = navigator as ViewerNavigator;
    const connection = currentNavigator.connection;
    const effectiveType = connection?.effectiveType ?? '';
    const hardwareConcurrency = currentNavigator.hardwareConcurrency ?? 8;
    const deviceMemory = currentNavigator.deviceMemory ?? 8;
    const isTouchDevice = (currentNavigator.maxTouchPoints ?? 0) > 0;

    const constrainedNetwork = Boolean(connection?.saveData) || /(^|-)2g/.test(effectiveType);
    const constrainedHardware = isTouchDevice && (hardwareConcurrency <= 4 || deviceMemory <= 4);

    setIsConstrainedDevice(constrainedNetwork || constrainedHardware);
  }, []);

  return { isConstrainedDevice, prefersReducedMotion };
}
