import HtmlWebpackPlugin from 'html-webpack-plugin';
import { omit } from 'lodash';
import * as webpack from 'webpack';
import {
  generateCompdocData,
  getImportsAttach,
} from '../lib/generate-compdoc-data';
import { getClientImportMap } from '../lib/get-client-import-map';
import { getConfig } from '../lib/get-config';
import { mergeWebpackConfig } from '../lib/merge-webpack-config';
import { moduleFileExtensions, resolveApp, resolveCompdoc } from '../lib/paths';
import { rehypeMetaAsAttribute } from '../lib/rehype-meta-as-attribute';
import { createBabelConfig } from './babel-config';
import VirtualModulesPlugin = require('webpack-virtual-modules');

const userConfig = getConfig().webpackConfig;

export const createWebpackConfig = async (
  mode: 'development' | 'production',
  { outDir = 'compdoc' } = {}
): Promise<webpack.Configuration> => {
  const isProd = mode === 'production';

  const clientImportMap = getClientImportMap();

  const importAttach = getImportsAttach();

  const virtualModules = new VirtualModulesPlugin({
    // create a virtual module that consists of parsed component data and examples
    // so we can import it inside our client
    [resolveCompdoc('node_modules/react-compdoc-components.js')]:
      await generateCompdocData(),
    // a virtual module that imports the components provided by app and attach it to window object
    [resolveCompdoc('node_modules/react-compdoc-app-components.js')]:
      importAttach,
  });

  return mergeWebpackConfig(
    {
      mode,
      entry: resolveCompdoc('client/index.tsx'),
      resolve: {
        extensions: moduleFileExtensions.map((ext) => `.${ext}`),
      },
      output: {
        path: resolveApp(outDir),
        publicPath: 'auto',
      },
      module: {
        rules: [
          {
            test: /\.(js|jsx|ts|tsx)$/,
            include: resolveCompdoc('client'),
            loader: require.resolve('babel-loader'),
            options: {
              presets: [() => createBabelConfig(mode)],
              babelrc: false,
              configFile: false,
            },
          },
          {
            test: /\.mdx?$/,
            use: [
              {
                loader: require.resolve('babel-loader'),
                options: {
                  presets: [() => createBabelConfig(mode)],
                  babelrc: false,
                  configFile: false,
                },
              },
              {
                loader: require.resolve('xdm/webpack.cjs'),
                options: {
                  rehypePlugins: [rehypeMetaAsAttribute],
                },
              },
            ],
          },
          {
            test: /\.wasm$/,
            type: 'asset/resource',
          },
        ],
      },
      devtool: isProd ? 'source-map' : 'cheap-module-source-map',
      plugins: [
        new webpack.EnvironmentPlugin({
          serverData: JSON.stringify({
            packages: Object.entries(clientImportMap).reduce(
              (result, [key, value]) => ({
                ...result,
                [key]: omit(value, ['path']),
              }),
              {}
            ),
          }),
        }),
        new HtmlWebpackPlugin({
          template: resolveCompdoc('client/index.html'),
        }),
        virtualModules,
      ],
      performance: {
        hints: false,
      },
      stats: 'none',
    },
    userConfig,
    mode
  );
};
