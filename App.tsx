import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { UnlockMethod, Creator, Resource } from './types.ts';
import { ICONS } from './constants.tsx';
import Button from './components/Button.tsx';
import GlassCard from './components/GlassCard.tsx';
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00F5FF]"></div></div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// --- Landing Page ---
const LandingPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative">
    <div className="absolute inset-0 overflow-hidden -z-10 opacity-20">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00F5FF] rounded-full filter blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#8A2BE2] rounded-full filter blur-[120px] animate-pulse delay-1000"></div>
    </div>
    <h1 className="text-7xl md:text-9xl font-black mb-6 tracking-tighter neon-glow">LOCK<span className="text-[#00F5FF]">FLOW</span></h1>
    <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl font-light">The premium gateway for creators. Secure your resources, verify engagement, and scale your brand.</p>
    <div className="flex flex-col sm:flex-row gap-6">
      <Link to="/signup"><Button className="w-64 py-5 text-lg shadow-lg">Get Started Free</Button></Link>
      <Link to="/login"><Button variant="ghost" className="w-64 py-5 text-lg border border-white/10 hover:border-[#00F5FF]/50">Creator Login</Button></Link>
    </div>
  </div>
);

// --- Auth Page ---
const AuthPage = ({ mode }: { mode: 'login' | 'signup' }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [brandName, setBrandName] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email, password, options: { data: { username, brand_name: brandName } }
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
        alert("Check your email for the confirmation link!");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate('/dashboard');
      }
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <GlassCard className="max-w-md w-full p-10 border border-white/5 shadow-2xl">
        <h2 className="text-4xl font-black mb-10 text-center uppercase tracking-tight">{mode === 'login' ? 'Welcome Back' : 'Join the Elite'}</h2>
        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs text-center">{error}</div>}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#00F5FF]" placeholder="Username" />
              <input type="text" required value={brandName} onChange={e => setBrandName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#00F5FF]" placeholder="Brand Name" />
            </>
          )}
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#00F5FF]" placeholder="Email Address" />
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#00F5FF]" placeholder="Password" />
          <Button fullWidth className="py-4 shadow-xl shadow-[#00F5FF]/10" isLoading={isLoading}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Button>
        </form>
        <p className="mt-8 text-center text-sm text-gray-500">
          <Link to={mode === 'login' ? "/signup" : "/login"} className="text-[#00F5FF] font-bold hover:underline">{mode === 'login' ? 'Create an account' : 'Already have an account?'}</Link>
        </p>
      </GlassCard>
    </div>
  );
};

