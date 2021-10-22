import {
  ReactShowroomComponentContent,
  ReactShowroomComponentSection,
} from '@showroomjs/core/react';
import { css } from '@showroomjs/ui';
import * as React from 'react';
import { ComponentDataProvider } from '../components/component-data-provider';
import { ComponentDocArticle } from '../components/component-doc-article';
import { ComponentDocStandaloneEditor } from '../components/component-doc-standalone-editor';
import { DetailsPageContainer } from '../components/details-page-container';
import { Seo } from '../components/seo';
import { StandalonePageContainer } from '../components/standalone-page-container';
import { Route, Switch, useRouteMatch } from '../lib/routing';

export const ComponentDocRoute = ({
  section,
  content,
}: {
  section: ReactShowroomComponentSection;
  content: ReactShowroomComponentContent;
}) => {
  const { url } = useRouteMatch();

  return (
    <ComponentDataProvider content={content}>
      <Switch>
        <Route path={`${url}/_standalone/:codeHash`}>
          <StandalonePageContainer className={standalonePageStyle()}>
            <Seo
              title={content.metadata.displayName}
              description={content.metadata.description}
            />
            <ComponentDocStandaloneEditor
              slug={section.slug}
              content={content}
            />
          </StandalonePageContainer>
        </Route>
        <Route path={url}>
          <DetailsPageContainer
            title={content.metadata.displayName}
            description={content.metadata.description}
          >
            <ComponentDocArticle slug={section.slug} content={content} />
          </DetailsPageContainer>
        </Route>
      </Switch>
    </ComponentDataProvider>
  );
};

const standalonePageStyle = css({
  height: 'calc(100vh - 62px)',
});
