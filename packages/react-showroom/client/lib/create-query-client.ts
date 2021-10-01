import { QueryClient } from '@showroomjs/bundles/query';
import { getCompilationKey } from '@showroomjs/core';
import Data from 'react-showroom-codeblocks';

export const createQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
        cacheTime: 1000000,
      },
    },
  });

  Data.items.forEach((item) => {
    Object.keys(item).forEach((sourceCode) => {
      const codeData = item[sourceCode];

      if (codeData) {
        queryClient.setQueryData(
          getCompilationKey(sourceCode, codeData.lang),
          codeData
        );
      }
    });
  });

  return queryClient;
};
