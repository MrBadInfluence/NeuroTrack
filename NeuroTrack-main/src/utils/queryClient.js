/**
 * queryClient.js — React Query client singleton
 *
 * Shared QueryClient passed to QueryClientProvider in App.js.
 * Queries are considered fresh for 5 minutes and retry once on failure.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // keep data fresh for 5 minutes before refetching
      retry: 1,                  // retry once on network error
    },
  },
});
