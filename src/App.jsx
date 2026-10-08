import { Routes, Route, Navigate } from 'react-router-dom';
import { MerchantProvider } from './context/MerchantContext';
import InstallGuide from './pages/InstallGuide';
import MerchantLogin from './merchant/MerchantLogin';
import MerchantLayout from './merchant/MerchantLayout';
import Overview from './merchant/Overview';
import Orders from './merchant/Orders';
import Products from './merchant/Products';
import StoreSettings from './merchant/StoreSettings';

// "/" will become the landing page later. /order, /rider and /admin come in the next phases.
export default function App() {
  return (
    <MerchantProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/merchant" replace />} />
        <Route path="/install" element={<InstallGuide />} />
        <Route path="/merchant/login" element={<MerchantLogin />} />
        <Route path="/merchant" element={<MerchantLayout />}>
          <Route index element={<Overview />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="settings" element={<StoreSettings />} />
        </Route>
        <Route path="*" element={<Navigate to="/merchant" replace />} />
      </Routes>
    </MerchantProvider>
  );
}