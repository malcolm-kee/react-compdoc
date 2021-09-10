import * as React from 'react';
import type { ComponentDocItem } from '@showroomjs/core';

export const ComponentDataContext = React.createContext<
  ComponentDocItem | undefined
>(undefined);
ComponentDataContext.displayName = 'ShowroomComponentDataContext';
