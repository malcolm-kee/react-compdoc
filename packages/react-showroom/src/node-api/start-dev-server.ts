// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

import type { ReactShowroomConfiguration } from '@showroomjs/core/react';
import path from 'path';
import { argv } from 'yargs';
import { createDevServer } from '../lib/create-dev-server';
import { generateDts } from '../lib/generate-dts';
import { getConfig } from '../lib/get-config';
import { logToStdout } from '../lib/log-to-stdout';
import { prepareUrls } from '../lib/prepare-url';

const { openBrowser } = require(path.resolve(
  __dirname,
  '..',
  '..',
  'open-browser',
  'open-browser.js'
));

export interface StartServerOptions extends ReactShowroomConfiguration {
  configFile?: string;
}

export async function startDevServer(
  userConfig?: ReactShowroomConfiguration,
  configFile?: string,
  measure?: boolean
) {
  logToStdout('Starting dev server...');

  const config = getConfig('development', configFile, userConfig);

  const { devServerPort, example } = config;

  if (example.enableAdvancedEditor) {
    await generateDts(config, { watch: true });
  }

  const HOST = '0.0.0.0';
  const PORT = Number((argv as any).port ?? process.env.PORT ?? devServerPort);

  const server = createDevServer(config, { measure, host: HOST, port: PORT });

  await server.start();

  const urls = prepareUrls('http', HOST, PORT, `${config.basePath}/`);

  openBrowser(urls.localUrlForBrowser);

  logToStdout(`Dev server available at ${urls.localUrlForTerminal}`);

  return server;
}
