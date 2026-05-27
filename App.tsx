// App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetail } from './pages/ProjectDetail';
import { Admin } from './pages/Admin';
import { EmailBuilder } from './pages/EmailBuilder';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-background"></div>;
  }
  
  // 인증되지 않은 사용자가 관리자 페이지 접근 시 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return null;
    
    // 이미 로그인한 관리자가 로그인 페이지 접근 시 관리자 페이지로 리다이렉트
    if (isAuthenticated) {
        return <Navigate to="/admin" replace />;
    }
    return <>{children}</>;
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* ✅ 누구나 볼 수 있는 퍼블릭 라우트 */}
              <Route index element={<Navigate to="/project" replace />} /> {/* 메인 접속 시 프로젝트 목록으로 이동 */}
              <Route path="project" element={<ProjectList />} />
              <Route path="project/:slug" element={<ProjectDetail />} />
              
              {/* ✅ 관리자 로그인 페이지 */}
              <Route path="login" element={
                  <PublicOnlyRoute>
                      <Login />
                  </PublicOnlyRoute>
              } />
              
              {/* ✅ 보호되는 관리자 페이지 */}
              <Route path="admin" element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } />

              {/* ✅ 보호되는 메일 빌더 페이지 */}
              <Route path="admin/email" element={
                <ProtectedRoute>
                  <EmailBuilder />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
