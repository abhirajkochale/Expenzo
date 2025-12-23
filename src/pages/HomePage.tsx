import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Shield, TrendingUp, Sparkles, Lock, Eye, Trash2, 
  Upload, BarChart3, Lightbulb, ArrowRight,
  Wallet, PieChart, Activity, ScanLine, FileText,
  Smartphone, BellRing, Check, X, Users, Globe, Zap,
  MessageSquare, Terminal
} from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';

// --- STYLES FOR 3D & GLOW EFFECTS (ADAPTIVE LIGHT/DARK) ---
const spatialStyles = `
  html {
    scroll-behavior: smooth;
  }

  .perspective-container {
    perspective: 2000px;
  }
  
  /* NOISE TEXTURE FOR PREMIUM FEEL */
  .bg-noise {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
    pointer-events: none;
  }

  /* BASE (LIGHT MODE) GLASS */
  .glass-panel {
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 4px 24px -1px rgba(0, 0, 0, 0.05),
      inset 0 0 20px rgba(255, 255, 255, 0.5);
    transition: all 0.3s ease;
  }

  .glass-panel:hover {
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(255, 255, 255, 1);
    box-shadow: 
      0 10px 40px -5px rgba(16, 185, 129, 0.15),
      inset 0 0 20px rgba(255, 255, 255, 0.8);
  }

  /* DARK MODE OVERRIDES */
  .dark .glass-panel {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 
      0 4px 30px rgba(0, 0, 0, 0.1),
      inset 0 0 20px rgba(255, 255, 255, 0.02);
  }

  .dark .glass-panel:hover {
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 
      0 0 50px rgba(16, 185, 129, 0.1),
      inset 0 0 20px rgba(255, 255, 255, 0.05);
  }

  .float-animation {
    animation: float 6s ease-in-out infinite;
  }
  
  .float-delayed {
    animation: float 6s ease-in-out infinite;
    animation-delay: 3s;
  }

  @keyframes float {
    0% { transform: translateY(0px) rotateX(0deg); }
    50% { transform: translateY(-20px) rotateX(2deg); }
    100% { transform: translateY(0px) rotateX(0deg); }
  }

  .ar-grid-bg {
    background-image: 
      linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
    background-size: 50px 50px;
    mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
  }

  .dark .ar-grid-bg {
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  }
`;

