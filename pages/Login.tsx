import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Logo } from '../components/Logo';
import { ArrowRight, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await login(email, password);
    
    if (error) {
      setError("Login failed. Please check your email and password.");
      setLoading(false);
    } else {
      // ✅ 로그인 성공 시 메인(list)이 아닌 관리자 페이지(admin)로 이동
      navigate('/admin');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-in fade-in duration-500">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2 flex flex-col items-center">
          <div className="w-64 mb-6 text-foreground">
             <Logo className="w-full h-auto" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sr-only">Private Access</h1>
          <p className="text-sm text-muted-foreground">Enter your credentials to view the portfolio.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="email" 
              placeholder="Email" 
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="password" 
              placeholder="Password" 
              className="pl-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" className="w-full group" disabled={loading}>
            {loading ? 'Verifying...' : 'Enter Studio'} 
            {!loading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
          </Button>
          
          {error && <p className="text-xs text-destructive">{error}</p>}
        </form>
      </div>
    </div>
  );
};
