import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { demoFs } from "@/lib/demo-fs";
import { routeTree } from "@/routeTree.gen";

export function renderApp(url = "/") {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient, fs: demoFs },
    history: createMemoryHistory({ initialEntries: [url] }),
  });

  render(
    <ThemeProvider attribute="class">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <RouterProvider router={router} />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  );
  return { router, user: userEvent.setup() };
}
