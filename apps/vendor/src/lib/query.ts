import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) => {
        const code = (error as { code?: string })?.code;
        if (code === '42501' || code === 'PGRST116') return false;
        return count < 2;
      },
      refetchOnWindowFocus: true,
    },
  },
});
