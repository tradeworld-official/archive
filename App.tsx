// App.tsx
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetail } from './pages/ProjectDetail';
import { Admin } from './pages/Admin';
import { EmailBuilder } from './pages/EmailBuilder';
import { AdminExhibitions } from './pages/AdminExhibitions'; // ✅ 새로 추가된 전시 관리 컴포넌트

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
        <HashRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* ✅ 누구나 볼 수 있는 퍼블릭 라우트 */}
              <Route index element={<Navigate to="/list" replace />} /> {/* 메인 접속 시 리스트로 이동 */}
              <Route path="list" element={<ProjectList />} />
              <Route path="project/:id" element={<ProjectDetail />} />
              
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

              {/* ✅ 보호되는 전시 관리 페이지 (추가) */}
              <Route path="admin/exhibitions" element={
                <ProtectedRoute>
                  <AdminExhibitions />
                </ProtectedRoute>
              } />

              {/* ✅ 보호되는 메일 빌더 페이지 (디자인/전시 통합 탭 적용) */}
              <Route path="admin/email" element={
                <ProtectedRoute>
                  <EmailBuilder />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
