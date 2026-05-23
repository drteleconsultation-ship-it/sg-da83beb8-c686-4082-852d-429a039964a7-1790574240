import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import Index from "./pages/Index";
import Services from "./pages/Services";
import NotFound from "./pages/NotFound";
import Analytics from "./pages/Analytics";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { logVisit } from "./services/visitorService";

// Log visitor on app load
logVisit(window.location.pathname);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/analytics",
    element: <Analytics />,
  },
  {
    path: "/services",
    element: <Services />,
  },
  {
    path: "/privacy-policy",
    element: <PrivacyPolicy />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);