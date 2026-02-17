
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { UnlockMethod, Creator, Resource, UserSession } from './types';
import { MOCK_CREATOR, MOCK_RESOURCES } from './services/mockData';
import { ICONS, COLORS } from './constants';
import Button from './components/Button';
import GlassCard from './components/GlassCard';
import { generateSmartDescription, analyzeEngagement } from './services/geminiService';

// --- Landing Page ---
const LandingPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
    <div className="absolute top-0 left-0 w-full h-screen overflow-hidden -z-10 opacity-30">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00F5FF] rounded-full filter blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#8A2BE2] rounded-full filter blur-[100px] animate-pulse delay-700"></div>
    </div>
    
    <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter">
      LOCK<span className="text-[#00F5FF]">FLOW</span>
    </h1>
    <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl">
      Turn your audience into real engagement. Share premium resources with built-in task verification.
    </p>
    
    <div className="flex flex-col sm:flex-row gap-4 mb-20">
      <Link to="/signup">
        <Button className="w-64 py-4 text-lg">Create Profile</Button>
      </Link>
      <Link to="/login">
        <Button variant="ghost" className="w-64 py-4 text-lg border border-white/20">Creator Login</Button>
      </Link>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl w-full">
      <GlassCard className="text-left">
        <div className="w-12 h-12 bg-[#00F5FF]/10 rounded-lg flex items-center justify-center text-[#00F5FF] mb-4">
          <ICONS.Lock />
        </div>
        <h3 className="text-xl font-bold mb-2">Secure Locking</h3>
        <p className="text-gray-400 text-sm">Protect your hard work with time, code, or task-based locks.</p>
      </GlassCard>
      <GlassCard className="text-left">
        <div className="w-12 h-12 bg-[#8A2BE2]/10 rounded-lg flex items-center justify-center text-[#8A2BE2] mb-4">
          <ICONS.Chart />
        </div>
        <h3 className="text-xl font-bold mb-2">Smart Analytics</h3>
        <p className="text-gray-400 text-sm">Track every visitor and unlock with granular engagement data.</p>
      </GlassCard>
      <GlassCard className="text-left">
        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-white mb-4">
          <ICONS.Users />
        </div>
        <h3 className="text-xl font-bold mb-2">Creator First</h3>
        <p className="text-gray-400 text-sm">Personalized profiles that look like high-end landing pages.</p>
      </GlassCard>
      <GlassCard className="text-left">
        <div className="w-12 h-12 bg-[#00F5FF]/10 rounded-lg flex items-center justify-center text-[#00F5FF] mb-4">
          <ICONS.Link />
        </div>
        <h3 className="text-xl font-bold mb-2">Easy Sharing</h3>
        <p className="text-gray-400 text-sm">One link for everything. Perfect for bio sections and captions.</p>
      </GlassCard>
    </div>
  </div>
);

