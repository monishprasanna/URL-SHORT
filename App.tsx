import React, { useState, useEffect } from 'react';
import { createShortUrl, getRecentUrls, getUrlByCode, incrementClicks } from './services/urlService';
import { ShortenedUrl } from './types';
import { isSupabaseConfigured } from './supabaseClient';
import { 
  Link2, 
  Copy, 
  Check, 
  ArrowRight, 
  Zap, 
  History,
  AlertCircle,
  Database,
  Loader2
} from 'lucide-react';

const App: React.FC = () => {
  // Routing State - Initialize based on current path to prevent flash of content
  const [isRedirecting, setIsRedirecting] = useState(() => {
    const path = window.location.pathname.substring(1).replace(/\/$/, ''); // Remove leading slash and trailing slash
    return path.length > 0;
  });
  const [redirectError, setRedirectError] = useState<string | null>(null);

  // App State
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentUrls, setRecentUrls] = useState<ShortenedUrl[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<ShortenedUrl | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initialize Routing or Load History
  useEffect(() => {
    const path = window.location.pathname.substring(1).replace(/\/$/, '');
    
    if (path.length > 0) {
      handleRedirect(path);
    } else {
      loadHistory();
    }
  }, []);

  const handleRedirect = async (code: string) => {
    // setIsRedirecting(true); // Already set by initial state, but safe to keep if called elsewhere
    const { data, error } = await getUrlByCode(code);

    if (data) {
      // Track click
      incrementClicks(data.id);
      // Redirect
      window.location.href = data.original_url;
    } else {
      setIsRedirecting(false);
      setRedirectError("Link not found. It may have been deleted or never existed.");
    }
  };

  const loadHistory = async () => {
    const { data } = await getRecentUrls();
    if (data) setRecentUrls(data);
  };

  const handleShorten = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!longUrl) return;

    setError(null);
    setIsLoading(true);
    
    const { data, error: serviceError } = await createShortUrl(longUrl, customAlias);
    
    setIsLoading(false);

    if (serviceError) {
      setError(serviceError);
    } else if (data) {
      setCreatedUrl(data);
      setCustomAlias(''); // Clear alias input
      setLongUrl(''); // Clear main input
      loadHistory(); // Refresh list
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const domain = window.location.host;

  // Render Redirect Loading Screen
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
           <div className="p-4 bg-brand-500/10 rounded-full">
             <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
           </div>
           <h2 className="text-2xl font-display font-bold">Redirecting...</h2>
           <p className="text-slate-400">Taking you to your destination</p>
        </div>
      </div>
    );
  }

  // Render 404 / Error Screen for Redirects
  if (redirectError) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-900/50 border border-red-500/20 rounded-2xl p-8 text-center animate-shake">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">Oops! Link Error</h2>
          <p className="text-slate-400 mb-6">{redirectError}</p>
          <button 
            onClick={() => { 
              setRedirectError(null); 
              setIsRedirecting(false);
              window.history.pushState({}, "", "/"); 
              loadHistory();
            }}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white relative overflow-hidden font-sans selection:bg-brand-500 selection:text-white">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-600/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl flex flex-col items-center">
        
        {/* Header */}
        <header className="mb-12 text-center animate-fade-in-down">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-gradient-to-br from-brand-400 to-indigo-600 rounded-xl shadow-lg shadow-brand-500/20">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-brand-100 to-brand-300">
              HAS url shortner
            </h1>
          </div>
        </header>

        {/* Database Status Indicator */}
        {!isSupabaseConfigured() && (
          <div className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm animate-fade-in">
            <Database className="w-4 h-4" />
            <span>Running in Mock Mode (No Database Connected)</span>
          </div>
        )}

        {/* Main Card */}
        <div className="w-full bg-dark-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/50 animate-fade-in-up">
          
          <form onSubmit={handleShorten} className="flex flex-col gap-6">
            
            {/* URL Input */}
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium text-slate-300 ml-1">Original URL</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Link2 className="h-5 w-5 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                </div>
                <input
                  type="url"
                  id="url"
                  required
                  placeholder="https://example.com/very/long/url/that/needs/shortening"
                  className="block w-full pl-12 pr-4 py-4 bg-dark-950/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all outline-none"
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Custom Alias Input */}
            <div className="space-y-2">
              <label htmlFor="alias" className="text-sm font-medium text-slate-300 ml-1 flex items-center justify-between">
                <span>Custom Alias (Optional)</span>
                <span className="text-xs text-slate-500">{domain}/...</span>
              </label>
              <input
                type="text"
                id="alias"
                placeholder="my-cool-link"
                className="block w-full px-4 py-3 bg-dark-950/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all outline-none"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200 animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !longUrl}
              className="relative w-full py-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed rounded-xl text-white font-semibold text-lg shadow-lg shadow-brand-500/25 transition-all active:scale-[0.99] overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Shortening...
                  </>
                ) : (
                  <>Create Link <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </button>
          </form>

          {/* Success Result */}
          {createdUrl && (
            <div className="mt-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-fade-in">
              <h3 className="text-emerald-400 font-medium mb-4 flex items-center gap-2">
                <Check className="w-5 h-5" /> Successfully Shortened!
              </h3>
              <div className="flex flex-col md:flex-row gap-4 items-center bg-dark-950/50 p-2 rounded-xl border border-emerald-500/10">
                <div className="flex-1 px-3 truncate font-mono text-emerald-100/90 w-full text-center md:text-left">
                  {domain}/{createdUrl.short_code}
                </div>
                <button
                  onClick={() => handleCopy(`${domain}/${createdUrl.short_code}`, 'new')}
                  className="w-full md:w-auto px-6 py-2 bg-emerald-500 text-dark-950 font-bold rounded-lg hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
                >
                  {copiedId === 'new' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedId === 'new' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* History Section */}
        <div className="w-full max-w-4xl mt-16 animate-fade-in-up delay-200">
          <h2 className="text-xl font-semibold text-slate-200 mb-6 flex items-center gap-2">
            <History className="w-5 h-5 text-brand-400" /> Recent Links
          </h2>
          
          <div className="grid gap-4">
            {recentUrls.length === 0 ? (
              <div className="text-center py-12 text-slate-600 bg-dark-900/30 rounded-2xl border border-white/5 border-dashed">
                No links created yet. Start by pasting a URL above!
              </div>
            ) : (
              recentUrls.map((url) => (
                <div 
                  key={url.id} 
                  className="group bg-dark-900/40 hover:bg-dark-800/60 border border-white/5 hover:border-brand-500/30 rounded-xl p-4 transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-brand-300 font-mono font-medium text-lg mb-1">
                      <span>/{url.short_code}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                        {new Date(url.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-slate-500 text-sm truncate max-w-md" title={url.original_url}>
                      {url.original_url}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="hidden md:flex flex-col items-end mr-2">
                      <span className="text-xs text-slate-500 font-medium">{url.clicks || 0} clicks</span>
                    </div>
                    <button
                       onClick={() => handleCopy(`${domain}/${url.short_code}`, url.id)}
                       className={`flex-1 md:flex-none px-4 py-2 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm font-medium
                         ${copiedId === url.id 
                           ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                           : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'}
                       `}
                    >
                      {copiedId === url.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedId === url.id ? 'Copied' : 'Copy'}
                    </button>
                    <a 
                      href={url.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-white transition-colors"
                      title="Visit Original"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;