import { ReactShowroomComponentContent } from '@showroomjs/core/react';
import * as React from 'react';
import type { ComponentDoc } from 'react-docgen-typescript';
import {
  CodeImportsContextProvider,
  DependenciesVersionsContextProvider,
} from '../lib/code-imports-context';
import { CodeVariablesContextProvider } from '../lib/code-variables-context';
import { CodeblocksContext } from '../lib/codeblocks-context';
import { ComponentMetaContext } from '../lib/component-props-context';

export const ComponentDataProvider = (props: {
  children: React.ReactNode;
  content: ReactShowroomComponentContent;
  metadata: ComponentDoc & { id: string };
}) => {
  const {
    content: { imports, codeblocks, Component, versions },
    metadata,
  } = props;

  const codeVariables = React.useMemo(() => {
    if (metadata.displayName && Component) {
      return {
        [metadata.displayName]: Component,
      };
    }
    return {};
  }, [metadata, Component]);

  return (
    <CodeImportsContextProvider value={imports}>
      <DependenciesVersionsContextProvider value={versions}>
        <ComponentMetaContext.Provider value={metadata}>
          <CodeVariablesContextProvider value={codeVariables}>
            <CodeblocksContext.Provider value={codeblocks}>
              {props.children}
            </CodeblocksContext.Provider>
          </CodeVariablesContextProvider>
        </ComponentMetaContext.Provider>
      </DependenciesVersionsContextProvider>
    </CodeImportsContextProvider>
  );
};
