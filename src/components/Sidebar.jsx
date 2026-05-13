import { useNavigate, useLocation } from 'react-router-dom';

const mainItems = [
  {
    icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>,
    label: 'Home', path: '/'
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.77 10.32l-1.2-.5L18 9.06c1.84-.96 2.56-3.22 1.6-5.06s-3.22-2.56-5.06-1.6L6 6.94c-1.29.68-2.07 2.01-2 3.44.07 1.29.75 2.43 1.79 3.06L7 14l-1.2.5C3.96 15.46 3.24 17.72 4.2 19.56c.96 1.84 3.22 2.56 5.06 1.6l8.54-4.54c1.29-.68 2.07-2.01 2-3.44-.07-1.29-.75-2.43-1.79-3.06zm-7.65 4.06l-.97.52.04-5.2.93.48 4.58 2.44-4.58 1.76z"/>
      </svg>
    ),
    label: 'Shorts', path: '/shorts'
  },
  {
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    label: 'Subscriptions', path: '/subscriptions'
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 2c2.09 0 4.014.77 5.507 2.036L4.036 17.507A7.963 7.963 0 014 12c0-4.411 3.589-8 8-8zm0 16c-2.09 0-4.014-.77-5.507-2.036L19.964 6.493A7.963 7.963 0 0120 12c0 4.411-3.589 8-8 8z"/>
        <circle cx="9" cy="10" r="1.5"/>
        <circle cx="15" cy="10" r="1.5"/>
        <path d="M12 17c2.5 0 4-1.5 4-2.5H8c0 1 1.5 2.5 4 2.5z"/>
      </svg>
    ),
    label: 'VeloGoCord', path: '/velogram'
  },
];

const youItems = [
  { label: 'Your channel', path: '/channel' },
  { label: 'History', path: '/history' },
  { label: 'Playlists', path: '/playlists' },
  { label: 'Your videos', path: '/your-videos' },
  { label: 'Watch later', path: '/watch-later' },
  { label: 'Liked videos', path: '/liked' },
];

const exploreItems = [
  { label: 'Music', path: '/music' },
  { label: 'Movies', path: '/movies' },
  { label: 'Gaming', path: '/gaming' },
  { label: 'News', path: '/news' },
  { label: 'Sports', path: '/sports' },
];

export default function Sidebar({ open }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  if (!open) return (
    <aside className="fixed left-0 top-14 h-full w-16 flex flex-col items-center py-4 gap-1 bg-[#0f0f0f] z-40">
      {mainItems.map(item => (
        <button key={item.label} onClick={() => navigate(item.path)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition w-14 ${isActive(item.path) ? 'bg-zinc-700' : 'hover:bg-zinc-800'} text-white`}>
          {item.icon}
          <span className="text-[10px] text-gray-300">{item.label}</span>
        </button>
      ))}
    </aside>
  );

  return (
    <aside className="fixed left-0 top-14 h-full w-60 bg-[#0f0f0f] z-40 overflow-y-auto pb-10">
      <div className="px-3 py-2">
        {mainItems.map(item => (
          <button key={item.label} onClick={() => navigate(item.path)}
            className={`flex items-center gap-4 w-full px-3 py-2 rounded-xl transition text-white text-sm ${isActive(item.path) ? 'bg-zinc-700 font-medium' : 'hover:bg-zinc-800'}`}>
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="border-t border-zinc-800 mx-3 my-2" />

      <div className="px-3 py-2">
        <p className="text-white font-semibold px-3 py-2 text-sm">You</p>
        {youItems.map(item => (
          <button key={item.label} onClick={() => navigate(item.path)}
            className="flex items-center gap-4 w-full px-3 py-2 rounded-xl hover:bg-zinc-800 transition text-gray-300 text-sm">
            {item.label}
          </button>
        ))}
      </div>

      <div className="border-t border-zinc-800 mx-3 my-2" />

      <div className="px-3 py-2">
        <p className="text-white font-semibold px-3 py-2 text-sm">Explore</p>
        {exploreItems.map(item => (
          <button key={item.label} onClick={() => navigate(item.path)}
            className="flex items-center gap-4 w-full px-3 py-2 rounded-xl hover:bg-zinc-800 transition text-gray-300 text-sm">
            {item.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
