import { ReactShowroomComponentContent } from '@showroomjs/core/react';
import type { ComponentDoc } from 'react-docgen-typescript';
import * as React from 'react';
import { CodeImportsContextProvider } from '../lib/code-imports-context';
import { CodeVariablesContextProvider } from '../lib/code-variables-context';
import { CodeblocksContext } from '../lib/codeblocks-context';
import { ComponentMetaContext } from '../lib/component-props-context';

export const ComponentDataProvider = (props: {
  children: React.ReactNode;
  content: ReactShowroomComponentContent;
  metadata: ComponentDoc;
}) => {
  const {
    content: { imports, codeblocks, Component },
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
      <ComponentMetaContext.Provider value={metadata}>
        <CodeVariablesContextProvider value={codeVariables}>
          <CodeblocksContext.Provider value={codeblocks}>
            {props.children}
          </CodeblocksContext.Provider>
        </CodeVariablesContextProvider>
      </ComponentMetaContext.Provider>
    </CodeImportsContextProvider>
  );
};
