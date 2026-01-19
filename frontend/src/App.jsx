import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [channelId, setChannelId] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user && user.authCode && user.latestShareCode) {
      fetchHistory();
    }
  }, [user]);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/user`, { withCredentials: true });
      setUser(res.data);
    } catch (err) {
      console.error('Not logged in');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get(`${API_BASE}/api/matches/history`, { withCredentials: true });
      setMatches(res.data.matches);
      setChannelId(res.data.channelId);
    } catch (err) {
      console.error('Failed to fetch history');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRequestDownload = async (matchCode) => {
    try {
      await axios.post(`${API_BASE}/api/matches/request`, { matchCode }, { withCredentials: true });
      fetchHistory();
    } catch (err) {
      alert('Failed to request download');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.get(`${API_BASE}/auth/logout`, { withCredentials: true });
      setUser(null);
    } catch (err) {
      console.error('Logout failed');
    }
  };

  const getTelegramLink = (msgId) => {
    if (!channelId || !msgId) return null;
    const cleanId = channelId.startsWith('-100') ? channelId.substring(4) : channelId;
    return `https://t.me/c/${cleanId}/${msgId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full"></div>

        <div className="max-w-md w-full bg-neutral-900/40 backdrop-blur-2xl border border-neutral-800/50 rounded-[2.5rem] p-10 text-center shadow-2xl relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/20 mx-auto mb-8 transform -rotate-6">
            <span className="font-black text-4xl text-white">D</span>
          </div>
          <h1 className="text-5xl font-black mb-4 tracking-tighter bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent">
            DEMO HUB
          </h1>
          <a
            href={`${API_BASE}/auth/steam`}
            className="group relative inline-flex items-center justify-center w-full px-8 py-5 bg-white text-black font-black rounded-2xl hover:bg-neutral-200 transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <span className="relative flex items-center gap-3">
              SIGN IN WITH STEAM
            </span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-orange-500/30">
      <header className="border-b border-neutral-800/50 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20">
              <span className="font-black text-2xl">D</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter">DEMO HUB</h1>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 bg-neutral-900/50 border border-neutral-800/50 pl-2 pr-5 py-2 rounded-2xl">
              <img src={user.photos?.[0]?.value} alt="" className="w-10 h-10 rounded-xl border border-neutral-700 shadow-lg" />
              <div className="text-left">
                <div className="text-sm font-black leading-none mb-1">{user.displayName}</div>
                <div className="text-[10px] text-neutral-500 font-mono">{user.id}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition-all active:scale-95 group"
            >
              <svg className="w-5 h-5 text-neutral-500 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/50 rounded-[2rem] p-8 shadow-2xl">
            <h3 className="text-xl font-black mb-6 tracking-tight">Configuration</h3>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData);
              try {
                await axios.post(`${API_BASE}/api/user/settings`, data, { withCredentials: true });
                alert('Settings saved!');
                fetchUser();
              } catch (err) {
                alert('Failed to save settings');
              }
            }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Auth Code</label>
                <input
                  name="authCode"
                  defaultValue={user.authCode}
                  placeholder="AAAA-BBBB-CCCC"
                  className="w-full bg-neutral-950/50 border border-neutral-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/5 transition-all text-sm font-medium"
                />
                <a href="https://help.steampowered.com/en/wizard/HelpWithGameIssue/?appid=730&issueid=128&ref=leetify.com" target="_blank" rel="noreferrer" className="inline-block text-[10px] text-orange-500 hover:text-orange-400 font-bold uppercase tracking-wider transition-colors ml-1">
                  Get Code →
                </a>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Resume Share Code</label>
                <input
                  name="latestShareCode"
                  defaultValue={user.latestShareCode}
                  placeholder="CSGO-xxxxx-xxxxx"
                  className="w-full bg-neutral-950/50 border border-neutral-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/5 transition-all text-sm font-medium"
                />
              </div>
              <button
                type="submit"
                className="w-full py-5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-black rounded-2xl transition-all transform active:scale-[0.98] shadow-xl shadow-orange-500/10"
              >
                SAVE CONFIGURATION
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-black tracking-tight">Recent Matches</h2>
            <button
              onClick={fetchHistory}
              disabled={refreshing}
              className={`p-3 bg-neutral-900 border border-neutral-800 rounded-xl transition-all active:scale-95 ${refreshing ? 'animate-spin opacity-50' : 'hover:bg-neutral-800'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {matches.length === 0 ? (
              <div className="bg-neutral-900/20 border border-dashed border-neutral-800 rounded-[2rem] py-20 text-center">
                <div className="text-neutral-600 font-black text-xl mb-2 uppercase tracking-tighter">No Matches Found</div>
              </div>
            ) : (
              matches.map((match) => (
                <div
                  key={match.matchCode}
                  className="group bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/50 rounded-3xl p-6 flex items-center justify-between hover:border-neutral-700/50 transition-all hover:translate-x-1"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-neutral-950 rounded-2xl flex items-center justify-center border border-neutral-800 group-hover:border-orange-500/30 transition-colors">
                      <svg className="w-6 h-6 text-neutral-500 group-hover:text-orange-500 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-1">Match Code</div>
                      <div className="text-lg font-mono font-bold text-white tracking-tight">{match.matchCode}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {match.status === 'NONE' ? (
                      <button
                        onClick={() => handleRequestDownload(match.matchCode)}
                        className="px-6 py-3 bg-neutral-800 hover:bg-white hover:text-black text-white text-xs font-black rounded-xl transition-all uppercase tracking-widest"
                      >
                        Download Demo
                      </button>
                    ) : match.status === 'UPLOADED' ? (
                      <a
                        href={getTelegramLink(match.telegramId)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition-all uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-600/20"
                      >
                        View on Telegram
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 px-6 py-3 bg-neutral-800/50 border border-neutral-800 rounded-xl">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{match.status}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
