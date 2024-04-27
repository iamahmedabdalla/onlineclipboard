// Routes
import { Route, Routes } from 'react-router-dom';
import { AuthContextProvider } from './context/AuthContext';


// Pages
import Index from './pages/Index';
import PageNotFound from './pages/PageNotFound';
import Register from './Auth/Register';
import Login from './Auth/Login';
import ForgotPassword from './Auth/ForgotPassword';
import ProtectedRoute from './context/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

import './App.css';

function App() {
  return (
    <div className="dark:bg-gray-900 dark:text-gray-50 h-full ">
      <AuthContextProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </AuthContextProvider>
    </div>
  );
}

export default App;
