import { getSafeName } from '@showroomjs/core';
import {
  ReactShowroomComponentSectionConfig,
  ReactShowroomSectionConfig,
  GetEditUrlFunction,
} from '@showroomjs/core/react';
import path from 'path';
import { logToStdout, yellow } from './log-to-stdout';
import { paths, resolveShowroom } from './paths';

let _nameIndex = 0;
const getName = (name: string) => getSafeName(name) + '_' + _nameIndex++;

export const generateCodeblocksData = (
  sections: Array<ReactShowroomSectionConfig>
) => {
  const codeBlocksImportPaths: Array<string> = [];

  function collectCodeblocks(section: ReactShowroomSectionConfig) {
    switch (section.type) {
      case 'component':
        if (section.docPath) {
          codeBlocksImportPaths.push(
            `${section.docPath}?showroomRemarkCodeblocks`
          );
        }

        break;

      case 'markdown': {
        if (section._associatedComponentName) {
          codeBlocksImportPaths.push(
            `${section.sourcePath}?showroomRemarkCodeblocks`
          );
        } else {
          codeBlocksImportPaths.push(
            `${section.sourcePath}?showroomRemarkDocCodeblocks`
          );
        }
        break;
      }

      case 'group':
        section.items.forEach(collectCodeblocks);
        break;

      default:
        break;
    }
  }

  sections.forEach(collectCodeblocks);

  return `${codeBlocksImportPaths
    .map((path, index) => `import block${index} from '${path}';`)
    .join('\n')}
  export default {
        items: [
            ${codeBlocksImportPaths
              .map((_, index) => `block${index}`)
              .join(',')}
        ],
    }`;
};

function compileComponentSection(
  component: ReactShowroomComponentSectionConfig,
  {
    metadataIdentifier,
    enableAdvancedEditor,
    getEditUrl,
  }: {
    metadataIdentifier: string;
    enableAdvancedEditor: boolean;
    getEditUrl?: GetEditUrlFunction;
  }
): string {
  const { docPath, sourcePath } = component;

  const { name: componentName } = path.parse(sourcePath);

  const editUrl =
    getEditUrl && docPath
      ? getEditUrl({
          relativePath: path.relative(paths.appPath, docPath),
        })
      : null;

  const load = docPath
    ? `async () => {
  const loadDoc = import(/* webpackChunkName: "${componentName}-doc" */'${docPath}');
  const loadImports = import(/* webpackChunkName: "${componentName}-imports" */'${docPath}?showroomRemarkImports');
  const loadCodeBlocks = import(/* webpackChunkName: "${componentName}-codeblocks" */'${docPath}?showroomRemarkCodeblocks');
  const Component = await import(/* webpackChunkName: "${componentName}" */'${sourcePath}');

  const { default: doc, headings } = await loadDoc;
  const { imports } = await loadImports;

  return {
    doc,
    headings,
    Component: Component.default || Component[${metadataIdentifier}.displayName] || Component,
    imports: imports || {},
    codeblocks: (await loadCodeBlocks).default || {},
    editUrl: ${JSON.stringify(editUrl)},
    loadDts: () => ${
      enableAdvancedEditor
        ? `import('${docPath}?showroomRemarkImportsDts')`
        : `Promise.resolve({default: {}})`
    },
  }    
}`
    : `async () => {
      const Component = await import(/* webpackChunkName: "${componentName}" */'${sourcePath}');

      return {
        Component: Component.default || Component[${metadataIdentifier}.displayName] || Component,
        doc: null,
        headings: [],
        imports: {},
        codeblocks: {},
        loadDts: () => Promise.resolve({ default: {} }),
      }
    }`;

  return `{
      load: ${load},
    }`;
}

interface ImportDefinition {
  type: 'star' | 'default';
  path: string;
  name: string;
}

