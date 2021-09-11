import type { Packages } from '@showroomjs/core';

export interface ServerData {
  packages: Packages;
}

/**
 * Data injected as env variable via webpack.
 */
export const serverData = JSON.parse(
  process.env.serverData as string
) as ServerData;