// --- Auth Components ---
const AuthPage = ({ mode }: { mode: 'login' | 'signup' }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassCard className="max-w-md w-full p-8">
        <h2 className="text-3xl font-black mb-8 text-center">{mode === 'login' ? 'WELCOME BACK' : 'START CREATING'}</h2>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Email Address</label>
            <input type="email" required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-[#00F5FF] transition-colors" placeholder="you@brand.com" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Password</label>
            <input type="password" required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-[#00F5FF] transition-colors" placeholder="••••••••" />
          </div>
          {mode === 'signup' && (
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Brand Name</label>
              <input type="text" required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-[#00F5FF] transition-colors" placeholder="Elite Design Studio" />
            </div>
          )}
          <Button fullWidth className="mt-4">{mode === 'login' ? 'Login to Dashboard' : 'Get Started Free'}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-400">
          {mode === 'login' ? "Don't have an account?" : "Already a creator?"} 
          <Link to={mode === 'login' ? "/signup" : "/login"} className="text-[#00F5FF] ml-1 font-bold">
            {mode === 'login' ? 'Sign up' : 'Login'}
          </Link>
        </p>
      </GlassCard>
    </div>
  );
};

// --- Dashboard ---
const Dashboard = () => {
  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    const analysis = await analyzeEngagement(MOCK_CREATOR.stats);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">Creator Dashboard</h1>
          <p className="text-gray-400">Welcome back, <span className="text-[#00F5FF]">{MOCK_CREATOR.brandName}</span></p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => window.open('/#/u/' + MOCK_CREATOR.username, '_blank')}>View Public Profile</Button>
          <Button><ICONS.Plus /> New Resource</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <GlassCard className="border-l-4 border-l-[#00F5FF]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#00F5FF]/10 rounded-full flex items-center justify-center text-[#00F5FF]"><ICONS.Users /></div>
            <div>
              <p className="text-xs uppercase text-gray-500 font-bold">Total Visitors</p>
              <h2 className="text-3xl font-black">{MOCK_CREATOR.stats.totalVisitors}</h2>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="border-l-4 border-l-[#8A2BE2]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#8A2BE2]/10 rounded-full flex items-center justify-center text-[#8A2BE2]"><ICONS.Lock /></div>
            <div>
              <p className="text-xs uppercase text-gray-500 font-bold">Total Unlocks</p>
              <h2 className="text-3xl font-black">{MOCK_CREATOR.stats.totalUnlocks}</h2>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="border-l-4 border-l-white">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white"><ICONS.Chart /></div>
            <div>
              <p className="text-xs uppercase text-gray-500 font-bold">Engagement Score</p>
              <h2 className="text-3xl font-black">{MOCK_CREATOR.stats.engagementScore}%</h2>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h3 className="text-2xl font-black mb-6 uppercase tracking-tight">My Resources</h3>
          <div className="space-y-4">
            {resources.map(res => (
              <GlassCard key={res.id} className="flex items-center justify-between hover:border-white/20 transition-all">
                <div className="flex items-center gap-4">
                  <img src={res.previewImage} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  <div>
                    <h4 className="font-bold">{res.title}</h4>
                    <p className="text-sm text-gray-500">{res.unlockCount} Unlocks • {res.fileType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="p-2 h-auto rounded-md"><ICONS.Link /></Button>
                  <Button variant="ghost" className="p-2 h-auto rounded-md text-red-500">×</Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black mb-6 uppercase tracking-tight">Smart Insights</h3>
          <GlassCard className="bg-[#00F5FF]/5 border border-[#00F5FF]/20 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-sm text-[#00F5FF] font-bold mb-4 uppercase flex items-center gap-2">
                <span className="animate-pulse">✨</span> AI Strategist
              </p>
              {aiAnalysis ? (
                <div className="text-sm space-y-3 whitespace-pre-line text-gray-300">
                  {aiAnalysis}
                  <Button variant="outline" fullWidth className="mt-4 text-xs h-8" onClick={() => setAiAnalysis("")}>Clear Analysis</Button>
                </div>
              ) : (
                <>
                  <p className="text-gray-400 text-sm mb-6">Let Gemini analyze your current performance and suggest improvements to increase your conversion rate.</p>
                  <Button variant="outline" fullWidth isLoading={isAnalyzing} onClick={handleRunAnalysis}>Run Smart Analysis</Button>
                </>
              )}
            </div>
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-[#00F5FF]/10 rounded-full blur-2xl"></div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

// --- Public Profile & Unlock ---
const PublicProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  // In a real app, fetch creator by username
  const creator = MOCK_CREATOR;
  const resources = MOCK_RESOURCES;

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="h-64 relative overflow-hidden">
        <img src={creator.bannerImage} alt="Banner" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] to-transparent"></div>
      </div>
      
      <div className="max-w-4xl mx-auto px-6 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
          <img src={creator.profileImage} alt={creator.username} className="w-32 h-32 rounded-3xl border-4 border-[#0D0D0D] object-cover shadow-2xl" />
          <div className="flex-1 pb-2">
            <h1 className="text-4xl font-black">{creator.brandName}</h1>
            <p className="text-[#00F5FF]">@{creator.username}</p>
          </div>
          <div className="flex gap-3 pb-2">
            {Object.entries(creator.socials).map(([platform, url]) => (
              <a key={platform} href={url} target="_blank" className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-[#00F5FF]/10 hover:text-[#00F5FF] transition-all">
                <span className="capitalize text-xs">{platform[0]}</span>
              </a>
            ))}
          </div>
        </div>

        <GlassCard className="mb-12">
          <p className="text-gray-300 leading-relaxed">{creator.bio}</p>
        </GlassCard>

        <h2 className="text-2xl font-black mb-6 uppercase tracking-tight">Locked Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          {resources.map(res => (
            <GlassCard key={res.id} hoverable className="flex flex-col h-full group">
              <div className="relative h-40 rounded-xl overflow-hidden mb-4">
                <img src={res.previewImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 right-3 glass px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <ICONS.Lock /> {res.unlockMethod.replace('_', ' ')}
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">{res.title}</h3>
              <p className="text-gray-400 text-sm mb-6 flex-1 line-clamp-2">{res.description}</p>
              <Button fullWidth onClick={() => navigate(`/u/${username}/unlock/${res.id}`)}>
                Unlock to Access
              </Button>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};

const UnlockPage = () => {
  const { id } = useParams();
  const resource = MOCK_RESOURCES.find(r => r.id === id) || MOCK_RESOURCES[0];
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(parseInt(resource.unlockRequirement));
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsUnlocked(true);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft]);

  const handleUnlock = () => {
    if (resource.unlockMethod === UnlockMethod.MANUAL_CODE) {
      if (inputValue.toUpperCase() === resource.unlockRequirement) {
        setIsUnlocked(true);
      } else {
        setError('Invalid code. Please check again.');
        setTimeout(() => setError(''), 3000);
      }
    } else if (resource.unlockMethod === UnlockMethod.TASK_VERIFICATION) {
      window.open(resource.unlockRequirement, '_blank');
      // In a real world app, we would verify the task. Here we unlock after clicking.
      setTimeout(() => setIsUnlocked(true), 2000);
    } else if (resource.unlockMethod === UnlockMethod.TIME_DELAY) {
      setIsTimerRunning(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0D0D0D] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00F5FF]/5 rounded-full blur-[120px]"></div>
      
      <GlassCard className="max-w-lg w-full p-8 text-center relative z-10 border border-white/10">
        {!isUnlocked ? (
          <>
            <div className="w-20 h-20 bg-[#00F5FF]/10 rounded-3xl flex items-center justify-center text-[#00F5FF] mx-auto mb-8 animate-pulse">
              <ICONS.Lock />
            </div>
            <h2 className="text-3xl font-black mb-2 uppercase tracking-tight">Unlock Content</h2>
            <p className="text-gray-400 mb-8">{resource.title}</p>
            
            <div className="bg-white/5 p-6 rounded-2xl mb-8 text-left border border-white/5">
              <p className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-2">
                <ICONS.Chart /> Requirement
              </p>
              
              {resource.unlockMethod === UnlockMethod.MANUAL_CODE && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-300">Enter the secret code provided by the creator.</p>
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-[#00F5FF] uppercase tracking-widest text-center" 
                    placeholder="ENTER CODE"
                  />
                  {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                </div>
              )}

              {resource.unlockMethod === UnlockMethod.TASK_VERIFICATION && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-300">To unlock this resource, you must visit the creator's YouTube video and engage with their content.</p>
                  <div className="p-4 bg-red-600/10 rounded-xl border border-red-600/20 flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white">Y</div>
                    <p className="text-xs font-bold uppercase tracking-tighter">YouTube Verification Required</p>
                  </div>
                </div>
              )}

              {resource.unlockMethod === UnlockMethod.TIME_DELAY && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-300">Stay on this page for {resource.unlockRequirement} seconds to unlock the premium resource automatically.</p>
                  {isTimerRunning && (
                    <div className="text-5xl font-black text-[#00F5FF] text-center my-6 tabular-nums">{timeLeft}s</div>
                  )}
                </div>
              )}
            </div>

            <Button fullWidth onClick={handleUnlock} isLoading={isTimerRunning}>
              {resource.unlockMethod === UnlockMethod.MANUAL_CODE ? 'Verify Code' : 
               resource.unlockMethod === UnlockMethod.TASK_VERIFICATION ? 'Start Task' : 
               'Start Unlock Process'}
            </Button>
          </>
        ) : (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-500/10 rounded-3xl flex items-center justify-center text-green-500 mx-auto mb-8">
              <ICONS.Unlock />
            </div>
            <h2 className="text-3xl font-black mb-2 uppercase tracking-tight">Resource Unlocked</h2>
            <p className="text-gray-400 mb-12">Congratulations! You now have full access to this file.</p>
            
            <div className="bg-green-500/5 p-8 rounded-2xl border border-green-500/20 mb-8">
              <h4 className="font-bold mb-1">{resource.title}</h4>
              <p className="text-xs text-gray-500 mb-6">{resource.fileType} • Validated Session</p>
              <Button fullWidth variant="secondary" onClick={() => alert("Downloading: " + resource.fileUrl)}>
                Download Resource
              </Button>
            </div>
            
            <Link to={`/u/${resource.creatorId}`}>
              <Button variant="ghost" fullWidth>Return to Profile</Button>
            </Link>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

// --- Main App Entry ---
function App() {
  return (
    <Router>
      <div className="min-h-screen gradient-bg">
        <nav className="fixed top-0 w-full z-50 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black tracking-tighter">
            LOCK<span className="text-[#00F5FF]">FLOW</span>
          </Link>
          <div className="flex gap-4">
            <Link to="/login" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Login</Link>
            <Link to="/signup">
              <Button variant="outline" className="px-4 py-2 text-xs">Create Account</Button>
            </Link>
          </div>
        </nav>

        <main className="pt-20">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/u/:username" element={<PublicProfile />} />
            <Route path="/u/:username/unlock/:id" element={<UnlockPage />} />
          </Routes>
        </main>

        <footer className="py-12 border-t border-white/5 text-center text-gray-600 text-sm">
          <p>© 2024 LockFlow Premium Creator Platform. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
