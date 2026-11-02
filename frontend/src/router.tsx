import { createBrowserRouter } from "react-router";
import { Layout } from "./components/layout/Layout";
import { RequireAuth } from "./components/layout/RequireAuth";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ProfilePage } from "./pages/ProfilePage";
import { CatalogPage } from "./pages/catalog/CatalogPage";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <CatalogPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      {
        path: "/me",
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },
    ],
  },
]);
