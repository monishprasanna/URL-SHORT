import React, { useState, useEffect } from 'react';
import { createShortUrl, getRecentUrls, getUrlByCode, incrementClicks } from './services/urlService';
import { ShortenedUrl } from './types';
import { isSupabaseConfigured } from './supabaseClient';
import { 
  ArrowRight, 
  Copy, 
  Check, 
  Database,
  Loader2,
  Terminal,
  Clock,
  ExternalLink,
  Slash
} from 'lucide-react';

const App: React.FC = () => {
  // Routing State
  const [isRedirecting, setIsRedirecting] = useState(() => {
    const path = window.location.pathname.substring(1).replace(/\/$/, '');
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

  const domain = window.location.host;

  // Initialize
  useEffect(() => {
    const path = window.location.pathname.substring(1).replace(/\/$/, '');
    
    if (path.length > 0) {
      handleRedirect(path);
    } else {
      loadHistory();
    }
  }, []);

  const handleRedirect = async (code: string) => {
    const { data } = await getUrlByCode(code);

    if (data) {
      incrementClicks(data.id);
      window.location.href = data.original_url;
    } else {
      setIsRedirecting(false);
      setRedirectError("LINK_NOT_FOUND");
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
      setCustomAlias('');
      setLongUrl('');
      loadHistory();

      // Auto-copy
      const shortLink = `${domain}/${data.short_code}`;
      try {
        await navigator.clipboard.writeText(shortLink);
        setCopiedId('new');
        setTimeout(() => setCopiedId(null), 2500);
      } catch (err) {
        console.error('Failed to auto-copy', err);
      }
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Redirecting Screen (Minimalist)
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-white animate-spin mb-6" />
        <h2 className="text-xl font-mono tracking-wider text-ink-200">INITIALIZING REDIRECT</h2>
      </div>
    );
  }

  // Error Screen (Minimalist)
  if (redirectError) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="border border-ink-800 bg-ink-900 p-8 max-w-md w-full">
          <h2 className="text-4xl font-display font-bold text-white mb-4">404</h2>
          <p className="font-mono text-ink-400 mb-8 border-b border-ink-800 pb-4">ERROR: DESTINATION_UNKNOWN</p>
          <button 
            onClick={() => { 
              setRedirectError(null); 
              setIsRedirecting(false);
              window.history.pushState({}, "", "/"); 
              loadHistory();
            }}
            className="w-full py-3 bg-white text-black font-mono font-bold hover:bg-ink-200 transition-colors"
          >
            RETURN_HOME
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 text-ink-200 font-sans selection:bg-white selection:text-black">
      
      {/* Aesthetic Grid Background */}
      <div className="fixed inset-0 bg-grid pointer-events-none z-0" />

      <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-12 md:py-24">
        
        {/* Navbar / Header */}
        <nav className="flex justify-between items-center mb-24 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white"></div>
            <h1 className="text-lg font-bold font-display tracking-tight text-white">HAS_URL</h1>
          </div>
          {!isSupabaseConfigured() && (
            <div className="flex items-center gap-2 text-xs font-mono text-ink-400 border border-ink-800 px-3 py-1">
              <Database className="w-3 h-3" />
              <span>MOCK_MODE</span>
            </div>
          )}
        </nav>

        <main className="grid lg:grid-cols-12 gap-16">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-7 flex flex-col justify-center animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-[0.9] tracking-tighter mb-8">
              MAKE IT <br/>
              <span className="text-ink-400">SHORT.</span>
            </h1>
            
            <form onSubmit={handleShorten} className="space-y-6 max-w-xl">
              <div className="space-y-4">
                <div className="relative group">
                   <input
                    type="url"
                    required
                    placeholder="Paste long URL here..."
                    className="w-full bg-transparent border-b-2 border-ink-800 text-white text-xl md:text-2xl py-4 placeholder-ink-700 focus:outline-none focus:border-white transition-colors font-sans rounded-none"
                    value={longUrl}
                    onChange={(e) => setLongUrl(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center text-ink-400 font-mono text-sm shrink-0">
                    <Slash className="w-4 h-4" />
                    <span className="ml-1">alias</span>
                  </div>
                  <input
                    type="text"
                    placeholder="custom-name (optional)"
                    className="w-full bg-transparent border-b border-ink-800 text-white py-2 placeholder-ink-700 focus:outline-none focus:border-white transition-colors font-mono text-sm"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 font-mono text-xs border-l-2 border-red-500 pl-3 py-1">
                  ERROR: {error}
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading || !longUrl}
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-display font-bold text-lg hover:bg-ink-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full md:w-auto justify-between md:justify-start"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      PROCESSING
                    </span>
                  ) : (
                    <>
                      <span>SHORTEN URL</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Result Display (Minimalist Ticket) */}
            {createdUrl && (
              <div className="mt-12 border border-ink-800 bg-ink-900/50 p-6 animate-fade-in relative overflow-hidden group">
                 {/* Decorative Corner */}
                 <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white"></div>
                 
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1 overflow-hidden">
                      <p className="text-xs font-mono text-ink-400 uppercase tracking-widest">Generated Link</p>
                      <p className="text-xl md:text-2xl font-mono text-white truncate">{domain}/{createdUrl.short_code}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(`${domain}/${createdUrl.short_code}`, 'new')}
                      className={`shrink-0 px-6 py-3 font-bold font-mono text-sm border transition-all flex items-center gap-2
                        ${copiedId === 'new' 
                          ? 'bg-white text-black border-white animate-pop' 
                          : 'bg-transparent text-white border-ink-700 hover:border-white'}
                      `}
                    >
                      {copiedId === 'new' ? 'COPIED' : 'COPY'}
                      {copiedId === 'new' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                 </div>
              </div>
            )}
          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-5 mt-16 lg:mt-0 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center gap-3 mb-8 border-b border-ink-800 pb-4">
              <Terminal className="w-5 h-5 text-white" />
              <h3 className="font-mono text-sm font-bold tracking-wider text-white">SYSTEM_LOG</h3>
            </div>

            <div className="space-y-0">
              {recentUrls.length === 0 ? (
                <div className="font-mono text-sm text-ink-700 py-4">
                  > Awaiting input...
                </div>
              ) : (
                recentUrls.map((url) => (
                  <div 
                    key={url.id} 
                    className="group border-b border-ink-900 py-4 hover:bg-ink-900/30 transition-colors flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-white text-lg">/{url.short_code}</span>
                        <span className="text-[10px] font-mono text-ink-400 border border-ink-800 px-1">
                          {url.clicks} HITS
                        </span>
                      </div>
                      <div className="text-ink-400 text-xs truncate max-w-[200px] font-sans">
                        {url.original_url}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopy(`${domain}/${url.short_code}`, url.id)}
                        className={`p-2 hover:bg-white hover:text-black transition-colors ${copiedId === url.id ? 'text-white' : 'text-ink-400'}`}
                        title="Copy"
                      >
                        {copiedId === url.id ? <Check className="w-4 h-4 animate-pop" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <a 
                        href={url.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-ink-400 hover:bg-white hover:text-black transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </main>
        
        {/* Footer */}
        <footer className="fixed bottom-6 left-6 text-[10px] font-mono text-ink-700 flex flex-col gap-1 z-0">
          <p>SECURE_CONNECTION: ESTABLISHED</p>
          <p>ID: {domain}</p>
        </footer>

      </div>
    </div>
  );
};

export default App;