// --- SPATIAL COMPONENT: 3D HERO DASHBOARD ---
const SpatialDashboard = () => (
  <div className="relative w-full max-w-4xl mx-auto h-[500px] perspective-container hidden lg:block">
    {/* Ambient Glows */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[100px] animate-pulse mix-blend-multiply dark:mix-blend-normal" />
    
    {/* Main Floating Glass HUD */}
    <div className="absolute inset-0 glass-panel rounded-3xl p-8 transform rotate-x-12 transition-transform duration-700 hover:rotate-x-0 group">
      
      {/* HUD Header */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-200 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="ml-4 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">SYS.ONLINE // EXPENZO_HUD_v2.0</span>
        </div>
      </div>

      {/* Grid Layout inside HUD */}
      <div className="grid grid-cols-12 gap-6 h-[340px]">
        
        {/* Left Column: Stats */}
        <div className="col-span-3 flex flex-col gap-4">
          <div className="glass-panel rounded-xl p-4 flex-1 flex flex-col justify-between hover:scale-105 transition-transform duration-300">
            <TrendingUp className="text-emerald-600 dark:text-emerald-400 mb-2" />
            <div>
              <p className="text-xs text-gray-500 dark:text-muted-foreground uppercase font-bold">Income</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">₹2.1L</p>
            </div>
          </div>
          <div className="glass-panel rounded-xl p-4 flex-1 flex flex-col justify-between hover:scale-105 transition-transform duration-300">
              <Activity className="text-red-500 dark:text-red-400 mb-2" />
            <div>
              <p className="text-xs text-gray-500 dark:text-muted-foreground uppercase font-bold">Expense</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">₹1.4L</p>
            </div>
          </div>
        </div>

        {/* Center: Main Visual (Graph) */}
        <div className="col-span-6 glass-panel rounded-xl p-6 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-50" />
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Cash Flow Analysis</h3>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded">Live</span>
          </div>
          {/* Mock Chart Lines */}
          <div className="flex items-end justify-between h-32 gap-2 mt-8">
            {[40, 60, 45, 70, 50, 80, 65, 85].map((h, i) => (
              <div key={i} className="w-full bg-emerald-500/60 dark:bg-emerald-500/40 rounded-t-sm transition-all duration-1000 group-hover:bg-emerald-500 dark:group-hover:bg-emerald-400" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* Right Column: AI & Alerts */}
        <div className="col-span-3 space-y-4">
           {/* AI Widget */}
           <div className="glass-panel rounded-xl p-4 relative overflow-hidden">
             <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500/30 blur-xl rounded-full" />
             <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2 float-animation" />
             <p className="text-xs text-purple-700 dark:text-purple-200 font-bold mb-1">Guardian AI</p>
             <p className="text-[10px] text-gray-600 dark:text-muted-foreground">"Spending on food is up 15% this week."</p>
           </div>
           
           {/* Limits Widget */}
           <div className="glass-panel rounded-xl p-4">
              <div className="flex justify-between text-xs mb-2 text-gray-900 dark:text-white font-medium">
                <span>Food Budget</span>
                <span className="text-red-500 dark:text-red-400">85%</span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-[85%]" />
              </div>
           </div>
        </div>
      </div>
    </div>

    {/* Floating Elements (Parallax) */}
    {/* SMS Parser: Top Right */}
    <div className="absolute -right-12 top-20 glass-panel p-4 rounded-2xl float-delayed z-20 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-900 dark:text-white">SMS Parsed</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Just now</p>
        </div>
      </div>
    </div>
    
    {/* Privacy Active: Bottom Left */}
    <div className="absolute -left-12 bottom-8 glass-panel p-4 rounded-2xl float-animation z-20 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-500/20 rounded-lg">
          <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-900 dark:text-white">Privacy Active</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Encrypted</p>
        </div>
      </div>
    </div>
  </div>
);

// --- SPATIAL FEATURE CARD ---
const SpatialFeature = ({ icon: Icon, title, desc, color = "emerald", delay = "0" }: any) => (
  <div 
    className={`glass-panel p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-2 transition-all duration-500`}
    style={{ animationDelay: delay }}
  >
    <div className={`absolute top-0 right-0 p-16 bg-${color}-500/10 blur-[60px] rounded-full transition-all group-hover:bg-${color}-500/20`} />
    
    <div className={`w-12 h-12 rounded-xl bg-${color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
      <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
    </div>
    
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
    
    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0">
      <ArrowRight className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
    </div>
  </div>
);

// --- SPATIAL STAT CARD (FOR WHY SECTION) ---
const WhyCard = ({ icon: Icon, title, desc, delay }: any) => (
  <div className="glass-panel p-5 rounded-xl flex items-start gap-4 hover:bg-white/10 dark:hover:bg-white/5 transition-colors" style={{ animationDelay: delay }}>
    <div className="bg-emerald-500/10 p-2 rounded-lg shrink-0">
      <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    </div>
    <div>
      <h4 className="font-bold text-gray-900 dark:text-white mb-1">{title}</h4>
      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-foreground overflow-x-hidden selection:bg-emerald-500/30 font-sans transition-colors duration-300">
      <style>{spatialStyles}</style>

      {/* --- BACKGROUND AMBIENCE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay" /> {/* Noise Texture */}
        <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-emerald-100/50 dark:from-emerald-900/10 to-transparent" />
        <div className="absolute inset-0 ar-grid-bg opacity-30" />
      </div>

      {/* --- FLOATING NAV --- */}
      <nav className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl">
        <div className="glass-panel rounded-full px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xl backdrop-blur-xl">
          {/* LOGO */}
          <div className="flex items-center gap-3 shrink-0">
            <img src="/sidebar_logo.png" alt="Logo" className="h-6 w-auto" />
            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white hidden sm:block">Expenzo</span>
          </div>
          
          {/* NAVIGATION LINKS - CENTERED & SPACED */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-4 lg:gap-10 text-sm font-medium text-gray-600 dark:text-gray-300">
            <a href="#about" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">About</a>
            <a href="#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Features</a>
            <a href="#privacy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Privacy</a>
            <a href="#why-expenzo" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap">Why Expenzo?</a>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
             <ThemeToggle />
             <Button asChild variant="ghost" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full h-9 hidden sm:inline-flex">
               <Link to="/login">Sign In</Link>
             </Button>
             <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full h-9 px-4 sm:px-6 shadow-lg shadow-emerald-500/20 text-xs sm:text-sm">
               <Link to="/signup">Get Started</Link>
             </Button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative z-10 pt-32 pb-16 md:pt-40 md:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Text Content */}
          <div className="text-left space-y-6 md:space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              AI-Powered Financial Guardian
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1]">
              See Your Money in <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 animate-pulse">
                High Definition
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
              Expenzo isn't just a tracker. It's a spatial financial system that uses AI to parse SMS, predict limits, and visualize your habits in real-time.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="h-12 sm:h-14 px-6 sm:px-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 text-sm sm:text-base font-bold shadow-xl shadow-emerald-500/10 dark:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all hover:scale-105 ring-offset-2 focus:ring-2 ring-emerald-500">
                <Link to="/signup">
                  Launch Expenzo <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 text-xs sm:text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-500" /> No Bank Login
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-500" /> Local Encrypted
              </div>
            </div>
          </div>

          {/* 3D Visual */}
          <SpatialDashboard />
        </div>
      </section>

      {/* --- ABOUT SECTION --- */}
      <section id="about" className="relative z-10 py-16 md:py-24 px-4 sm:px-6 border-b border-gray-200/50 dark:border-white/5">
         <div className="max-w-7xl mx-auto">
            <div className="glass-panel rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
               
               <div className="flex-1 space-y-4 md:space-y-6 relative z-10">
                  <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold tracking-wider text-xs uppercase">
                     <Users className="w-4 h-4" /> About Us
                  </div>
                  <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white">The Financial OS You Control</h2>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                     In a world where every app wants your bank password, Expenzo stands apart. We believe financial clarity shouldn't come at the cost of privacy. 
                     Born from the need for a safer, smarter way to track spending, Expenzo processes your data locally on your device.
                  </p>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                     Our mission is simple: Give you High Definition visibility into your finances without ever compromising your security.
                  </p>
               </div>
               <div className="flex-1 w-full grid grid-cols-2 gap-3 sm:gap-4 relative z-10">
                  <div className="bg-emerald-500/10 rounded-2xl p-4 sm:p-6 text-center hover:bg-emerald-500/20 transition-colors cursor-default">
                     <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">100%</p>
                     <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-bold mt-1">Local Data</p>
                  </div>
                  <div className="bg-blue-500/10 rounded-2xl p-4 sm:p-6 text-center hover:bg-blue-500/20 transition-colors cursor-default">
                     <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">0</p>
                     <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-bold mt-1">Bank Logins</p>
                  </div>
                  <div className="bg-purple-500/10 rounded-2xl p-4 sm:p-6 text-center hover:bg-purple-500/20 transition-colors cursor-default">
                     <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">24/7</p>
                     <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-bold mt-1">AI Analyst</p>
                  </div>
                  <div className="bg-orange-500/10 rounded-2xl p-4 sm:p-6 text-center hover:bg-orange-500/20 transition-colors cursor-default">
                     <p className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">Free</p>
                     <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-bold mt-1">Core Features</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- BENTO GRID FEATURES --- */}
      <section id="features" className="relative z-10 py-20 md:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 md:mb-16 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">System Modules</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Every tool you need, suspended in one interface.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-auto md:auto-rows-[300px]">
            
            {/* Feature 1: Transactions */}
            <div className="md:col-span-2 glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden group min-h-[300px]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
              <div className="relative z-10 h-full flex flex-col">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                  <ScanLine className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">Automated Transaction Parsing</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md text-sm md:text-base">Drop your bank CSV or paste raw SMS text. Our AI extracts merchant, amount, and date instantly. No manual entry required.</p>
                <div className="mt-auto pt-8 flex flex-wrap gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                   <div className="bg-white/60 dark:bg-black/40 rounded-lg px-3 py-1.5 md:px-4 md:py-2 text-xs font-mono text-green-700 dark:text-green-400 border border-green-500/30">+ ₹45,000 Salary</div>
                   <div className="bg-white/60 dark:bg-black/40 rounded-lg px-3 py-1.5 md:px-4 md:py-2 text-xs font-mono text-red-600 dark:text-red-400 border border-red-500/30">- ₹1,200 Swiggy</div>
                </div>
              </div>
            </div>

            {/* Feature 2: Ask Expenzo */}
            <div className="md:row-span-2 glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-purple-500/30 transition-colors min-h-[300px]">
              <div className="absolute top-0 right-0 p-32 bg-purple-500/10 blur-[80px]" />
              <div className="flex flex-col h-full">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">Ask Expenzo</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm md:text-base">Your personal financial analyst. Chat with your data.</p>
                <div className="flex-1 space-y-4 font-mono text-xs">
                  <div className="bg-white/40 dark:bg-white/5 p-3 rounded-lg rounded-tl-none border border-gray-200 dark:border-white/10">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">User:</span> How much can I save this month?
                  </div>
                  <div className="bg-purple-100/50 dark:bg-purple-500/10 p-3 rounded-lg rounded-tr-none border border-purple-200 dark:border-purple-500/20">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">AI:</span> Based on your patterns, if you cut dining by 10%, you can save ₹12,500.
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Smart Limits */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 group min-h-[250px]">
               <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                  <BellRing className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Smart Limits</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Set category caps. Get real-time alerts before you overspend.</p>
                <div className="mt-6 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-emerald-500 to-red-500 w-[70%] group-hover:w-[85%] transition-all duration-1000" />
                </div>
            </div>

            {/* Feature 4: Patterns */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 group min-h-[250px]">
               <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6">
                  <PieChart className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Deep Patterns</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Visualize where every rupee goes with interactive charts.</p>
            </div>

            {/* Feature 5: Deep Reports */}
            <div className="md:col-span-2 glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden min-h-[250px]">
               <div className="flex-1 z-10 text-center md:text-left">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                    <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">Deep Analysis Reports</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Generate professional PDF audits of your financial health. Understand habits you didn't know you had.</p>
               </div>
               <div className="w-full md:w-1/3 h-32 bg-white/40 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center transform rotate-6 group-hover:rotate-0 transition-transform">
                  <span className="text-xs font-mono text-gray-500">REPORT_2025.PDF</span>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- WHY EXPENZO SECTION --- */}
      <section id="why-expenzo" className="relative z-10 py-20 md:py-24 px-4 sm:px-6">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
               <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Why Choose Expenzo?</h2>
               <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm md:text-base">Most finance apps trade your data for convenience. We re-engineered the process to give you both.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
               {/* Competitor Side */}
               <div className="glass-panel p-6 md:p-8 rounded-3xl opacity-70 scale-95 border-red-500/20">
                  <h3 className="text-lg md:text-xl font-bold text-gray-500 mb-6 flex items-center gap-2">
                     <X className="w-5 h-5 text-red-500" /> Other Finance Apps
                  </h3>
                  <ul className="space-y-4">
                     <li className="flex items-center gap-3 text-gray-500 text-sm md:text-base">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" /> Requires Bank Login Password
                     </li>
                     <li className="flex items-center gap-3 text-gray-500 text-sm md:text-base">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" /> Data Stored on Cloud Servers
                     </li>
                     <li className="flex items-center gap-3 text-gray-500 text-sm md:text-base">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" /> Sells Data to Advertisers
                     </li>
                     <li className="flex items-center gap-3 text-gray-500 text-sm md:text-base">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" /> Monthly Subscription Fees
                     </li>
                  </ul>
               </div>

               {/* Expenzo Side */}
               <div className="glass-panel p-6 md:p-8 rounded-3xl border-emerald-500/50 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 blur-[80px]" />
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                     <Check className="w-6 h-6 text-emerald-500" /> The Expenzo Way
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4 relative z-10">
                     <WhyCard 
                       icon={Shield} 
                       title="Local Encryption" 
                       desc="Your data is encrypted on your device. We can't see it even if we wanted to." 
                       delay="0s" 
                     />
                     <WhyCard 
                       icon={Zap} 
                       title="Instant Parsing" 
                       desc="No bank sync delays. Paste SMS or upload CSV and get results instantly." 
                       delay="0.1s" 
                     />
                     <WhyCard 
                       icon={MessageSquare} 
                       title="Conversational AI" 
                       desc="Chat with your money. Ask 'How much did I spend on food?' and get instant answers." 
                       delay="0.2s" 
                     />
                     <WhyCard 
                       icon={Wallet} 
                       title="Free Forever" 
                       desc="Core tracking features are free. No hidden paywalls for your own data." 
                       delay="0.3s" 
                     />
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- PRIVACY VAULT SECTION --- */}
      <section id="privacy" className="relative z-10 py-20 md:py-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto glass-panel rounded-2xl flex items-center justify-center mb-8 float-animation">
            <Lock className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">The Secure Vault</h2>
          <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg mb-12">
            We built Expenzo because we don't trust apps that ask for bank passwords. Your data stays on your device and is encrypted.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
             <SpatialFeature 
               icon={Shield} 
               title="No Bank Login" 
               desc="Manual uploads only. We never touch your bank credentials." 
               delay="0.1s"
             />
             <SpatialFeature 
               icon={Eye} 
               title="Client-Side" 
               desc="Data is processed locally where possible for maximum privacy." 
               delay="0.2s"
             />
             <SpatialFeature 
               icon={Trash2} 
               title="Total Control" 
               desc="Wipe your data instantly from your settings. No questions asked." 
               color="red"
               delay="0.3s"
             />
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 border-t border-gray-200 dark:border-white/10 bg-white/60 dark:bg-black/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="flex items-center gap-2">
            <img src="/sidebar_logo.png" alt="Logo" className="h-6 w-auto opacity-70" />
            <span className="font-bold text-gray-500 dark:text-gray-400">Expenzo</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-600">© 2025 Expenzo. Spatial Finance.</p>
        </div>
      </footer>

    </div>
  );
}