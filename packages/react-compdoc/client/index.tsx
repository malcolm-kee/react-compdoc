import Data from 'react-compdoc-components';
import * as ReactDOM from 'react-dom';
import { QueryClientProvider } from 'react-query';
import { App } from './app';
import { createQueryClient } from './lib/create-query-client';

const queryClient = createQueryClient();

const render =
  process.env.PRERENDER === 'true' ? ReactDOM.hydrate : ReactDOM.render;

render(
  <QueryClientProvider client={queryClient}>
    <App data={Data} />
  </QueryClientProvider>,
  document.getElementById('target')
);
