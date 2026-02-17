import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { UnlockMethod, Creator, Resource } from './types.ts';
import { ICONS } from './constants.tsx';
import Button from './components/Button.tsx';
import GlassCard from './components/GlassCard.tsx';
import { analyzeEngagement } from './services/geminiService.ts';
import { supabase, isSupabaseConfigured, supabaseConfigError } from './supabaseClient.js';
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username, brand_name: brandName } }
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          await supabase.from('profiles').insert([{
            id: data.user.id,
            username: username.toLowerCase().trim(),
            brand_name: brandName.trim(),
            profile_image: `https://api.dicebear.com/7.x/shapes/svg?seed=${username}`
          }]);
        }
        setSuccess("Check your email for the confirmation link!");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <GlassCard className="max-w-md w-full p-10 border border-white/5 shadow-2xl">
        <h2 className="text-4xl font-black mb-10 text-center uppercase tracking-tight">
          {mode === 'login' ? 'Welcome Back' : 'Join the Elite'}
        </h2>
        
        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs text-center">{error}</div>}
        {success && <div className="mb-6 p-4 bg-[#00F5FF]/10 border border-[#00F5FF]/20 rounded-xl text-[#00F5FF] text-sm text-center">{success}</div>}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#00F5FF]" placeholder="Username" />
              <input type="text" required value={brandName} onChange={e => setBrandName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#00F5FF]" placeholder="Brand Name" />
            </>
          )}
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#00F5FF]" placeholder="Email Address" />
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#00F5FF]" placeholder="Password" />
          <Button fullWidth className="py-4 shadow-xl shadow-[#00F5FF]/10" isLoading={isLoading}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
        <p className="mt-8 text-center text-sm text-gray-500">
          <Link to={mode === 'login' ? "/signup" : "/login"} className="text-[#00F5FF] font-bold hover:underline">
            {mode === 'login' ? 'Create an account' : 'Already have an account?'}
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

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [pRes, rRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('resources').select('*').eq('creator_id', user.id).order('created_at', { ascending: false })
    ]);
    if (pRes.data) setProfile(pRes.data);
    if (rRes.data) setResources(rRes.data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.main) return alert("Select the main file.");
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      const itemId = crypto.randomUUID();
      const mainPath = await uploadFile(files.main, 'resources', itemId);
      let previewPath = '';
      if (files.preview) previewPath = await uploadFile(files.preview, 'resources', itemId);

      await supabase.from('resources').insert([{
        id: itemId,
        creator_id: user.id,
        ...form,
        file_url: mainPath,
        preview_image: previewPath || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
        unlock_count: 0
      }]);
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00F5FF]"></div></div>;

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-16">
        <div className="flex items-center gap-6">
          <img src={profile?.profile_image} className="w-16 h-16 rounded-2xl border-2 border-[#00F5FF]/20 object-cover" alt="" />
          <div>
            <h1 className="text-3xl font-black uppercase">{profile?.brand_name}</h1>
            <p className="text-gray-500 text-sm">@{profile?.username}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate(`/u/${profile?.username}`)}>Public Link</Button>
          <Button onClick={() => setShowModal(true)}><ICONS.Plus /> New Resource</Button>
        </div>
      </header>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <GlassCard className="max-w-2xl w-full p-10 relative border border-white/10">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-500">✕</button>
            <h2 className="text-2xl font-black mb-8 uppercase">New Locked Resource</h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <input type="text" required placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3" />
              <div className="grid grid-cols-2 gap-4">
                <select value={form.unlock_method} onChange={e => setForm({...form, unlock_method: e.target.value as any})} className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <option value={UnlockMethod.MANUAL_CODE}>Secret Code</option>
                  <option value={UnlockMethod.TASK_VERIFICATION}>Social Task</option>
                </select>
                <input type="text" required placeholder="Requirement (Code/URL)" value={form.unlock_requirement} onChange={e => setForm({...form, unlock_requirement: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-3" />
              </div>
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 h-24" />
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">Upload Main File (Required)</label>
                <input type="file" required onChange={e => setFiles({...files, main: e.target.files?.[0] || null})} className="text-sm" />
              </div>
              <Button fullWidth isLoading={isCreating} type="submit">Launch Resource</Button>
            </form>
          </GlassCard>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {resources.map(res => (
            <GlassCard key={res.id} className="flex items-center justify-between p-4 group">
              <div className="flex items-center gap-4">
                <img src={res.preview_image} className="w-14 h-14 rounded-lg object-cover" alt="" />
                <div>
                  <h4 className="font-bold">{res.title}</h4>
                  <p className="text-xs text-gray-500">{res.unlock_count} Unlocks</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Profile & Unlock Views ---
const PublicProfile = () => {
  const { username } = useParams();
  const [creator, setCreator] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: c } = await supabase.from('profiles').select('*').eq('username', username).single();
      if (c) {
        setCreator(c);
        const { data: r } = await supabase.from('resources').select('*').eq('creator_id', c.id);
        setResources(r || []);
      }
      setLoading(false);
    };
    load();
  }, [username]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00F5FF]"></div></div>;

  return (
    <div className="max-w-5xl mx-auto p-6 pt-20">
      <div className="flex items-center gap-8 mb-12">
        <img src={creator?.profile_image} className="w-32 h-32 rounded-[2rem] border-4 border-white/10" alt="" />
        <h1 className="text-5xl font-black uppercase">{creator?.brand_name}</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {resources.map(res => (
          <GlassCard key={res.id} hoverable className="flex flex-col p-6">
            <img src={res.preview_image} className="w-full h-48 object-cover rounded-xl mb-6" alt="" />
            <h3 className="text-xl font-bold mb-4">{res.title}</h3>
            <Link to={`/u/${username}/unlock/${res.id}`} className="mt-auto">
              <Button fullWidth>Unlock Resource</Button>
            </Link>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

const UnlockPage = () => {
  const { id } = useParams();
  const [res, setRes] = useState<any>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');

  useEffect(() => {
    supabase.from('resources').select('*').eq('id', id).single().then(({data}) => setRes(data));
  }, [id]);

  const unlock = async () => {
    if (res.unlock_method === 'MANUAL_CODE' && input.toUpperCase() === res.unlock_requirement.toUpperCase()) {
      setUnlocked(true);
    } else if (res.unlock_method === 'TASK_VERIFICATION') {
      window.open(res.unlock_requirement, '_blank');
      setUnlocked(true);
    }
  };

  if (!res) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassCard className="max-w-md w-full p-10 text-center">
        {!unlocked ? (
          <>
            <div className="w-20 h-20 bg-[#00F5FF]/10 rounded-full flex items-center justify-center text-[#00F5FF] mx-auto mb-8"><ICONS.Lock /></div>
            <h2 className="text-3xl font-black mb-4 uppercase">Content Locked</h2>
            <p className="text-gray-400 mb-8">{res.title}</p>
            {res.unlock_method === 'MANUAL_CODE' && <input type="text" placeholder="Enter Code" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mb-4 text-center text-xl" value={input} onChange={e => setInput(e.target.value)} />}
            <Button fullWidth onClick={unlock}>Verify to Unlock</Button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-8"><ICONS.Unlock /></div>
            <h2 className="text-3xl font-black mb-8 uppercase">Unlocked!</h2>
            <Button fullWidth onClick={() => window.open(res.file_url)}>Download Resource</Button>
          </>
        )}
      </GlassCard>
    </div>
  );
};

// --- Configuration Error Screen ---
const ConfigErrorScreen = () => {
  const isInvalidFormat = supabaseConfigError === "invalid_format";
  
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0D0D0D]">
      <GlassCard className="max-w-lg w-full p-10 border border-red-500/20 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50"></div>
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-8 border border-red-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        
        <h2 className="text-3xl font-black uppercase tracking-tight mb-4 text-white">
          {isInvalidFormat ? "Wrong Key Format" : "Configuration Missing"}
        </h2>
        
        <div className="text-left bg-black/40 p-6 rounded-2xl border border-white/5 space-y-6 mb-8">
          {isInvalidFormat ? (
            <>
              <p className="text-red-400 text-sm font-bold uppercase tracking-widest">Action Required:</p>
              <p className="text-gray-300 text-sm leading-relaxed">
                It looks like you pasted a <span className="text-red-400 underline">Stripe</span> or <span className="text-red-400 underline">Placeholder</span> key into the SUPABASE_ANON_KEY field.
              </p>
              <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10 font-mono text-[11px] text-gray-400">
                <span className="text-red-400 font-bold">Wrong Format:</span> sb_publishable_...<br/>
                <span className="text-green-400 font-bold">Correct Format:</span> eyJhbGciOiJIUzI1... (starts with eyJ)
              </div>
              <p className="text-gray-400 text-xs">Find the correct "anon public" key in your Supabase Dashboard under Project Settings &gt; API.</p>
            </>
          ) : (
            <>
              <p className="text-[#00F5FF] text-sm font-bold uppercase tracking-widest">Troubleshooting Steps:</p>
              <ol className="list-decimal list-inside text-gray-400 text-sm space-y-3 font-medium">
                <li>Go to your <span className="text-white">Vercel Project Settings</span>.</li>
                <li>Rename your environment variables to include the <span className="text-[#00F5FF]">VITE_</span> prefix:</li>
                <div className="ml-5 bg-white/5 p-2 rounded font-mono text-[10px] text-[#00F5FF]">
                  VITE_SUPABASE_URL<br/>
                  VITE_SUPABASE_ANON_KEY
                </div>
                <li>Go to the <span className="text-white">Deployments</span> tab and click <span className="text-white">Redeploy</span>.</li>
              </ol>
            </>
          )}
        </div>
        
        <Button fullWidth onClick={() => window.location.reload()}>I've Updated My Settings - Refresh</Button>
      </GlassCard>
    </div>
  );
};

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
      <div className="min-h-screen gradient-bg">
        <nav className="fixed top-0 w-full z-[90] glass border-b border-white/5 px-8 py-5 flex items-center justify-between">
          <Link to="/" className="text-3xl font-black tracking-tighter">LOCK<span className="text-[#00F5FF]">FLOW</span></Link>
          <div className="flex gap-6 items-center">
            {user ? <Link to="/dashboard" className="text-xs font-black uppercase text-[#00F5FF]">Dashboard</Link> : <Link to="/login" className="text-xs font-black uppercase text-gray-400">Login</Link>}
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/u/:username" element={<PublicProfile />} />
          <Route path="/u/:username/unlock/:id" element={<UnlockPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
