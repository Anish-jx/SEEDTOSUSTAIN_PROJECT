import React, { useState, useEffect, useRef } from 'react';
import { Leaf, Mail, Lock, User, ArrowRight, Eye, EyeOff, Sparkles, ArrowLeft, HelpCircle, KeyRound } from 'lucide-react';
import logo from '@/assets/images/logo.png';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

declare global {
    interface Window {
        VANTA: any;
        THREE: any;
    }
}

type AuthMode = 'login' | 'signup' | 'forgot-email' | 'forgot-question' | 'forgot-reset';

const SECURITY_QUESTIONS = [
    "What was the name of your first pet?",
    "What city were you born in?",
    "What is your mother's maiden name?",
    "What was the name of your first school?",
    "What is your favorite movie?",
];

export function AuthPage() {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [fetchedSecurityQuestion, setFetchedSecurityQuestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login, signup } = useAuth();
    const vantaRef = useRef<HTMLDivElement>(null);
    const vantaEffect = useRef<any>(null);

    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 20;

        const initVanta = () => {
            if (vantaEffect.current) return;
            if (window.VANTA && window.THREE && vantaRef.current) {
                try {
                    vantaEffect.current = window.VANTA.BIRDS({
                        el: vantaRef.current,
                        THREE: window.THREE,
                        mouseControls: true,
                        touchControls: true,
                        gyroControls: false,
                        minHeight: 200.00,
                        minWidth: 200.00,
                        scale: 1.00,
                        scaleMobile: 1.00,
                        backgroundColor: 0x0a0a0a,
                        color1: 0x10b981,
                        color2: 0x059669,
                        colorMode: "lerp",
                        birdSize: 1.2,
                        wingSpan: 25.00,
                        separation: 60.00,
                        alignment: 35.00,
                        cohesion: 35.00,
                        quantity: 4.00,
                        backgroundAlpha: 1.0
                    });
                } catch (error) {
                    console.error('Failed to initialize Vanta:', error);
                }
            } else {
                retryCount++;
                if (retryCount < maxRetries) setTimeout(initVanta, 200);
            }
        };
        setTimeout(initVanta, 100);
        return () => {
            if (vantaEffect.current) {
                vantaEffect.current.destroy();
                vantaEffect.current = null;
            }
        };
    }, []);

    const clearError = () => setError('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setIsLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back to Seed2Sustain!');
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters long'); return; }
        if (!securityAnswer.trim()) { setError('Please provide an answer to the security question'); return; }
        setIsLoading(true);
        try {
            await signup({ email, password, displayName, securityQuestion, securityAnswer } as any);
            toast.success('Account created successfully!');
        } catch (err: any) {
            setError(err.message || 'Failed to create account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/auth/forgot-password/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setFetchedSecurityQuestion(data.securityQuestion);
            setMode('forgot-question');
        } catch (err: any) {
            setError(err.message || 'Failed to find account');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAnswer = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/auth/forgot-password/verify-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, securityAnswer }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setResetToken(data.resetToken);
            setSecurityAnswer('');
            setMode('forgot-reset');
        } catch (err: any) {
            setError(err.message || 'Incorrect answer');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters long'); return; }
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/auth/forgot-password/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resetToken, newPassword: password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            toast.success('Password reset successfully! Please sign in.');
            setPassword('');
            setConfirmPassword('');
            setMode('login');
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    const goBack = () => {
        clearError();
        if (mode === 'forgot-question') setMode('forgot-email');
        else if (mode === 'forgot-reset') setMode('forgot-question');
        else setMode('login');
    };

    const inputClass = "w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/20 transition-all";
    const inputClassSm = "w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm";
    const labelClass = "text-xs font-semibold text-white/50 uppercase tracking-wider";

    const renderForm = () => {
        switch (mode) {
            case 'login':
                return (
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className={labelClass}>Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" size={18} />
                                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); clearError(); }} className={inputClass} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className={labelClass}>Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" size={18} />
                                <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); clearError(); }} className={inputClass} required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-emerald-400 transition-colors">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button type="button" onClick={() => { setMode('forgot-email'); clearError(); }} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors">Forgot password?</button>
                        </div>
                        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"><p className="text-sm text-red-400">{error}</p></div>}
                        <button type="submit" disabled={isLoading} className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Sign In</span><ArrowRight size={18} /></>}
                        </button>
                        <div className="text-center pt-4">
                            <span className="text-white/50 text-sm">Don't have an account? </span>
                            <button type="button" onClick={() => { setMode('signup'); clearError(); }} className="text-emerald-400 hover:text-emerald-300 font-semibold text-sm transition-colors">Sign up</button>
                        </div>
                    </form>
                );

            case 'signup':
                return (
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className={labelClass}>Name</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" size={16} />
                                    <input type="text" placeholder="John" value={displayName} onChange={(e) => { setDisplayName(e.target.value); clearError(); }} className={inputClassSm} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className={labelClass}>Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" size={16} />
                                    <input type="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); clearError(); }} className={inputClassSm} required />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className={labelClass}>Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" size={16} />
                                    <input type={showPassword ? "text" : "password"} placeholder="Min 6 chars" value={password} onChange={(e) => { setPassword(e.target.value); clearError(); }} className={inputClassSm} required minLength={6} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className={labelClass}>Confirm</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" size={16} />
                                    <input type={showPassword ? "text" : "password"} placeholder="Re-enter" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }} className={inputClassSm} required />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Security Question</label>
                            <select value={securityQuestion} onChange={(e) => setSecurityQuestion(e.target.value)} className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-all">
                                {SECURITY_QUESTIONS.map((q) => <option key={q} value={q} className="bg-gray-900">{q}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Answer</label>
                            <div className="relative group">
                                <HelpCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" size={16} />
                                <input type="text" placeholder="For password reset" value={securityAnswer} onChange={(e) => { setSecurityAnswer(e.target.value); clearError(); }} className={inputClassSm} required />
                            </div>
                        </div>
                        {error && <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg"><p className="text-xs text-red-400">{error}</p></div>}
                        <button type="submit" disabled={isLoading} className="w-full h-11 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Create Account</span><ArrowRight size={18} /></>}
                        </button>
                        <div className="text-center">
                            <span className="text-white/50 text-sm">Already have an account? </span>
                            <button type="button" onClick={() => { setMode('login'); clearError(); }} className="text-emerald-400 hover:text-emerald-300 font-semibold text-sm transition-colors">Sign in</button>
                        </div>
                    </form>
                );

            case 'forgot-email':
                return (
                    <form onSubmit={handleCheckEmail} className="space-y-5">
                        <button type="button" onClick={goBack} className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"><ArrowLeft size={16} /> Back to login</button>
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20"><KeyRound size={32} className="text-emerald-400" /></div>
                            <h3 className="text-xl font-bold text-white">Reset Password</h3>
                            <p className="text-white/50 text-sm mt-2">Enter your email to find your account</p>
                        </div>
                        <div className="space-y-2">
                            <label className={labelClass}>Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" size={18} />
                                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); clearError(); }} className={inputClass} required />
                            </div>
                        </div>
                        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"><p className="text-sm text-red-400">{error}</p></div>}
                        <button type="submit" disabled={isLoading} className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Continue</span><ArrowRight size={18} /></>}
                        </button>
                    </form>
                );

            case 'forgot-question':
                return (
                    <form onSubmit={handleVerifyAnswer} className="space-y-5">
                        <button type="button" onClick={goBack} className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"><ArrowLeft size={16} /> Back</button>
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20"><HelpCircle size={32} className="text-emerald-400" /></div>
                            <h3 className="text-xl font-bold text-white">Security Question</h3>
                            <p className="text-white/50 text-sm mt-2">Answer to continue</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10"><p className="text-sm text-white/80">{fetchedSecurityQuestion}</p></div>
                        <div className="space-y-2">
                            <label className={labelClass}>Your Answer</label>
                            <div className="relative group">
                                <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" size={18} />
                                <input type="text" placeholder="Enter your answer" value={securityAnswer} onChange={(e) => { setSecurityAnswer(e.target.value); clearError(); }} className={inputClass} required />
                            </div>
                        </div>
                        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"><p className="text-sm text-red-400">{error}</p></div>}
                        <button type="submit" disabled={isLoading} className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Verify Answer</span><ArrowRight size={18} /></>}
                        </button>
                    </form>
                );

            case 'forgot-reset':
                return (
                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20"><Lock size={32} className="text-emerald-400" /></div>
                            <h3 className="text-xl font-bold text-white">Set New Password</h3>
                            <p className="text-white/50 text-sm mt-2">Create a strong password</p>
                        </div>
                        <div className="space-y-2">
                            <label className={labelClass}>New Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" size={18} />
                                <input type={showPassword ? "text" : "password"} placeholder="Min 6 characters" value={password} onChange={(e) => { setPassword(e.target.value); clearError(); }} className={inputClass} required minLength={6} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-emerald-400 transition-colors">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className={labelClass}>Confirm Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" size={18} />
                                <input type={showPassword ? "text" : "password"} placeholder="Re-enter password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }} className={inputClass} required />
                            </div>
                        </div>
                        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"><p className="text-sm text-red-400">{error}</p></div>}
                        <button type="submit" disabled={isLoading} className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Reset Password</span><ArrowRight size={18} /></>}
                        </button>
                    </form>
                );
        }
    };

    const getTitle = () => { switch (mode) { case 'login': return 'Welcome back'; case 'signup': return 'Create account'; default: return ''; } };
    const getSubtitle = () => { switch (mode) { case 'login': return 'Sign in to access your dashboard'; case 'signup': return 'Start your smart farming journey'; default: return ''; } };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a]">
            <div ref={vantaRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />

            <div className="relative min-h-screen flex" style={{ zIndex: 10 }}>
                {/* Left Side - Branding */}
                <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 xl:px-24">
                    <div className="max-w-lg">
                        <div className="flex items-center gap-4 mb-8">
                            <img src={logo} alt="Seed2Sustain" className="w-16 h-16 rounded-2xl object-cover shadow-xl" />
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">Seed2Sustain</h1>
                                <p className="text-emerald-400 text-sm font-medium">Home-Grown Sustainability</p>
                            </div>
                        </div>
                        <h2 className="text-5xl xl:text-6xl font-bold text-white leading-tight mb-6">
                            The Future of
                            <span className="block bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">Home-Grown Food</span>
                        </h2>
                        <p className="text-lg text-white/60 leading-relaxed mb-10">
                            Empowering households to grow organic produce at home while reducing their carbon footprint.
                        </p>
                        <div className="space-y-4">
                            {['Zero-knowledge balcony farming', 'Real-time climate impact tracking', 'Net-zero household community'].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3 text-white/70">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30"><Sparkles className="w-3.5 h-3.5 text-emerald-400" /></div>
                                    <span className="text-sm font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side - Auth Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                    <div className="w-full max-w-md">
                        <div className="lg:hidden text-center mb-10">
                            <img src={logo} alt="Seed2Sustain" className="w-16 h-16 rounded-2xl object-cover shadow-xl mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-white">Seed2Sustain</h1>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl">
                            {(mode === 'login' || mode === 'signup') && (
                                <div className="text-center mb-6">
                                    <h3 className="text-2xl font-bold text-white mb-2">{getTitle()}</h3>
                                    <p className="text-white/50 text-sm">{getSubtitle()}</p>
                                </div>
                            )}
                            {renderForm()}
                        </div>
                        <p className="text-center text-white/30 text-xs mt-8">© 2026 Seed2Sustain. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
