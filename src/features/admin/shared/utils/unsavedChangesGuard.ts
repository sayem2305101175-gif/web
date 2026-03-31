import * as React from 'react';

const DEFAULT_GUARD_MESSAGE = 'You have unsaved admin changes. Leave this page anyway?';

interface AdminUnsavedGuardState {
  hasUnsavedChanges: boolean;
  message: string;
}

let guardState: AdminUnsavedGuardState = {
  hasUnsavedChanges: false,
  message: DEFAULT_GUARD_MESSAGE,
};

const setGuardState = (nextState: AdminUnsavedGuardState) => {
  guardState = nextState;
};

export const confirmAdminNavigation = () => {
  if (!guardState.hasUnsavedChanges) {
    return true;
  }

  return window.confirm(guardState.message);
};

export const useAdminUnsavedChangesGuard = (hasUnsavedChanges: boolean, message = DEFAULT_GUARD_MESSAGE) => {
  React.useEffect(() => {
    setGuardState({
      hasUnsavedChanges,
      message,
    });

    return () => {
      setGuardState({
        hasUnsavedChanges: false,
        message: DEFAULT_GUARD_MESSAGE,
      });
    };
  }, [hasUnsavedChanges, message]);

  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
};
