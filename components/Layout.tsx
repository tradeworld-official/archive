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

  // ✅ 이제 로그인 페이지(/login)에서만 상단 헤더를 숨깁니다.
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
            {/* ✅ 포트폴리오 리스트 아이콘은 누구나 볼 수 있습니다. */}
            <Link to="/list">
              <Button variant="ghost" size="icon">
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </Link>

            {/* ✅ 관리자 페이지 아이콘은 로그인한 사용자에게만 보입니다. */}
            {isAuthenticated && (
              <Link to="/admin">
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            )}
            
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            {/* ✅ 로그아웃 버튼은 로그인한 사용자에게만 보입니다. */}
            {isAuthenticated && (
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
};
