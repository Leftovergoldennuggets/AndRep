import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient } from "@tanstack/react-query";
import { ConvexReactClient } from "convex/react";
import "./index.css";

import { routeTree } from "./routeTree.gen";

// Create clients outside of components to avoid recreating them on re-renders
console.log("Main.tsx loading, VITE_CONVEX_URL:", import.meta.env.VITE_CONVEX_URL);
// Temporarily skip Convex if URL is not set
const convex = import.meta.env.VITE_CONVEX_URL 
  ? new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)
  : {} as ConvexReactClient;
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
