import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MerchantProvider } from './context/MerchantContext';
import { AdminProvider } from './context/AdminContext';
import Landing from './pages/Landing';
import InstallGuide from './pages/InstallGuide';
import MerchantLogin from './merchant/MerchantLogin';
import MerchantLayout from './merchant/MerchantLayout';
import Overview from './merchant/Overview';
import Orders from './merchant/Orders';
import Products from './merchant/Products';
import StoreSettings from './merchant/StoreSettings';
import AdminLogin from './admin/AdminLogin';
import AdminLayout from './admin/AdminLayout';
import AdminOverview from './admin/AdminOverview';
import Riders from './admin/Riders';
import Stores from './admin/Stores';
import AdminOrders from './admin/AdminOrders';
import Settings from './admin/Settings';

export default function App() {
  return (
    <AuthProvider>
      <MerchantProvider>
        <AdminProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/install" element={<InstallGuide />} />

            <Route path="/merchant/login" element={<MerchantLogin />} />
            <Route path="/merchant" element={<MerchantLayout />}>
              <Route index element={<Overview />} />
              <Route path="orders" element={<Orders />} />
              <Route path="products" element={<Products />} />
              <Route path="settings" element={<StoreSettings />} />
            </Route>

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="riders" element={<Riders />} />
              <Route path="stores" element={<Stores />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AdminProvider>
      </MerchantProvider>
    </AuthProvider>
  );
}