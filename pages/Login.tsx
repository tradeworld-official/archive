import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Logo } from '../components/Logo';
import { ArrowRight, Lock } from 'lucide-react';

export const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const err = await login(password);
    if (err) {
      setError(err);
    } else {
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
          <p className="text-sm text-muted-foreground">Enter access code to view the portfolio.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="password" 
              placeholder="Access Code" 
              className="pl-9 text-center"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full group">
            Enter Studio <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </form>
        
        <p className="text-xs text-muted-foreground mt-8">
          Password is <code className="bg-muted px-1 py-0.5 rounded">design123</code> for demo.
        </p>
      </div>
    </div>
  );
};