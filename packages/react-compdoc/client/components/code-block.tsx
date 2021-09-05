import { TerminalIcon } from '@heroicons/react/outline';
import nightOwlTheme from 'prism-react-renderer/themes/nightOwl';
import * as React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { useCodeCompilation } from '../lib/compile-code';
import { css, icons } from '../stitches.config';
import { Alert } from './alert';
import { Div, Span } from './base';
import { CodeEditor, CodeEditorProps } from './code-editor';
import { CodeHighlight } from './code-highlight';
import { CodePreview } from './code-preview';
import * as Collapsible from './collapsible';

const IsBlockCodeContext = React.createContext(false);
IsBlockCodeContext.displayName = 'IsBlockCodeContext';

export const Pre = (props: { children: React.ReactNode }) => (
  <Div
    css={{
      marginTop: '$4',
      marginBottom: '$8',
    }}
  >
    <IsBlockCodeContext.Provider value={true}>
      {props.children}
    </IsBlockCodeContext.Provider>
  </Div>
);

export const Code = (props: {
  children: React.ReactNode;
  className?: string;
  static?: boolean;
}) => {
  const isBlockCode = React.useContext(IsBlockCodeContext);

  if (!isBlockCode) {
    return <code {...props} />;
  }

  const lang: any = props.className && props.className.split('-').pop();

  if (props.static) {
    const theme = nightOwlTheme;

    return (
      <Div
        style={{
          ...(typeof theme.plain === 'object' ? (theme.plain as any) : {}),
        }}
        css={{
          padding: 10,
          fontSize: 13,
          borderRadius: '$base',
          whiteSpace: 'pre',
          fontFamily: 'monospace',
        }}
      >
        <CodeHighlight
          code={props.children as string}
          language={lang}
          theme={theme}
        />
      </Div>
    );
  }

  return <CodeLiveEditor code={props.children as string} language={lang} />;
};

const CodeLiveEditor = (
  props: { code: string } & Pick<CodeEditorProps, 'language'>
) => {
  const [code, setCode] = React.useState(props.code);

  const { data, isFetching, isLoading, error, isError } =
    useCodeCompilation(code);

  const isCompiling = isFetching || isLoading;

  const [showCode, setShowCode] = React.useState<boolean | undefined>(false);

  return (
    <div>
      <Div
        css={{
          position: 'relative',
          minHeight: 48,
          border: '1px solid',
          borderColor: '$gray-300',
          padding: '$1',
          roundedT: '$base',
        }}
      >
        {isError ? (
          <Alert variant="error">
            {typeof error === 'string' ? error : 'Compilation error'}
          </Alert>
        ) : (
          data &&
          (data.type === 'success' ? (
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <CodePreview code={data.code} />
            </ErrorBoundary>
          ) : (
            <Alert variant="error">{formatError(data.error)}</Alert>
          ))
        )}
        {isCompiling && (
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
      <Collapsible.Root open={showCode} onOpenChange={setShowCode}>
        <Div
          css={{
            py: '$1',
          }}
        >
          <Collapsible.Button
            css={{
              display: 'flex',
              alignItems: 'center',
              gap: '$1',
              fontSize: '$sm',
              lineHeight: '$sm',
            }}
          >
            <Collapsible.ToggleIcon
              hide={showCode}
              aria-label={showCode ? 'Hide' : 'View'}
              width="16"
              height="16"
            />
            Code
          </Collapsible.Button>
        </Div>
        <Collapsible.Content>
          <CodeEditor
            code={code}
            onChange={setCode}
            language={props.language}
            className={editorBottom()}
          />
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
};

const editorBottom = css({
  borderRadius: '$base',
});

const ErrorFallback = (props: FallbackProps) => {
  return (
    <Alert variant="error">
      {props.error instanceof Error
        ? props.error.message
        : JSON.stringify(props.error)}
    </Alert>
  );
};

const formatError = (error: string) => error.replace(/<stdin>:|\"\\x0A\"/g, '');
