import fs from 'fs';
import { resolveShowroom } from './paths';

export const generateHtml = (
  scriptLinks: string,
  styleLinks: string,
  resouceHintLinks: string,
  options: {
    favicon?: string;
    resetCss?: boolean;
  }
) => {
  const content = `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />${
    options.favicon
      ? `<link rel="shortcut icon" href="${options.favicon}">`
      : ''
  }<!--SSR-helmet-->${resouceHintLinks}${
    options.resetCss
      ? `<style>*,::after,::before{box-sizing:border-box}html{-moz-tab-size:4;tab-size:4}html{line-height:1.15;-webkit-text-size-adjust:100%}body{margin:0}body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji'}hr{height:0;color:inherit}abbr[title]{text-decoration:underline dotted}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button}::-moz-focus-inner{border-style:none;padding:0}:-moz-focusring{outline:1px dotted ButtonText}:-moz-ui-invalid{box-shadow:none}legend{padding:0}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}</style>`
      : ''
  }<style>html,body,#target {height: 100%;}</style><!--SSR-style-->${styleLinks}</head>
<body><div id="target"><!--SSR-target--></div>${scriptLinks}</body></html>`;

  return content;
};

export const writeIndexHtml = (options: {
  favicon?: string;
  resetCss?: boolean;
}) => {
  fs.writeFileSync(
    resolveShowroom('index.html'),
    generateHtml(
      `<script type="module" src="/client/client-entry.tsx"></script>`,
      '',
      '',
      options
    )
  );
};
