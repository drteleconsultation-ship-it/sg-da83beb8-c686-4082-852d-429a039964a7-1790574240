import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";

const router = createBrowserRouter([
  { path: "/", element: <Index /> },
  { path: "/admin/login", element: <AdminLogin /> },
  { path: "/admin/dashboard", element: <AdminDashboard /> },
  { path: "/admin", element: <AdminLogin /> },
  { path: "*", element: <NotFound /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
