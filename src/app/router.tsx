import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute, PublicRoute } from "./RouteGuards.tsx";
import { LoginPage } from "../features/auth/LoginPage.tsx";
import { RegisterPage } from "../features/auth/RegisterPage.tsx";
import { AppLayout } from "../layouts/AppLayout.tsx";
import { ChatPage } from "../features/chat/pages/ChatPage.tsx";
import { BillingPage } from "../features/subscription/pages/BillingPage.tsx";

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/app",
        element: <AppLayout />,
        children: [
          {
            path: "billing",
            element: <BillingPage />,
          },
          {
            path: ":conversationId?",
            element: <ChatPage />,
          },
        ],
      },
    ],
  },
  {
    path: "/billing",
    element: <Navigate to="/app/billing" replace />,
  },
  {
    path: "/pricing",
    element: <Navigate to="/app/billing" replace />,
  },
  {
    path: "/",
    element: <Navigate to="/app" replace />,
  },
  {
    path: "*",
    element: <Navigate to="/app" replace />,
  },
]);

