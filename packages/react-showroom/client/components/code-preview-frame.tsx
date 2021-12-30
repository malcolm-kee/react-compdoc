import { TerminalIcon } from '@heroicons/react/outline';
import { SupportedLanguage } from '@showroomjs/core';
import { Alert, icons } from '@showroomjs/ui';
import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useStableCallback } from '../lib/callback';
import { useCodeCompilation } from '../lib/use-code-compilation';
import { Div, Span } from './base';
import { CodePreview } from './code-preview';
import { ErrorFallback } from './error-fallback';

export interface CodePreviewFrameProps
  extends React.ComponentPropsWithoutRef<'div'> {
  code: string;
  lang: SupportedLanguage;
  nonVisual?: boolean;
  onIsCompilingChange?: (isCompiling: boolean) => void;
}

export const CodePreviewFrame = React.forwardRef<
  HTMLDivElement,
  CodePreviewFrameProps
>(function CodePreviewFrame(
  { code, lang, nonVisual, onIsCompilingChange, ...divProps },
  forwardedRef
) {
  const errorBoundaryRef = React.useRef<ErrorBoundary>(null);

  const { data, isCompiling, error, isError } = useCodeCompilation(code, lang);

  const onIsCompilingChangeCb = useStableCallback(onIsCompilingChange);
  React.useEffect(() => {
    onIsCompilingChangeCb(isCompiling);
  }, [isCompiling]);

  React.useEffect(() => {
    if (errorBoundaryRef.current) {
      errorBoundaryRef.current.reset();
    }
  }, [code]);

  return (
    <Div
      css={{
        position: 'relative',
        padding: nonVisual ? 0 : '$1',
        minHeight: nonVisual ? 0 : 30,
        backgroundColor: 'White',
      }}
      {...divProps}
      ref={forwardedRef}
    >
      {isError ? (
        <Alert variant="error">
          {typeof error === 'string' ? error : 'Compilation error'}
        </Alert>
      ) : (
        data &&
        (data.type === 'success' ? (
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            ref={errorBoundaryRef}
          >
            <CodePreview
              {...data}
              skipConsoleForInitialRender={lang === 'html'}
            />
          </ErrorBoundary>
        ) : (
          <Alert variant="error">{formatError(data.error)}</Alert>
        ))
      )}
      {isCompiling && !nonVisual && (
        <Div
          css={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            px: '$4',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(229, 231, 235, 0.1)',
            gap: '$2',
          }}
        >
          <TerminalIcon width="20" height="20" className={icons()} />
          <Span
            css={{
              color: '$gray-500',
            }}
          >
            Compiling...
          </Span>
        </Div>
      )}
    </Div>
  );
});

const formatError = (error: string) => error.replace(/<stdin>:|\"\\x0A\"/g, '');
