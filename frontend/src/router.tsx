import { createBrowserRouter } from "react-router";
import { Layout } from "./components/layout/Layout";
import { RequireAuth } from "./components/layout/RequireAuth";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { CatalogPage } from "./pages/catalog/CatalogPage";
import { WorkshopPage } from "./pages/workshop/WorkshopPage";
import { EnrollmentSuccessPage } from "./pages/workshop/EnrollmentSuccessPage";
import { ProfilePage } from './pages/profile/ProfilePage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <CatalogPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/workshops/:slug", element: <WorkshopPage /> },
      {
        path: "/workshops/:slug/enrolled",
        element: (
          <RequireAuth>
            <EnrollmentSuccessPage />
          </RequireAuth>
        ),
      },
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