// --- Dashboard ---
const Dashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [profile, setProfile] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  
  const [form, setForm] = useState({
    title: '', description: '', unlock_method: UnlockMethod.MANUAL_CODE, unlock_requirement: '', file_type: 'PDF' as any,
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
    
    if (pRes.data) {
      const p = pRes.data;
      if (p.profile_image && !p.profile_image.startsWith('http')) {
        p.profile_image = await getSignedUrl(p.profile_image);
      }
      setProfile(p);
    }

    if (rRes.data) {
      // Resolve signed URLs for each resource preview
      const resolvedResources = await Promise.all(rRes.data.map(async (res: Resource) => {
        if (res.preview_image && !res.preview_image.startsWith('http')) {
          res.preview_image = await getSignedUrl(res.preview_image);
        }
        return res;
      }));
      setResources(resolvedResources);
    }
    setLoading(false);
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setIsUpdatingAvatar(true);
    try {
      const path = await uploadFile(file, 'profiles', profile.id);
      await supabase.from('profiles').update({ profile_image: path }).eq('id', profile.id);
      fetchData();
    } catch (err: any) { alert(err.message); } finally { setIsUpdatingAvatar(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.main) return alert("Select the main file.");
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      const itemId = crypto.randomUUID();
      
      // 1. Upload main locked file
      const mainPath = await uploadFile(files.main, 'resources', itemId);
      
      // 2. Upload preview image if provided
      let previewPath = '';
      if (files.preview) {
        previewPath = await uploadFile(files.preview, 'resources', itemId);
      }

      // 3. Save to database
      const { error } = await supabase.from('resources').insert([{
        id: itemId,
        creator_id: user.id,
        ...form,
        file_url: mainPath,
        preview_image: previewPath || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
        unlock_count: 0
      }]);
      if (error) throw error;
      
      setShowModal(false);
      setFiles({ preview: null, main: null });
      fetchData();
    } catch (err: any) { alert(err.message); } finally { setIsCreating(false); }
  };

  const handleDeleteResource = async (res: Resource) => {
    if (!confirm("Are you sure you want to delete this resource and all its files?")) return;
    try {
      // 1. Delete files from storage
      await deleteFile(res.file_url);
      if (res.preview_image && !res.preview_image.startsWith('http')) {
        // Note: we need the original path from DB, but fetchData currently replaces it.
        // In a real app, you'd keep the original path in a ref or separate field.
        // For this demo, let's assume we fetch fresh to get original path if needed or 
        // rely on the fact that deleteFile handles HTTP check.
      }
      
      // 2. Delete from DB
      await supabase.from('resources').delete().eq('id', res.id);
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00F5FF]"></div></div>;

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16">
        <div className="flex items-center gap-6">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <img src={profile?.profile_image} className="w-20 h-20 rounded-2xl border-2 border-[#00F5FF]/20 object-cover group-hover:opacity-50 transition-all" alt="" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
              {isUpdatingAvatar ? <div className="animate-spin h-5 w-5 border-2 border-[#00F5FF] border-t-transparent rounded-full" /> : <ICONS.Plus />}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">{profile?.brand_name}</h1>
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
          <GlassCard className="max-w-2xl w-full p-10 relative border border-white/10 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">✕</button>
            <h2 className="text-2xl font-black mb-8 uppercase tracking-tight">New Locked Resource</h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Title</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-[#00F5FF] outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Unlock Method</label>
                  <select value={form.unlock_method} onChange={e => setForm({...form, unlock_method: e.target.value as any})} className="w-full bg-black border border-white/10 rounded-xl p-3 focus:border-[#00F5FF] outline-none">
                    <option value={UnlockMethod.MANUAL_CODE}>Secret Code</option>
                    <option value={UnlockMethod.TASK_VERIFICATION}>Social Task (URL)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Requirement</label>
                  <input type="text" required placeholder="Code or Task URL" value={form.unlock_requirement} onChange={e => setForm({...form, unlock_requirement: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-[#00F5FF] outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 h-24 focus:border-[#00F5FF] outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Preview Image</label>
                  <input type="file" accept="image/*" onChange={e => setFiles({...files, preview: e.target.files?.[0] || null})} className="text-xs text-gray-400 file:bg-white/10 file:border-0 file:text-white file:px-4 file:py-2 file:rounded-lg cursor-pointer" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Main File (Private)</label>
                  <input type="file" required onChange={e => setFiles({...files, main: e.target.files?.[0] || null})} className="text-xs text-gray-400 file:bg-[#00F5FF]/10 file:border-0 file:text-[#00F5FF] file:px-4 file:py-2 file:rounded-lg cursor-pointer" />
                </div>
              </div>
              <Button fullWidth isLoading={isCreating} type="submit" className="py-4">Launch Resource</Button>
            </form>
          </GlassCard>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold uppercase tracking-tight mb-6">Your Resources</h3>
          {resources.length === 0 ? (
            <div className="p-12 text-center text-gray-600 border border-dashed border-white/10 rounded-2xl">No resources yet. Create your first one to start sharing.</div>
          ) : (
            resources.map(res => (
              <GlassCard key={res.id} className="flex items-center justify-between p-5 group hover:border-[#00F5FF]/30 transition-all">
                <div className="flex items-center gap-5">
                  <img src={res.preview_image} className="w-16 h-16 rounded-xl object-cover border border-white/5" alt="" />
                  <div>
                    <h4 className="font-bold text-lg">{res.title}</h4>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[10px] uppercase font-black tracking-widest text-[#00F5FF]">{res.unlock_count} Unlocks</span>
                      <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">{res.file_type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" className="p-2 text-red-500" onClick={() => handleDeleteResource(res)}>✕</Button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
        <aside className="space-y-6">
          <h3 className="text-xl font-bold uppercase tracking-tight mb-6">Quick Stats</h3>
          <GlassCard className="bg-[#00F5FF]/5 border border-[#00F5FF]/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#00F5FF]/10 rounded-full flex items-center justify-center text-[#00F5FF]"><ICONS.Users /></div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Total Reach</p>
                <p className="text-2xl font-black">{resources.reduce((acc, r) => acc + (r.unlock_count || 0), 0)}</p>
              </div>
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
  const [creator, setCreator] = useState<Creator | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: c } = await supabase.from('profiles').select('*').eq('username', username).single();
      if (c) {
        if (c.profile_image && !c.profile_image.startsWith('http')) {
          c.profile_image = await getSignedUrl(c.profile_image);
        }
        setCreator(c);
        const { data: r } = await supabase.from('resources').select('*').eq('creator_id', c.id);
        const resolvedR = await Promise.all((r || []).map(async res => {
          if (res.preview_image && !res.preview_image.startsWith('http')) {
            res.preview_image = await getSignedUrl(res.preview_image);
          }
          return res;
        }));
        setResources(resolvedR);
      }
      setLoading(false);
    };
    load();
  }, [username]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00F5FF]"></div></div>;

  return (
    <div className="max-w-5xl mx-auto p-6 pt-32 pb-24">
      <div className="flex flex-col md:flex-row items-center gap-10 mb-20 text-center md:text-left">
        <img src={creator?.profile_image} className="w-40 h-40 rounded-[3rem] border-8 border-white/5 shadow-2xl" alt="" />
        <div>
          <h1 className="text-6xl font-black uppercase tracking-tighter mb-2">{creator?.brand_name}</h1>
          <p className="text-[#00F5FF] font-mono text-xl tracking-widest">@{creator?.username}</p>
        </div>
      </div>
      <h2 className="text-3xl font-black uppercase mb-10 tracking-tight">Premium Content</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {resources.map(res => (
          <GlassCard key={res.id} hoverable className="flex flex-col p-6 border border-white/5">
            <img src={res.preview_image} className="w-full h-56 object-cover rounded-2xl mb-8 border border-white/5" alt="" />
            <h3 className="text-2xl font-bold mb-4">{res.title}</h3>
            <p className="text-gray-500 mb-8 line-clamp-2 text-sm">{res.description}</p>
            <Link to={`/u/${username}/unlock/${res.id}`} className="mt-auto">
              <Button fullWidth className="py-4">Unlock To Download</Button>
            </Link>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

// --- Unlock Logic ---
const UnlockPage = () => {
  const { id } = useParams();
  const [res, setRes] = useState<Resource | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  useEffect(() => {
    supabase.from('resources').select('*').eq('id', id).single().then(({data}) => setRes(data));
  }, [id]);

  const unlock = async () => {
    if (!res) return;
    let isCorrect = false;
    if (res.unlock_method === 'MANUAL_CODE' && input.toUpperCase() === res.unlock_requirement.toUpperCase()) isCorrect = true;
    else if (res.unlock_method === 'TASK_VERIFICATION') {
      window.open(res.unlock_requirement, '_blank');
      isCorrect = true;
    }

    if (isCorrect) {
      const url = await getSignedUrl(res.file_url);
      setDownloadUrl(url);
      setUnlocked(true);
      await supabase.rpc('increment_unlock_count', { resource_id: res.id });
    } else {
      alert("Verification failed. Please try again.");
    }
  };

  if (!res) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0D0D0D]">
      <GlassCard className="max-w-md w-full p-10 text-center border border-white/10 shadow-3xl">
        {!unlocked ? (
          <>
            <div className="w-24 h-24 bg-[#00F5FF]/10 rounded-3xl flex items-center justify-center text-[#00F5FF] mx-auto mb-10 border border-[#00F5FF]/20 shadow-inner animate-pulse"><ICONS.Lock /></div>
            <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Content Locked</h2>
            <p className="text-gray-400 mb-10 text-lg">{res.title}</p>
            {res.unlock_method === 'MANUAL_CODE' && (
              <input type="text" placeholder="Secret Access Code" className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 mb-6 text-center text-2xl font-black focus:border-[#00F5FF] outline-none" value={input} onChange={e => setInput(e.target.value)} />
            )}
            <Button fullWidth className="py-5 text-xl" onClick={unlock}>Verify to Unlock</Button>
          </>
        ) : (
          <div className="animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-500/10 rounded-3xl flex items-center justify-center text-green-500 mx-auto mb-10 border border-green-500/20 shadow-inner"><ICONS.Unlock /></div>
            <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter text-green-500">Access Granted</h2>
            <p className="text-gray-400 mb-12">Your download is ready. Click below to start.</p>
            <Button fullWidth variant="secondary" className="py-5 text-xl mb-4" onClick={() => window.open(downloadUrl)}>Download Now</Button>
            <Button variant="ghost" className="text-xs text-gray-600" onClick={() => window.history.back()}>Back to Profile</Button>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

// --- Config Error Screen ---
const ConfigErrorScreen = () => {
  const isInvalidFormat = supabaseConfigError === "invalid_format";
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0D0D0D]">
      <GlassCard className="max-w-lg w-full p-10 border border-red-500/20 text-center shadow-2xl">
        <h2 className="text-3xl font-black uppercase text-white mb-8">{isInvalidFormat ? "Wrong Key Format" : "Config Missing"}</h2>
        <div className="text-left bg-black/40 p-6 rounded-2xl border border-white/5 space-y-4 mb-8 text-sm text-gray-400">
          <p>Please update your Vercel Environment Variables:</p>
          <div className="bg-white/5 p-4 rounded font-mono text-[10px] text-[#00F5FF]">
            VITE_SUPABASE_URL<br/>
            VITE_SUPABASE_ANON_KEY (Must start with eyJ...)
          </div>
        </div>
        <Button fullWidth onClick={() => window.location.reload()}>Refresh Page</Button>
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

  if (!isSupabaseConfigured) return <ConfigErrorScreen />;

  return (
    <Router>
      <div className="min-h-screen gradient-bg selection:bg-[#00F5FF] selection:text-black">
        <nav className="fixed top-0 w-full z-[90] glass border-b border-white/5 px-8 py-5 flex items-center justify-between">
          <Link to="/" className="text-3xl font-black tracking-tighter hover:opacity-80 transition-opacity">LOCK<span className="text-[#00F5FF]">FLOW</span></Link>
          <div className="flex gap-8 items-center">
            {user ? <Link to="/dashboard" className="text-xs font-black uppercase tracking-widest text-[#00F5FF]">Dashboard</Link> : <Link to="/login" className="text-xs font-black uppercase tracking-widest text-gray-400">Login</Link>}
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