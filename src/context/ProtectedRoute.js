import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { UserAuth } from './AuthContext';


const ProtectedRoute = ({ children }) => {
    const { user } = UserAuth();
  
    return user ? children : <Navigate to="/" />;
    }

export default ProtectedRoute