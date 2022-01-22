import * as React from 'react';
import { mdxComponents, ErrorBound } from 'react-showroom/client';
import { MarkdownDocRoute } from '../components/markdown-doc-route';
import * as markdownCodeExampleResult from './documenting-others/markdown-code-example.mdx';
import markdownCodeExampleSource from './documenting-others/markdown-code-example.mdx?raw';
import markdownCodeExampleCodeblocks from './documenting-others/markdown-code-example.mdx?showroomRemarkCodeblocks';
import * as markdownCodeExampleImports from './documenting-others/markdown-code-example.mdx?showroomRemarkDocImports';
import * as markdownExampleResult from './documenting-others/markdown-example.mdx';
import markdownExampleSource from './documenting-others/markdown-example.mdx?raw';
import markdownExampleCodeblocks from './documenting-others/markdown-example.mdx?showroomRemarkCodeblocks';
import * as markdownExampleImports from './documenting-others/markdown-example.mdx?showroomRemarkDocImports';
import { useSetCompilationCaches } from './set-compilation-caches';

const { pre: Pre, code: Code } = mdxComponents;

export const MarkdownExampleSource = () => {
  useSetCompilationCaches([markdownExampleCodeblocks]);

  return (
    <Pre>
      <Code className="language-mdx" static fileName="docs/content.mdx">
        {markdownExampleSource}
      </Code>
    </Pre>
  );
};

export const MarkdownExampleResult = () => (
  <ErrorBound>
    <MarkdownDocRoute
      data={{
        Component: markdownExampleResult.default,
        headings: markdownExampleResult.headings,
        codeblocks: markdownExampleCodeblocks,
        imports: markdownExampleImports.imports,
      }}
      title="Title"
    />
  </ErrorBound>
);

export const MarkdownCodeExampleSource = () => {
  useSetCompilationCaches([markdownCodeExampleCodeblocks]);

  return (
    <Pre>
      <Code className="language-mdx" static fileName="docs/content.mdx">
        {markdownCodeExampleSource}
      </Code>
    </Pre>
  );
};

export const MarkdownCodeExampleResult = () => (
  <ErrorBound>
    <MarkdownDocRoute
      data={{
        Component: markdownCodeExampleResult.default,
        headings: markdownCodeExampleResult.headings,
        codeblocks: markdownCodeExampleCodeblocks,
        imports: markdownCodeExampleImports.imports,
      }}
      title="Code Blocks in Markdown"
    />
  </ErrorBound>
);
