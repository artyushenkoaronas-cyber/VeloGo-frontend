import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useState } from 'react';

export default function VeloGram() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar onMenuToggle={() => setSidebarOpen(p => !p)} />
      <Sidebar open={sidebarOpen} />
      <main className={`pt-14 transition-all duration-200 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 2c2.09 0 4.014.77 5.507 2.036L4.036 17.507A7.963 7.963 0 014 12c0-4.411 3.589-8 8-8zm0 16c-2.09 0-4.014-.77-5.507-2.036L19.964 6.493A7.963 7.963 0 0120 12c0 4.411-3.589 8-8 8z"/>
            </svg>
          </div>
          <h1 className="text-white text-3xl font-bold mb-2">VeloGoTAGRAM</h1>
          <p className="text-gray-500 text-sm">Coming soon</p>
        </div>
      </main>
    </div>
  );
}
