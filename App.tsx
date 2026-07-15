import React, { useState, useEffect } from 'react';
import { createShortUrl, getRecentUrls, getUrlByCode, incrementClicks } from './services/urlService';
import { ShortenedUrl } from './types';
import { isFirebaseConfigured } from './firebaseClient';
import { 
  ArrowRight, 
  Copy, 
  Check, 
  Database,
  Loader2,
  Terminal,
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
        {redirectError === "LINK_NOT_FOUND" ? (
          <div className="text-center">
            <Terminal className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-white text-lg font-medium mb-2">404 — Link Not Found</p>
            <p className="text-gray-400 text-sm">The short code doesn't exist in our database.</p>
            <a 
              href="/" 
              className="mt-6 inline-block px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition text-sm font-medium"
            >
              ← Back Home
            </a>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-white text-lg font-medium mb-2">Redirecting...</p>
            <p className="text-gray-400 text-sm">Preparing to take you to the destination.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-grid opacity-[0.03] pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="border-b border-gray-800 bg-ink-950/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Slash className="w-5 h-5" />
              <h1 className="text-lg font-bold tracking-tight">HAS_URL</h1>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Database className="w-3 h-3" />
              {isFirebaseConfigured() ? (
                <span>Firebase Connected</span>
              ) : (
                <span>Mock Mode</span>
              )}
            </div>
          </div>
        </header>

        {/* Main Section */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl">
            {/* Hero Section */}
            <div className="mb-12 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Shorten. Share. Simplify.
              </h2>
              <p className="text-gray-400 text-lg">
                Transform your long URLs into elegant short codes powered by Firebase.
              </p>
            </div>

            {/* URL Shortener Form */}
            <form onSubmit={handleShorten} className="space-y-4 mb-12">
              {/* Long URL Input */}
              <div>
                <input
                  type="text"
                  placeholder="Paste your long URL here..."
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-white transition"
                />
              </div>

              {/* Custom Alias Input */}
              <div>
                <input
                  type="text"
                  placeholder="Custom alias (optional)..."
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-white transition"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="px-4 py-3 bg-red-900/20 border border-red-700 rounded text-red-200 text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !longUrl}
                className="w-full px-6 py-3 bg-white text-black font-semibold rounded hover:bg-gray-200 disabled:bg-gray-600 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                {isLoading ? 'Creating...' : 'Shorten URL'}
              </button>
            </form>

            {/* Created URL Card */}
            {createdUrl && (
              <div className="bg-gray-900 border border-gray-700 rounded p-6 mb-12 animate-slideUp">
                <p className="text-gray-400 text-sm mb-3">Your shortened URL:</p>
                <div className="flex items-center gap-2 mb-4">
                  <code className="flex-1 px-3 py-2 bg-gray-800 rounded text-white font-mono text-sm overflow-x-auto">
                    {domain}/{createdUrl.short_code}
                  </code>
                  <button
                    onClick={() => handleCopy(`${domain}/${createdUrl.short_code}`, 'new')}
                    className="p-2 hover:bg-gray-800 rounded transition"
                  >
                    {copiedId === 'new' ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-gray-500 text-xs">Original: {createdUrl.original_url}</p>
              </div>
            )}

            {/* Recent URLs */}
            {recentUrls.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">Recent URLs</h3>
                <div className="space-y-3">
                  {recentUrls.map((url) => (
                    <div key={url.id} className="bg-gray-900 border border-gray-700 rounded p-4 hover:border-gray-600 transition">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-white font-mono text-sm">
                          {domain}/{url.short_code}
                        </code>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500 text-xs">{url.clicks} clicks</span>
                          <button
                            onClick={() => handleCopy(`${domain}/${url.short_code}`, url.id)}
                            className="p-1 hover:bg-gray-800 rounded transition"
                          >
                            {copiedId === url.id ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <a
                            href={url.original_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-gray-800 rounded transition"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                      <p className="text-gray-500 text-xs truncate">{url.original_url}</p>
                      <p className="text-gray-600 text-xs mt-2">
                        {new Date(url.created_at).toLocaleDateString()} at {new Date(url.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
