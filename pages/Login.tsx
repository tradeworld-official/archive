import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Logo } from '../components/Logo';
import { ArrowRight, Lock, Mail } from 'lucide-react'; // Mail 아이콘 추가

export const Login: React.FC = () => {
  const [email, setEmail] = useState(''); // 이메일 상태 추가
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // 변경된 login 함수 호출 (이메일 + 비번)
    const { error } = await login(email, password);
    
    if (error) {
      setError("Login failed. Please check your email and password.");
      setLoading(false);
    } else {
      // 로그인 성공 시 페이지 이동
      navigate('/list');
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
          {/* 이메일 입력칸 (기존 디자인 스타일 유지) */}
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="email" 
              placeholder="Email" 
              className="pl-9" // 텍스트 중앙 정렬 제거 (이메일은 긴 경우가 많아 왼쪽 정렬이 보기 좋음)
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* 비밀번호 입력칸 */}
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
        
        {/* 기존 데모 비밀번호 안내 문구는 제거했습니다. 필요하면 다시 넣으셔도 됩니다. */}
      </div>
    </div>
  );
};
