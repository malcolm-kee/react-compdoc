import { IdProvider } from '@radix-ui/react-id';
import sections from 'react-compdoc-sections';
import { Route, Switch } from 'react-router-dom';
import { ComponentDocArticle } from './components/component-doc-article';
import { DetailsPageContainer } from './components/details-page-container';
import { MarkdownArticle } from './components/markdown-article';
import { CodeThemeContext } from './lib/code-theme-context';
import { DefaultHomePage } from './pages/index';

const CODE_THEME = JSON.parse(process.env.CODE_THEME);

export const App = () => {
  return (
    <IdProvider>
      <CodeThemeContext.Provider value={CODE_THEME}>
        <Switch>
          {sections.map(function SectionRoute(section) {
            if (section.type === 'link') {
              return null;
            }

            if (section.type === 'group') {
              return (
                <Route
                  path={`/${section.slug}`}
                  exact={section.slug === ''}
                  key={section.slug}
                >
                  {section.items.map((item) => SectionRoute(item))}
                </Route>
              );
            }

            if (section.type === 'component') {
              return (
                <Route path={`/${section.slug}`} key={section.slug}>
                  <DetailsPageContainer
                    title={section.data.component.displayName}
                  >
                    <ComponentDocArticle doc={section} mode="standalone" />
                  </DetailsPageContainer>
                </Route>
              );
            }

            if (section.type === 'markdown') {
              return (
                <Route
                  path={`/${section.slug}`}
                  exact={section.slug === ''}
                  key={section.slug}
                >
                  <DetailsPageContainer
                    title={section.slug === '' ? undefined : section.title}
                    hideSidebar={section.frontmatter.hideSidebar}
                    hideHeader={section.frontmatter.hideHeader}
                  >
                    <MarkdownArticle section={section} />
                  </DetailsPageContainer>
                </Route>
              );
            }

            return null;
          })}
          <Route path="/" exact>
            <DefaultHomePage />
          </Route>
        </Switch>
      </CodeThemeContext.Provider>
    </IdProvider>
  );
};
