import { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    home: 'Home', shorts: 'Shorts', subscriptions: 'Subscriptions',
    you: 'You', yourChannel: 'Your channel', history: 'History',
    playlists: 'Playlists', yourVideos: 'Your videos', watchLater: 'Watch later',
    likedVideos: 'Liked videos', explore: 'Explore', music: 'Music',
    movies: 'Movies', gaming: 'Gaming', news: 'News', sports: 'Sports',
    search: 'Search', create: 'Create', uploadVideo: 'Upload video',
    goLive: 'Go live', createPost: 'Create post', viewYourChannel: 'View your channel',
    googleAccount: 'Google Account', switchAccount: 'Switch account',
    signOut: 'Sign out', veloGoStudio: 'VeloGo Studio', adminPanel: 'Admin Panel',
    purchases: 'Purchases and memberships', appearance: 'Appearance',
    appearanceDark: 'Appearance: Dark', appearanceLight: 'Appearance: Light',
    language: 'Language', settings: 'Settings', help: 'Help',
    sendFeedback: 'Send feedback', subscribe: 'Subscribe', subscribed: 'Subscribed',
    noVideosYet: 'No videos yet', beFirst: 'Be the first to upload a video!',
    views: 'views', accounts: 'Accounts', addAccount: 'Add account',
    channel: 'Channel',
  },
  lt: {
    home: 'Pagrindinis', shorts: 'Trumpi', subscriptions: 'Prenumeratos',
    you: 'Jūs', yourChannel: 'Jūsų kanalas', history: 'Istorija',
    playlists: 'Grojaraščiai', yourVideos: 'Jūsų video', watchLater: 'Vėliau žiūrėti',
    likedVideos: 'Patikti video', explore: 'Tyrinėti', music: 'Muzika',
    movies: 'Filmai', gaming: 'Žaidimai', news: 'Naujienos', sports: 'Sportas',
    search: 'Ieškoti', create: 'Kurti', uploadVideo: 'Įkelti video',
    goLive: 'Transliuoti', createPost: 'Sukurti įrašą', viewYourChannel: 'Peržiūrėti kanalą',
    googleAccount: 'Google paskyra', switchAccount: 'Keisti paskyrą',
    signOut: 'Atsijungti', veloGoStudio: 'VeloGo Studija', adminPanel: 'Admin Panelė',
    purchases: 'Pirkimai ir narystės', appearance: 'Išvaizda',
    appearanceDark: 'Išvaizda: Tamsi', appearanceLight: 'Išvaizda: Šviesi',
    language: 'Kalba', settings: 'Nustatymai', help: 'Pagalba',
    sendFeedback: 'Siųsti atsiliepimą', subscribe: 'Prenumeruoti', subscribed: 'Prenumeruojama',
    noVideosYet: 'Video dar nėra', beFirst: 'Būkite pirmieji, kas įkels video!',
    views: 'peržiūros', accounts: 'Paskyros', addAccount: 'Pridėti paskyrą',
    channel: 'Kanalas',
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('velogo_lang') || 'en');

  const switchLang = (l) => {
    setLang(l);
    localStorage.setItem('velogo_lang', l);
  };

  const t = (key) => translations[lang][key] || translations['en'][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
