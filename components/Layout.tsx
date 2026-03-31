import React from 'react';
import { useLocation, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/Button';
import { Logo } from './Logo';
import { Moon, Sun, LayoutGrid, LogOut, Settings } from 'lucide-react';

export const Layout: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  // 로그인 페이지(/login)에서만 상단 헤더를 숨깁니다.
  if (location.pathname === '/login') {
    return (
      <main className="min-h-screen bg-background">
        <div className="absolute top-4 right-4 z-50">
           <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-[1.2rem] w-[1.2rem]" /> : <Sun className="h-[1.2rem] w-[1.2rem]" />}
            </Button>
        </div>
        <Outlet />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 md:px-6 h-14 flex items-center justify-between">
          <Link to="/list" className="block text-foreground hover:opacity-80 transition-opacity">
             <Logo className="h-6 w-auto" />
          </Link>
          
          <nav className="flex items-center gap-2">
            {/* 1. 포트폴리오 리스트 (항상 노출) */}
            <Link to="/list">
              <Button variant="ghost" size="icon" title="Projects">
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </Link>

            {/* 2. 관리자 페이지 (항상 노출) 
                미로그인 상태로 클릭 시 App.tsx의 라우팅 설정에 의해 자동으로 /login 페이지로 리다이렉트 됩니다. */}
            <Link to="/admin">
              <Button variant="ghost" size="icon" title="Admin Dashboard">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            
            {/* 3. 다크모드 토글 (항상 노출) */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            {/* 4. 로그아웃 버튼 (항상 노출하되, 미로그인 시 비활성화) 
                disabled 속성이 들어가면 자동으로 클릭이 막히고 연한 회색(opacity-50)으로 처리됩니다. */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={logout}
              disabled={!isAuthenticated}
              title={isAuthenticated ? "Logout" : "Not logged in"}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
};
