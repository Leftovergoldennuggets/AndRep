import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import {
  ConvexReactClient,
} from "convex/react";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
}>()({
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <Outlet />
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </QueryClientProvider>
  );
}
