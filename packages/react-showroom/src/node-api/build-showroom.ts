require('source-map-support').install();

import { isDefined, omit, Ssr } from '@showroomjs/core';
import {
  NormalizedReactShowroomConfiguration,
  ReactShowroomConfiguration,
} from '@showroomjs/core/react';
import * as fs from 'fs-extra';
import * as path from 'path';
import { performance } from 'perf_hooks';
import webpack from 'webpack';
import { createClientWebpackConfig } from '../config/create-webpack-config';
import { createSSrBundle } from '../lib/create-ssr-bundle';
import { generateDts } from '../lib/generate-dts';
import { getConfig } from '../lib/get-config';
import { green, logToStdout, yellow } from '../lib/log-to-stdout';
import { resolveApp, resolveShowroom } from '../lib/paths';

async function buildStaticSite(
  config: NormalizedReactShowroomConfiguration,
  profile = false
) {
  const webpackConfig = createClientWebpackConfig('build', config, {
    outDir: config.outDir,
    profileWebpack: profile,
  });

  const compiler = webpack(webpackConfig);

  try {
    await new Promise<void>((fulfill, reject) => {
      compiler.run((err, stats) => {
        if (err || stats?.hasErrors()) {
          if (err) {
            console.error(err);
          }
          compiler.close(() => {
            console.error('Fix the error and try again.');
          });
          reject(err);
        }

        compiler.close(() => {
          fulfill();
        });
      });
    });

    const { manifest } = config.theme;

    if (manifest) {
      await fs.outputJSON(
        resolveApp(`${config.outDir}/manifest.json`),
        omit(manifest, ['baseIconPath'])
      );

      if (manifest.baseIconPath) {
        await fs.copy(
          resolveApp(manifest.baseIconPath),
          resolveApp(
            `${config.outDir}/_icons/${path.parse(manifest.baseIconPath).base}`
          )
        );
      }
    }
  } catch (err) {
    console.error(err);
  }
}

async function prerenderSite(
  config: NormalizedReactShowroomConfiguration,
  tmpDir: string
) {
  const prerenderCodePath = `${tmpDir}/server/prerender.js`;
  const htmlPath = resolveApp(`${config.outDir}/index.html`);

  const { ssr } = require(prerenderCodePath) as { ssr: Ssr };

  const template = await fs.readFile(htmlPath, 'utf-8');

  const routes = await ssr.getRoutes();

  if (config.basePath !== '') {
    logToStdout(`Prerender with basePath: ${config.basePath}`);
  }

  let pageCount = 0;

  for (const route of routes) {
    if (route !== '') {
      pageCount++;

      await fs.outputFile(
        resolveApp(`${config.outDir}/${route}/index.html`),
        await getHtml(`/${route}`)
      );
    }
  }

  await fs.outputFile(
    resolveApp(`${config.outDir}/_offline.html`),
    await getHtml('/_offline')
  );

  await fs.outputFile(htmlPath, await getHtml('/'));

  async function getHtml(pathname: string) {
    const prerenderResult = await ssr.render({ pathname });
    const helmet = ssr.getHelmet();
    const finalHtml = template
      .replace(
        '<!--SSR-style-->',
        `<style id="stitches">${ssr.getCssText()}</style>`
      )
      .replace(
        '<!--SSR-helmet-->',
        `${helmet.title.toString()}${helmet.meta.toString()}${helmet.link.toString()}`
      )
      .replace('<!--SSR-target-->', prerenderResult.result);

    prerenderResult.cleanup();

    return finalHtml;
  }

  return pageCount + 1;
}

