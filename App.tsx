import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { UnlockMethod, Creator, Resource } from './types.ts';
import { ICONS } from './constants.tsx';
import Button from './components/Button.tsx';
import GlassCard from './components/GlassCard.tsx';
import { analyzeEngagement } from './services/geminiService.ts';
import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { uploadFile, getSignedUrl, deleteFile } from './services/storageService.ts';

// --- Auth Guard ---
const ProtectedRoute = ({ children }: React.PropsWithChildren<{}>) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00F5FF]"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// --- Landing Page ---
const LandingPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative">
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00F5FF] rounded-full filter blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#8A2BE2] rounded-full filter blur-[120px] animate-pulse delay-1000"></div>
    </div>
    
    <h1 className="text-7xl md:text-9xl font-black mb-6 tracking-tighter neon-glow">
      LOCK<span className="text-[#00F5FF]">FLOW</span>
    </h1>
    <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl font-light">
      The premium gateway for creators. Secure your resources, verify engagement, and scale your brand.
    </p>
    
    <div className="flex flex-col sm:flex-row gap-6">
      <Link to="/signup">
        <Button className="w-64 py-5 text-lg shadow-lg">Get Started Free</Button>
      </Link>
      <Link to="/login">
        <Button variant="ghost" className="w-64 py-5 text-lg border border-white/10 hover:border-[#00F5FF]/50">Creator Login</Button>
      </Link>
    </div>
  </div>
);

// --- Login / Signup Page ---
const AuthPage = ({ mode }: { mode: 'login' | 'signup' }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [brandName, setBrandName] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);

  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setIsResending(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (error) throw error;
      setSuccess("Verification email has been sent! Check your inbox.");
      setShowResend(false);
    } catch (err: any) {
      setError(err.message || "Failed to resend confirmation email.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setShowResend(false);

    try {
      if (mode === 'signup') {
        if (!username || !brandName) throw new Error("Username and Brand Name are required.");
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, brand_name: brandName }
          }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert([{
            id: data.user.id,
            username: username.toLowerCase().trim(),
            brand_name: brandName.trim(),
            profile_image: `https://api.dicebear.com/7.x/shapes/svg?seed=${username}`,
            banner_image: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200'
          }]);
          
          if (profileError) {
             console.error("Profile creation error:", profileError);
          }
        }

        if (data.session) {
          navigate('/dashboard');
        } else {
          setSuccess("Welcome! We've sent a verification link to your email. Please verify your account before logging in.");
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        if (data.session) navigate('/dashboard');
      }
    } catch (err: any) {
      console.error("Auth Error Trace:", err);
      const message = err.message || "";
      const status = err.status;
      
      if (status === 429 || message.toLowerCase().includes("rate limit")) {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else if (message.toLowerCase().includes("email not confirmed") || message.toLowerCase().includes("confirm your email")) {
        setError("Your email hasn't been verified yet. Check your inbox or click below to resend.");
        setShowResend(true);
      } else if (message.toLowerCase().includes("invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(message || "An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <GlassCard className="max-w-md w-full p-10 border border-white/5 shadow-2xl">
        <h2 className="text-4xl font-black mb-2 text-center tracking-tight uppercase">
          {mode === 'login' ? 'Welcome Back' : 'Join the Elite'}
        </h2>
        <p className="text-gray-500 text-center mb-10 text-sm">
          {mode === 'login' ? 'Manage your locked premium content' : 'Start sharing your locked premium content today'}
        </p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-medium text-center animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-center gap-2 mb-2 font-bold uppercase tracking-widest">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
               Access Denied
            </div>
            <p className="mb-3 leading-relaxed">{error}</p>
            {showResend && (
              <Button 
                variant="outline" 
                fullWidth 
                onClick={handleResendConfirmation} 
                disabled={isResending}
                className="py-2 text-[10px] uppercase border-red-500/30 text-red-500 hover:bg-red-500/20"
              >
                {isResending ? 'Sending...' : 'Resend Verification Link'}
              </Button>
            )}
          </div>
        )}

        {success && (
          <div className="mb-6 p-6 bg-[#00F5FF]/10 border border-[#00F5FF]/20 rounded-xl text-white text-sm font-medium text-center animate-in fade-in zoom-in">
            <div className="text-[#00F5FF] mb-3 flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <p className="font-bold text-[#00F5FF] uppercase tracking-widest mb-2">Check Your Email</p>
            <p className="text-gray-300 leading-relaxed">{success}</p>
          </div>
        )}

        {!success && (
          <form className="space-y-5" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 font-bold">Username</label>
                  <input 
                    type="text" 
                    required 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00F5FF] transition-all" 
                    placeholder="tech_guru" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 font-bold">Brand</label>
                  <input 
                    type="text" 
                    required 
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00F5FF] transition-all" 
                    placeholder="Elite Studio" 
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 font-bold">Email Address</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00F5FF] transition-all" 
                placeholder="you@example.com" 
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 font-bold">Password</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00F5FF] transition-all" 
                placeholder="••••••••" 
              />
            </div>
            <Button fullWidth className="py-4 mt-6 shadow-xl shadow-[#00F5FF]/10" isLoading={isLoading}>
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        )}
        
        <p className="mt-8 text-center text-sm text-gray-500">
          {mode === 'login' ? "Don't have an account?" : "Already a creator?"} 
          <Link to={mode === 'login' ? "/signup" : "/login"} className="text-[#00F5FF] ml-2 font-bold hover:underline" onClick={() => { setSuccess(null); setError(null); setShowResend(false); }}>
            {mode === 'login' ? 'Register here' : 'Login now'}
          </Link>
        </p>
      </GlassCard>
    </div>
  );
};

