import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MotionConfig } from 'motion/react';
import AppRoutes from './routes/AppRoutes.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import SweetAlertHost from './components/common/SweetAlertHost.jsx';
import { useGetMeQuery } from './store/api/authApi.js';
import { setCredentials } from './store/authSlice.js';
import { setCurrentRole, setCurrentUser } from './store/adminSlice.js';

function AuthSessionInitializer() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth?.token);
  const { data: meUser } = useGetMeQuery(undefined, { skip: !token });

  useEffect(() => {
    if (token && meUser) {
      dispatch(setCredentials({ user: meUser, token }));
      dispatch(setCurrentUser(meUser));
      if (meUser.role) {
        dispatch(setCurrentRole(meUser.role));
      }
    }
  }, [token, meUser, dispatch]);

  return null;
}

/**
 * Root Application Component
 * Coordinates global providers, Sanctum session hydration, Error Boundary, and React Router architecture
 */
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <AuthSessionInitializer />
        <AppRoutes />
        <SweetAlertHost />
      </ErrorBoundary>
    </MotionConfig>
  );
}