async function prerenderPreview(
  config: NormalizedReactShowroomConfiguration,
  tmpDir: string
) {
  const prerenderCodePath = `${tmpDir}/server/previewPrerender.js`;
  const htmlPath = resolveApp(`${config.outDir}/_preview.html`);

  const { ssr } = require(prerenderCodePath) as { ssr: Ssr };

  const template = await fs.readFile(htmlPath, 'utf-8');

  const routes = await ssr.getRoutes();

  let pageCount = 0;

  for (const route of routes) {
    if (route !== '') {
      pageCount++;

      await fs.outputFile(
        resolveApp(`${config.outDir}/_preview/${route}/index.html`),
        await getHtml(`/${route}`)
      );
    }
  }

  async function getHtml(pathname: string) {
    const prerenderResult = await ssr.render({ pathname });
    const helmet = ssr.getHelmet();
    const finalHtml = template
      .replace(
        '<!--SSR-style-->',
        `<style id="stitches">${ssr.getCssText()}</style>`
      )
      .replace(
        '<!--SSR-helmet-->',
        `${helmet.title.toString()}${helmet.meta.toString()}${helmet.link.toString()}`
      )
      .replace('<!--SSR-target-->', prerenderResult.result);

    prerenderResult.cleanup();

    return finalHtml;
  }

  return pageCount;
}

async function prerenderInteraction(
  config: NormalizedReactShowroomConfiguration,
  tmpDir: string
) {
  const prerenderCodePath = `${tmpDir}/server/interactionPrerender.js`;
  const htmlPath = resolveApp(`${config.outDir}/_interaction.html`);

  const { ssr } = require(prerenderCodePath) as { ssr: Ssr };

  const template = await fs.readFile(htmlPath, 'utf-8');

  const routes = await ssr.getRoutes();

  let pageCount = 0;

  for (const route of routes) {
    if (route !== '') {
      pageCount++;

      await fs.outputFile(
        resolveApp(`${config.outDir}/_interaction/${route}/index.html`),
        await getHtml(`/${route}`)
      );
    }
  }

  async function getHtml(pathname: string) {
    const prerenderResult = await ssr.render({ pathname });
    const helmet = ssr.getHelmet();
    const finalHtml = template
      .replace(
        '<!--SSR-style-->',
        `<style id="stitches">${ssr.getCssText()}</style>`
      )
      .replace(
        '<!--SSR-helmet-->',
        `${helmet.title.toString()}${helmet.meta.toString()}${helmet.link.toString()}`
      )
      .replace('<!--SSR-target-->', prerenderResult.result);

    prerenderResult.cleanup();

    return finalHtml;
  }

  return pageCount;
}

export async function buildShowroom(
  userConfig?: ReactShowroomConfiguration,
  configFile?: string,
  profile?: boolean
) {
  const config = getConfig('build', configFile, userConfig);

  if (config.example.enableAdvancedEditor) {
    await generateDts(config, false);
  }

  const enableInteractions = config.experiments.interactions;

  if (enableInteractions) {
    logToStdout(yellow(`You are enabling experimental interactions features.`));
    logToStdout(
      yellow(
        `APIs for experimental features are not finalized and may be changed in minor version.`
      )
    );
  }

  const ssrDir = resolveShowroom(
    `ssr-result-${Date.now() + performance.now()}`
  );

  try {
    if (profile) {
      await buildStaticSite(config, profile);
      await createSSrBundle(config, ssrDir, profile);
    } else {
      await Promise.all([
        buildStaticSite(config, profile),
        createSSrBundle(config, ssrDir, profile),
      ]);
      logToStdout('Prerendering...');
      const [sitePageCount, previewPageCount, interactionPageCount] =
        await Promise.all([
          prerenderSite(config, ssrDir),
          prerenderPreview(config, ssrDir),
          enableInteractions ? prerenderInteraction(config, ssrDir) : undefined,
        ]);
      logToStdout(
        green(
          `Prerendered ${
            sitePageCount + previewPageCount + (interactionPageCount || 0)
          } pages (Site: ${sitePageCount}, Preview: ${previewPageCount}${
            isDefined(interactionPageCount)
              ? `, Interaction: ${interactionPageCount}`
              : ''
          }).`
        )
      );
      logToStdout(`Generated showroom at`);
      logToStdout(`  -  ${green(resolveApp(config.outDir))}`);
    }
  } finally {
    await fs.remove(ssrDir);
  }
}