export const generateSectionsAndImports = (
  sections: Array<ReactShowroomSectionConfig>,
  options: {
    enableAdvancedEditor: boolean;
    getEditUrl?: GetEditUrlFunction;
    skipEmptyComponent?: boolean;
  }
) => {
  const imports: Array<ImportDefinition> = [];
  const codeImportImports: Array<{
    path: string;
    name: string;
  }> = [];
  const compVar: Array<{
    identifier: string;
    sourcePath: string;
  }> = [];

  function collect(sectionList: Array<ReactShowroomSectionConfig>): string {
    return `[${sectionList
      .map((section) => {
        if (section.type === 'group') {
          return `{
            type: 'group',
            title: '${section.title}',
            items: ${collect(section.items)},
            slug: addTrailingSlash('${section.slug}'),
            ${section.hideFromSidebar ? 'hideFromSidebar: true,' : ''}
          }`;
        }

        if (section.type === 'component') {
          const name = getName('component');

          if (section.docPath) {
            codeImportImports.push({
              name,
              path: `${section.docPath}?showroomRemarkImports`,
            });
          }

          compVar.push({
            identifier: name,
            sourcePath: section.sourcePath,
          });

          return `${name} ? {
              type: 'component',
              data: ${compileComponentSection(section, {
                enableAdvancedEditor: options.enableAdvancedEditor,
                getEditUrl: options.getEditUrl,
                metadataIdentifier: name,
              })},
              metadata: ${name},
              title: ${name}.displayName,
              description: ${name}.description,
              slug: addTrailingSlash([${
                section.parentSlugs.length > 0
                  ? `'${section.parentSlugs.join('/')}',`
                  : ''
              } slugify(${name}.displayName, { lower: true })].join('/')),
              id: '${section.id}',
              ${section.hideFromSidebar ? 'hideFromSidebar: true,' : ''}
              shouldIgnore: ${!!options.skipEmptyComponent} && (${!section.docPath} && !${name}.description && Object.keys(${name}.props).length === 0),
            } : {
              shouldIgnore: true,
            }`;
          // because the component parsing may return nothing, so need to set a flag here and filter it at bottom
        }

        if (section.type === 'markdown') {
          const name = getName('markdown');

          imports.push({
            type: 'default',
            name: `${name}_frontmatter`,
            path: `${section.sourcePath}?showroomFrontmatter`,
          });

          const isTreatedAsComponentDoc = !!section._associatedComponentName;

          codeImportImports.push({
            name,
            path: `${section.sourcePath}?${
              isTreatedAsComponentDoc
                ? 'showroomRemarkImports'
                : 'showroomRemarkDocImports'
            }`,
          });

          const editUrl =
            options.getEditUrl && section.sourcePath
              ? options.getEditUrl({
                  relativePath: path.relative(
                    paths.appPath,
                    section.sourcePath
                  ),
                })
              : null;

          const chunkName = `${section.title || section.slug || ''}${name}`;

          return `{
              type: 'markdown',
              fallbackTitle: '${section.title || ''}',
              slug: addTrailingSlash('${section.slug}'),
              frontmatter: ${name}_frontmatter || {},
              ${section.hideFromSidebar ? 'hideFromSidebar: true,' : ''}
              ${
                isTreatedAsComponentDoc
                  ? `_associatedComponentName: '${section._associatedComponentName}',`
                  : ''
              }
              formatLabel: ${section.formatLabel.toString()},
              load: async () => {
                const loadComponent = import(/* webpackChunkName: "${chunkName}" */'${
            section.sourcePath
          }');
                const loadImports = import(/* webpackChunkName: "${chunkName}-imports" */'${
            section.sourcePath
          }?${
            isTreatedAsComponentDoc
              ? 'showroomRemarkImports'
              : 'showroomRemarkDocImports'
          }');
                const loadCodeblocks = import(/* webpackChunkName: "${chunkName}-codeblocks" */'${
            section.sourcePath
          }?${
            isTreatedAsComponentDoc
              ? 'showroomRemarkCodeblocks'
              : 'showroomRemarkDocCodeblocks'
          }');

                const { default: Component, headings } = await loadComponent;
                const { imports = {} } = await loadImports;

                return {
                  Component,
                  headings,
                  editUrl: ${JSON.stringify(editUrl)},
                  imports,
                  codeblocks: (await loadCodeblocks).default || {},
                  loadDts: () => ${
                    options.enableAdvancedEditor
                      ? `import('${section.sourcePath}?${
                          isTreatedAsComponentDoc
                            ? 'showroomRemarkImportsDts'
                            : 'showroomRemarkDocImportsDts'
                        }')`
                      : 'Promise.resolve({ default: {} })'
                  },
                }
              },
            }`;
        }

        return JSON.stringify(section);
      })
      .join(', ')}].filter(el => !el.shouldIgnore)`;
  }

  const result = collect(sections);

  return {
    sections: `import slugify from 'slugify';
    import allCompMetadata from 'react-showroom-all-components-docs';
    import { addTrailingSlash } from '@showroomjs/core';
    ${imports
      .map((imp) =>
        imp.type === 'default'
          ? `import ${imp.name} from '${imp.path}';`
          : `import * as ${imp.name} from '${imp.path}';`
      )
      .join('\n')}
    ${compVar
      .map(
        (varDef) =>
          `const ${varDef.identifier} = allCompMetadata['${varDef.sourcePath}'];`
      )
      .join('\n')}
    export default ${result}`,
    allImports: `${codeImportImports
      .map((imp) => `import * as ${imp.name} from '${imp.path}';`)
      .join('\n')}
    export default Object.assign({}, ${codeImportImports
      .map((imp) => `${imp.name}.imports`)
      .join(', ')});`,
  };
};

