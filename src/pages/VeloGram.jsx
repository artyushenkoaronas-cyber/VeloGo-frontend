import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mediaUrl } from '../utils/mediaUrl';

const TABS = ['Online', 'All', 'Pending'];

export default function VeloGram() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('Online');
  const me = (() => { try { return JSON.parse(localStorage.getItem('velogo_user') || '{}'); } catch { return {}; } })();
  const avatarSrc = me.avatar ? mediaUrl(me.avatar) : null;
  const initial = me.name?.[0]?.toUpperCase() || 'V';

  return (
    <div className="flex h-screen bg-[#313338] text-white select-none overflow-hidden">

      {/* Server rail */}
      <div className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 gap-2 flex-shrink-0">
        <div onClick={() => navigate('/')}
          className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center cursor-pointer hover:rounded-xl transition-all duration-200 group relative"
          title="VeloGo Home">
          <span className="text-white font-bold text-xl">V</span>
          <span className="absolute left-0 w-1 h-5 bg-white rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="w-8 h-px bg-[#35363c] my-1" />
        <div className="w-12 h-12 rounded-xl bg-[#5865f2] flex items-center justify-center cursor-pointer relative" title="VeloGoCord">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute left-0 w-1 h-10 bg-white rounded-r-full" />
        </div>
      </div>

      {/* DM sidebar */}
      <div className="w-60 bg-[#2b2d31] flex flex-col flex-shrink-0">
        <div className="p-3">
          <button className="w-full bg-[#1e1f22] text-gray-400 text-sm rounded-md px-3 py-1.5 text-left hover:bg-[#111214] transition">
            Find or start a conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          <button className="w-full flex items-center gap-3 px-2 py-2 rounded-md bg-[#404249] text-white text-sm font-medium">
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Friends
          </button>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 pt-4 pb-1">Direct Messages</p>
          <div className="flex items-center gap-3 px-2 py-2 rounded-md opacity-30">
            <div className="w-8 h-8 rounded-full bg-zinc-600 flex-shrink-0" />
            <span className="text-gray-400 text-sm">Coming soon...</span>
          </div>
        </div>

        {/* Self panel */}
        <div className="h-14 bg-[#232428] flex items-center px-2 gap-2 flex-shrink-0">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-red-600 overflow-hidden flex items-center justify-center">
              {avatarSrc
                ? <img src={avatarSrc} className="w-full h-full object-cover" />
                : <span className="text-white text-xs font-bold">{initial}</span>}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#232428]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{me.name || 'VeloGo User'}</p>
            <p className="text-gray-400 text-xs truncate">@{me.username || 'user'}</p>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-[#35373c] rounded transition" title="Mute">
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <button className="p-1.5 hover:bg-[#35373c] rounded transition" title="Settings">
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <div className="h-12 bg-[#313338] border-b border-[#1e1f22] flex items-center px-4 gap-3 flex-shrink-0 shadow-sm">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-white font-semibold text-sm">Friends</span>
          <div className="w-px h-5 bg-gray-600 mx-1" />
          <div className="flex items-center gap-1">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1 rounded text-sm font-medium transition ${tab === t ? 'bg-[#404249] text-white' : 'text-gray-400 hover:bg-[#35373c] hover:text-gray-200'}`}>
                {t}
              </button>
            ))}
            <button className="ml-2 bg-[#248046] hover:bg-[#1a6334] text-white text-sm px-3 py-1 rounded font-medium transition">
              Add Friend
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Empty state */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <svg className="w-28 h-28 text-[#3f4147]" viewBox="0 0 200 200" fill="currentColor">
              <path d="M100 30C61.3 30 30 61.3 30 100s31.3 70 70 70 70-31.3 70-70S138.7 30 100 30zm-15 95c-19.3 0-35-15.7-35-35s15.7-35 35-35 35 15.7 35 35-15.7 35-35 35zm50 0c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
            </svg>
            <p className="text-[#949ba4] text-base font-semibold">
              {tab === 'Online' ? "No one's around to play with Wumpus." : tab === 'Pending' ? 'There are no pending friend requests. Here's Wumpus for now.' : "You don't have any friends to play with Wumpus."}
            </p>
            <p className="text-[#5c6068] text-sm">VeloGoCord messaging is coming soon!</p>
          </div>

          {/* Active Now */}
          <div className="w-60 bg-[#2b2d31] flex-shrink-0 border-l border-[#1e1f22] p-4">
            <p className="text-white font-semibold text-sm mb-4">Active Now</p>
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <p className="text-[#949ba4] text-xs font-semibold">It's quiet for now...</p>
              <p className="text-[#5c6068] text-xs text-center">When a friend starts an activity, you'll see it here!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