// --- Dashboard ---
const Dashboard = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [profile, setProfile] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    unlock_method: UnlockMethod.MANUAL_CODE,
    unlock_requirement: '',
    file_type: 'PDF' as any,
  });
  const [files, setFiles] = useState<{ preview: File | null; main: File | null }>({ preview: null, main: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [pRes, rRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('resources').select('*').eq('creator_id', user.id).order('created_at', { ascending: false })
      ]);

      if (pRes.data) setProfile(pRes.data);
      if (rRes.data) {
        const resolved = await Promise.all(rRes.data.map(async (r: Resource) => {
          if (r.preview_image && r.preview_image.includes(user.id)) {
            try { r.preview_image = await getSignedUrl(r.preview_image); } catch(e) {}
          }
          return r;
        }));
        setResources(resolved);
      }
    } catch (err) {
      console.error("Fetch data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.main) return alert("Select the main file to lock.");
    setIsCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user session");

      const itemId = crypto.randomUUID();
      const mainPath = await uploadFile(files.main, 'resources', itemId);
      let previewPath = '';
      if (files.preview) {
        previewPath = await uploadFile(files.preview, 'resources', itemId);
      }

      const { error } = await supabase.from('resources').insert([{
        id: itemId,
        creator_id: user.id,
        ...form,
        file_url: mainPath,
        preview_image: previewPath || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400',
        unlock_count: 0
      }]);

      if (error) throw error;
      
      setShowModal(false);
      setForm({ title: '', description: '', unlock_method: UnlockMethod.MANUAL_CODE, unlock_requirement: '', file_type: 'PDF' });
      setFiles({ preview: null, main: null });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteResource = async (res: Resource) => {
    if (!confirm("Delete this resource and its files?")) return;
    try {
      if (res.file_url.includes(res.creator_id)) await deleteFile(res.file_url);
      if (res.preview_image && res.preview_image.includes(res.creator_id)) await deleteFile(res.preview_image);
      await supabase.from('resources').delete().eq('id', res.id);
      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00F5FF]"></div>
    </div>
  );

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div className="flex items-center gap-6">
          <img src={profile?.profile_image} className="w-20 h-20 rounded-2xl border-2 border-[#00F5FF]/20 object-cover" alt="" />
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight mb-1">{profile?.brand_name}</h1>
            <p className="text-gray-500 font-mono text-sm">Dashboard @{profile?.username}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate(`/u/${profile?.username}`)}>Public Link</Button>
          <Button variant="ghost" className="text-red-500" onClick={handleLogout}>Logout</Button>
          <Button onClick={() => setShowModal(true)}><ICONS.Plus /> New Resource</Button>
        </div>
      </header>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <GlassCard className="max-w-2xl w-full p-10 relative border border-white/10">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white text-2xl transition-colors">✕</button>
            <h2 className="text-3xl font-black mb-8 uppercase tracking-tight">Create Locked Content</h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Title</label>
                  <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-[#00F5FF]" placeholder="Free eBook..." />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Type</label>
                  <select value={form.file_type} onChange={e => setForm({...form, file_type: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-[#00F5FF]">
                    <option value="PDF">PDF</option>
                    <option value="ZIP">ZIP</option>
                    <option value="IMAGE">IMAGE</option>
                    <option value="LINK">EXTERNAL LINK</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Unlock Method</label>
                  <select value={form.unlock_method} onChange={e => setForm({...form, unlock_method: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-[#00F5FF]">
                    <option value={UnlockMethod.MANUAL_CODE}>Secret Code</option>
                    <option value={UnlockMethod.TASK_VERIFICATION}>Social Task (Link)</option>
                    <option value={UnlockMethod.TIME_DELAY}>Wait Timer (Secs)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Requirement</label>
                  <input type="text" required value={form.unlock_requirement} onChange={e => setForm({...form, unlock_requirement: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-[#00F5FF]" placeholder="e.g. CODE123" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Short Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm h-24 focus:outline-none focus:border-[#00F5FF]" placeholder="Tell them why they need this..." />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Preview Image</label>
                  <input type="file" accept="image/*" onChange={e => setFiles({...files, preview: e.target.files?.[0] || null})} className="text-xs text-gray-500 file:bg-white/10 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1 hover:file:bg-white/20 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Locked File (Private)</label>
                  <input type="file" required onChange={e => setFiles({...files, main: e.target.files?.[0] || null})} className="text-xs text-gray-500 file:bg-[#00F5FF]/10 file:text-[#00F5FF] file:border-0 file:rounded-md file:px-3 file:py-1 hover:file:bg-[#00F5FF]/20 cursor-pointer" />
                </div>
              </div>

              <Button fullWidth isLoading={isCreating} type="submit" className="py-4 shadow-xl shadow-[#00F5FF]/10">Launch Resource</Button>
            </form>
          </GlassCard>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <h3 className="text-2xl font-black uppercase tracking-tight border-b border-white/5 pb-4">Live Resources ({resources.length})</h3>
          <div className="grid grid-cols-1 gap-4">
            {resources.length === 0 ? (
              <div className="py-20 text-center text-gray-600 border-2 border-dashed border-white/5 rounded-3xl">
                No resources created yet. Click "New Resource" to start.
              </div>
            ) : (
              resources.map(res => (
                <GlassCard key={res.id} className="flex items-center justify-between p-4 group hover:border-[#00F5FF]/20 transition-all">
                  <div className="flex items-center gap-5">
                    <img src={res.preview_image} className="w-16 h-16 rounded-xl object-cover bg-white/5" alt="" />
                    <div>
                      <h4 className="font-bold text-lg">{res.title}</h4>
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">
                        {res.unlock_count || 0} Unlocks • {res.file_type} • {res.unlock_method.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" className="p-3 text-red-500/50 hover:text-red-500 hover:bg-red-500/10" onClick={() => deleteResource(res)}>✕</Button>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>
        
        <aside className="space-y-8">
          <h3 className="text-2xl font-black uppercase tracking-tight border-b border-white/5 pb-4">Smart Analytics</h3>
          <GlassCard className="bg-[#00F5FF]/5 border border-[#00F5FF]/10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-[#00F5FF]/10 rounded-full flex items-center justify-center text-[#00F5FF]"><ICONS.Chart /></div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Conversion Rate</p>
                <p className="text-2xl font-black">42.8%</p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-400 leading-relaxed italic">"Your React Guide is outperforming your Design kit by 12%. Consider moving it to the top of your list."</p>
              <Button variant="outline" fullWidth className="text-xs py-2">Full Insights Report</Button>
            </div>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
};

// --- Public Profile ---
const PublicProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicData = async () => {
      const { data: pData, error: pError } = await supabase.from('profiles').select('*').eq('username', username).single();
      if (pError || !pData) return setLoading(false);
      
      const { data: rData } = await supabase.from('resources').select('*').eq('creator_id', pData.id).order('created_at', { ascending: false });
      
      const resolvedRes = await Promise.all((rData || []).map(async (r: Resource) => {
        if (r.preview_image && r.preview_image.includes(pData.id)) {
          try { r.preview_image = await getSignedUrl(r.preview_image); } catch(e) {}
        }
        return r;
      }));

      setCreator(pData);
      setResources(resolvedRes);
      setLoading(false);
    };
    fetchPublicData();
  }, [username]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00F5FF]"></div></div>;
  if (!creator) return <div className="min-h-screen flex items-center justify-center text-gray-500">Profile not found.</div>;

  return (
    <div className="min-h-screen bg-[#0D0D0D] relative">
      <div className="h-80 relative overflow-hidden">
        <img src={creator.banner_image} className="w-full h-full object-cover opacity-40" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-transparent"></div>
      </div>
      
      <div className="max-w-5xl mx-auto px-6 -mt-24 relative z-10">
        <div className="flex flex-col md:flex-row items-end gap-8 mb-12">
          <img src={creator.profile_image} className="w-40 h-40 rounded-[3rem] border-8 border-[#0D0D0D] object-cover shadow-2xl" alt="" />
          <div className="flex-1 pb-4">
            <h1 className="text-5xl font-black tracking-tighter mb-2">{creator.brand_name}</h1>
            <p className="text-[#00F5FF] font-mono text-lg">@{creator.username}</p>
          </div>
        </div>

        <GlassCard className="mb-16 max-w-2xl border-white/5"><p className="text-gray-400 leading-relaxed text-lg">{creator.bio || "Sharing exclusive digital assets and premium guides."}</p></GlassCard>
        
        <h2 className="text-3xl font-black uppercase tracking-tight mb-10">Premium Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
          {resources.map(res => (
            <GlassCard key={res.id} hoverable className="flex flex-col group border border-white/5">
              <div className="relative h-48 rounded-2xl overflow-hidden mb-6">
                <img src={res.preview_image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                <div className="absolute top-4 right-4 glass px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#00F5FF]">{res.file_type}</div>
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-[#00F5FF] transition-colors">{res.title}</h3>
              <p className="text-gray-500 text-sm flex-1 mb-8 line-clamp-3 font-light">{res.description}</p>
              <Button fullWidth onClick={() => navigate(`/u/${username}/unlock/${res.id}`)}>Unlock To Download</Button>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Unlock Logic ---
const UnlockPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('resources').select('*').eq('id', id).single().then(({ data }) => {
      setResource(data);
      setLoading(false);
    });
  }, [id]);

  const handleUnlock = async () => {
    if (!resource) return;
    let success = false;
    
    if (resource.unlock_method === UnlockMethod.MANUAL_CODE && inputValue.trim().toUpperCase() === resource.unlock_requirement.trim().toUpperCase()) {
      success = true;
    } else if (resource.unlock_method === UnlockMethod.TASK_VERIFICATION) {
      window.open(resource.unlock_requirement, '_blank');
      await new Promise(r => setTimeout(r, 2000));
      success = true;
    } else if (resource.unlock_method === UnlockMethod.TIME_DELAY) {
      success = true;
    }

    if (success) {
      setIsUnlocked(true);
      await supabase.rpc('increment_unlock_count', { row_id: resource.id });
    } else {
      alert("Verification failed. Please try again.");
    }
  };

  const download = async () => {
    if (!resource) return;
    let url = resource.file_url;
    if (url.includes(resource.creator_id)) {
      url = await getSignedUrl(url);
    }
    window.open(url, '_blank');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00F5FF]"></div></div>;
  if (!resource) return <div className="min-h-screen flex items-center justify-center text-gray-500">Resource not found.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0D0D0D]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 opacity-10">
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-[#00F5FF]/20 rounded-full filter blur-[150px] -translate-x-1/2 -translate-y-1/2"></div>
      </div>
      
      <GlassCard className="max-w-lg w-full p-10 text-center border border-white/10 shadow-3xl">
        {!isUnlocked ? (
          <>
            <div className="w-24 h-24 bg-[#00F5FF]/10 rounded-3xl flex items-center justify-center text-[#00F5FF] mx-auto mb-10 animate-pulse border border-[#00F5FF]/20 shadow-inner">
              <ICONS.Lock />
            </div>
            <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">Locked Content</h2>
            <p className="text-gray-400 mb-10 text-lg">{resource.title}</p>
            <div className="bg-white/5 p-8 rounded-3xl mb-10 border border-white/5">
               {resource.unlock_method === 'MANUAL_CODE' ? (
                 <div className="space-y-4">
                   <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Enter Secret Access Code</p>
                   <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-center text-2xl font-black tracking-[0.5em] focus:border-[#00F5FF] transition-all uppercase" placeholder="••••••" />
                 </div>
               ) : (
                 <p className="text-gray-400 leading-relaxed">Complete the creator's requested action to gain immediate access to this resource.</p>
               )}
            </div>
            <Button fullWidth className="py-5 text-xl" onClick={handleUnlock}>Verify & Gain Access</Button>
          </>
        ) : (
          <div className="animate-in zoom-in duration-700">
            <div className="w-24 h-24 bg-green-500/10 rounded-3xl flex items-center justify-center text-green-500 mx-auto mb-10 border border-green-500/20 shadow-inner">
              <ICONS.Unlock />
            </div>
            <h2 className="text-4xl font-black mb-2 uppercase tracking-tighter">Access Granted</h2>
            <p className="text-gray-400 mb-12">The resource is now available for download.</p>
            <Button fullWidth variant="secondary" className="py-5 text-xl mb-4" onClick={download}>Download Now</Button>
            <Button variant="ghost" className="text-sm opacity-50" onClick={() => navigate(-1)}>Back to Profile</Button>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

// --- Configuration Error Screen ---
const ConfigErrorScreen = () => (
  <div className="min-h-screen flex items-center justify-center p-6 gradient-bg">
    <GlassCard className="max-w-md w-full p-10 border border-red-500/20 text-center shadow-2xl">
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-8 border border-red-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <h2 className="text-2xl font-black uppercase tracking-tight mb-4 text-white">Config Missing</h2>
      <p className="text-gray-400 text-sm mb-8 leading-relaxed">
        Supabase environment variables were not detected. To fix the "Black Screen" and enable core features:
      </p>
      <div className="text-left bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-xs text-gray-300 space-y-3 mb-8">
        <p>1. Go to Vercel Dashboard</p>
        <p>2. Add <span className="text-[#00F5FF]">SUPABASE_URL</span></p>
        <p>3. Add <span className="text-[#00F5FF]">SUPABASE_ANON_KEY</span></p>
        <p>4. Redeploy your application</p>
      </div>
      <Button fullWidth onClick={() => window.location.reload()}>Refresh Page</Button>
    </GlassCard>
  </div>
);

// --- App Entry ---
function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data?.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    return <ConfigErrorScreen />;
  }

  return (
    <Router>
      <div className="min-h-screen gradient-bg selection:bg-[#00F5FF] selection:text-black">
        <nav className="fixed top-0 w-full z-[90] glass border-b border-white/5 px-8 py-5 flex items-center justify-between">
          <Link to="/" className="text-3xl font-black tracking-tighter hover:opacity-80 transition-opacity">
            LOCK<span className="text-[#00F5FF]">FLOW</span>
          </Link>
          <div className="flex gap-8 items-center">
            {user ? (
              <Link to="/dashboard" className="text-xs font-black uppercase tracking-widest text-[#00F5FF] hover:brightness-125 transition-all">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all">Login</Link>
                <Link to="/signup">
                  <Button variant="outline" className="px-5 py-2 text-[10px] uppercase tracking-widest font-black h-auto">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </nav>

        <main className="pt-20">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/u/:username" element={<PublicProfile />} />
            <Route path="/u/:username/unlock/:id" element={<UnlockPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;