export const generateAllComponents = (
  sections: Array<ReactShowroomSectionConfig>
) => {
  const componentImports: Array<{
    name: string;
    sourcePath: string;
    codeblockPath: string | null;
  }> = [];

  function collect(sectionList: Array<ReactShowroomSectionConfig>): void {
    sectionList.forEach((section) => {
      if (section.type === 'group') {
        collect(section.items);
      }
      if (section.type === 'component') {
        const name = getName('component');

        componentImports.push({
          name,
          sourcePath: section.sourcePath,
          codeblockPath:
            section.docPath && `${section.docPath}?showroomRemarkCodeblocks`,
        });
      }
    });
  }

  collect(sections);

  if (componentImports.length === 0) {
    return `export const AllComponents = {};`;
  }

  return `import allCompMetadata from 'react-showroom-all-components-docs';
  ${componentImports
    .map(
      (comp) => `const ${comp.name} = require('${comp.sourcePath}');
  const _showroomMetadata_${comp.name} = allCompMetadata['${comp.sourcePath}'];
  ${
    comp.codeblockPath
      ? `import _code_${comp.name} from '${comp.codeblockPath}';`
      : ''
  }`
    )
    .join('\n')}

  export const AllComponents = Object.assign(
    ${componentImports
      .map((comp) => {
        const compVar = comp.name;
        const metadataVar = `_showroomMetadata_${comp.name}`;
        return `${metadataVar} ? {
      [${metadataVar}.displayName]: ${compVar}.default || ${compVar}[${metadataVar}.displayName] || ${compVar}
    } : {}`;
      })
      .join(', ')}
  );`;
};

export const generateAllComponentsPaths = (
  sections: Array<ReactShowroomSectionConfig>
) => {
  const result: Array<string> = [];

  function collect(sectionList: Array<ReactShowroomSectionConfig>): void {
    sectionList.forEach((section) => {
      if (section.type === 'group') {
        collect(section.items);
      }
      if (section.type === 'component') {
        result.push(section.sourcePath);
      }
    });
  }

  collect(sections);

  return JSON.stringify(result, null, 2);
};

export const generateAllComponentsDocs = (
  sections: Array<ReactShowroomSectionConfig>
) => {
  const componentPaths: Array<string> = [];

  function collect(sectionList: Array<ReactShowroomSectionConfig>): void {
    sectionList.forEach((section) => {
      if (section.type === 'group') {
        collect(section.items);
      }
      if (section.type === 'component') {
        componentPaths.push(section.sourcePath);
      }
    });
  }

  collect(sections);

  return `${componentPaths
    .map((path, index) => `import component${index} from '${path}?docgen';`)
    .join('\n')}

  const allComponentDocs = {};

  ${componentPaths
    .map(
      (_, index) => `if (component${index}) {
    allComponentDocs[component${index}.filePath] = component${index};
  }`
    )
    .join('\n')}
  
  export default allComponentDocs;`;
};

export const generateWrapper = (wrapper: string | undefined) => {
  if (wrapper) {
    return `import Wrapper from '${wrapper}';
      export default Wrapper`;
  }

  return `import * as React from 'react';
    export default React.Fragment;`;
};

export const generateDocPlaceHolder = (placeholder: string | undefined) => {
  if (placeholder) {
    return `import Placeholder from '${placeholder}';
    export default Placeholder`;
  }

  return `import { DocPlaceholder } from '${resolveShowroom(
    'client-dist/components/doc-placeholder.js'
  )}';
  export default DocPlaceholder`;
};

