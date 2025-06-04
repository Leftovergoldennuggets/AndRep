import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient } from "@tanstack/react-query";
import { ConvexReactClient } from "convex/react";
import "./index.css";

import { routeTree } from "./routeTree.gen";

// Create clients outside of components to avoid recreating them on re-renders
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
const queryClient = new QueryClient();

const router = createRouter({ 
  routeTree,
  context: {
    queryClient,
    convexClient: convex,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
