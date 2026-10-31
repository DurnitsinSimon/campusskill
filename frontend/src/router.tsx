import { createBrowserRouter } from 'react-router';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [{ path: '/', element: <HomePage /> }],
  },
]);