export const generateSearchIndex = (
  sections: Array<ReactShowroomSectionConfig>,
  includeHeadingsInIndex: boolean
) => {
  const compVar: Array<{
    identifier: string;
    sourcePath: string;
  }> = [];

  const imports: Array<ImportDefinition> = [];

  function collect(sectionList: Array<ReactShowroomSectionConfig>): string {
    return `[${sectionList
      .map((section) => {
        if (section.hideFromSidebar) {
          return 'undefined';
        }

        if (section.type === 'group') {
          return `{ type: 'group', items: ${collect(section.items)} }`;
        }

        if (section.type === 'component') {
          const name = getName('component');

          compVar.push({
            identifier: name,
            sourcePath: section.sourcePath,
          });

          const shouldIndexDoc = includeHeadingsInIndex && !!section.docPath;

          if (shouldIndexDoc) {
            imports.push({
              type: 'default',
              name: `${name}_doc`,
              path: `${section.docPath}?headings`,
            });
          }

          return `${name} && {
          type: 'component',
          metadata: ${name},
          title: ${name}.displayName,
          description: ${name}.description,
          slug: [${
            section.parentSlugs.length > 0
              ? `'${section.parentSlugs.join('/')}',`
              : ''
          } slugify(${name}.displayName, { lower: true })].join('/'),
          id: '${section.id}',
          ${shouldIndexDoc ? `headings: ${name}_doc,` : ''}
        }`;
        }

        if (section.type === 'markdown') {
          const name = getName('markdown');

          const mainData: ImportDefinition = {
            type: 'default',
            name: `${name}_frontmatter`,
            path: `${section.sourcePath}?showroomFrontmatter`,
          };

          if (includeHeadingsInIndex) {
            imports.push(
              {
                type: 'default',
                name: name,
                path: `${section.sourcePath}?headings`,
              },
              mainData
            );
          } else {
            imports.push(mainData);
          }

          return `{
            type: 'markdown',
            slug: '${section.slug}',
            frontmatter: ${name}_frontmatter || {},
            fallbackTitle: '${section.title || ''}',
            ${includeHeadingsInIndex ? `headings: ${name},` : ''}
            formatLabel: ${section.formatLabel.toString()},
          }`;
        }

        if (section.type === 'link') {
          return `{ type: 'link', href: '${section.href}', title: '${section.title}' }`;
        }
      })
      .join(', ')}].filter(Boolean)`;
  }

  const result = collect(sections);

  return `import slugify from 'slugify';
import allCompMetadata from 'react-showroom-all-components-docs';
${imports
  .map((imp) =>
    imp.type === 'default'
      ? `import ${imp.name} from '${imp.path}';`
      : `import * as ${imp.name} from '${imp.path}';`
  )
  .join('\n')}
${compVar
  .map(
    (varDef) =>
      `const ${varDef.identifier} = allCompMetadata['${varDef.sourcePath}'];`
  )
  .join('\n')}
export default ${result};`;
};

export const generateReactEntryCompat = (): string => {
  const ReactDomPath = require.resolve('react-dom', {
    paths: [paths.appPath],
  });

  const ReactDOM = require(ReactDomPath);

  const reactMajorVer = Number(ReactDOM.version.split('.')[0]);

  logToStdout(`Using React version ${yellow(reactMajorVer)}`);

  if (reactMajorVer <= 17) {
    return `import * as ReactDOM from 'react-dom';
    
    export const render = (ui, target) => {
      ReactDOM.render(ui, target);

      return function unmount() {
        ReactDOM.unmountComponentAtNode(target);
      }
    };

    export const hydrate = (ui, target) => {
      ReactDOM.hydrate(ui, target);

      return function unmount() {
        ReactDOM.unmountComponentAtNode(target);
      };
    };
`;
  } else {
    return `import { createRoot, hydrateRoot } from 'react-dom/client';
    
    export const render = (ui, target) => {
      const root = createRoot(target);

      root.render(ui);

      return function unmount() {
        root.unmount();
      }
    };

    export const hydrate = (ui, target) => {
      const root = hydrateRoot(target, ui);

      return function unmount() {
        root.unmount();
      };
    };
`;
  }
};
