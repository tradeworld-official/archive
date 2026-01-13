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

  // Don't show header on login page
  if (location.pathname === '/') {
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
            {isAuthenticated && (
              <>
                <Link to="/list">
                  <Button variant="ghost" size="icon">
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/admin">
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
            
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

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