import { AdminDashboard } from './components/AdminDashboard';
import { StorefrontApp } from './components/StorefrontApp';

const adminPath = import.meta.env.VITE_ADMIN_PATH ?? '/admin';

export function App() {
  if (window.location.pathname.startsWith(adminPath)) {
    return <AdminDashboard adminPath={adminPath} />;
  }

  return <StorefrontApp />;
}
