import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import StatusBadge from '../components/StatusBadge';
import ProgressTracker from '../components/ProgressTracker';
import sampleApplications from '../data/sampleApplications';
import instituteList from '../data/instituteList';
import { evaluateProfile } from '../engine/eligibilityEngine';
import schemeRules from '../data/schemeRules';

export default function ApplicantDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'wallet', 'matched', 'applied', 'stream', 'support'
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Applications & upload state
  const [applications] = useState(sampleApplications);
  const [uploadStatus, setUploadStatus] = useState({});

  // Banner carousel state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const banners = [
    {
      id: 1,
      tag: language === 'hi' ? 'ऑफ़लाइन / ऑनलाइन परीक्षा' : 'OFFLINE / ONLINE EXAM',
      title: language === 'hi' ? 'आकाश नेशनल टैलेंट हंट परीक्षा (ANTHE) 2026' : 'Aakash National Talent Hunt Exam (ANTHE) 2026',
      sub: language === 'hi' ? '100% तक छात्रवृत्ति + ₹2.5 करोड़* नकद पुरस्कार | कक्षा 7वीं से 12वीं' : 'Up to 100% Scholarship + ₹2.5 Cr* Cash Awards | For Class 7th to 12th',
      bgGradient: 'from-sky-600 via-blue-700 to-indigo-800',
      badge: 'ANTHE 2026',
      buttonText: language === 'hi' ? 'पंजीकरण करें' : 'Register Now',
      buttonColor: 'bg-yellow-400 text-slate-900 hover:bg-yellow-300'
    },
    {
      id: 2,
      tag: language === 'hi' ? 'जनजातीय कार्य मंत्रालय' : 'MINISTRY OF TRIBAL AFFAIRS',
      title: language === 'hi' ? 'अनुसूचित जनजाति छात्रों हेतु राष्ट्रीय अध्येतावृत्ति (NFST) 2026-27' : 'National Fellowship for ST Students (NFST) 2026-27',
      sub: language === 'hi' ? '₹35,000/माह अध्येतावृत्ति + ₹10,000 वार्षिक आकस्मिकता अनुदान (एम.फिल / पीएच.डी)' : '₹35,000/mo Fellowship + ₹10,000 Annual Contingency for MPhil / PhD Scholars',
      bgGradient: 'from-emerald-700 via-teal-800 to-cyan-900',
      badge: 'MoTA Scheme',
      buttonText: language === 'hi' ? 'ऑनलाइन आवेदन करें' : 'Apply Online',
      buttonColor: 'bg-amber-400 text-slate-900 hover:bg-amber-300'
    },
    {
      id: 3,
      tag: language === 'hi' ? 'प्रमुख संस्थान' : 'PREMIER INSTITUTES',
      title: language === 'hi' ? '252 अधिसूचित संस्थानों हेतु टॉप क्लास शिक्षा छात्रवृत्ति' : 'Top Class Education Scheme for 252 Notified Institutes',
      sub: language === 'hi' ? 'आईआईटी, एम्स, आईआईएम, एनएलयू हेतु पूर्ण शिक्षण शुल्क छूट + ₹3,50,000/वर्ष निर्वाह भत्ता' : 'Full Tuition Fee Waiver + ₹3,50,000/year living allowance for IITs, AIIMS, IIMs, NLUs',
      bgGradient: 'from-indigo-900 via-purple-900 to-slate-900',
      badge: 'Top-Class 2026',
      buttonText: language === 'hi' ? 'संस्थान देखें' : 'Check Institutes',
      buttonColor: 'bg-orange-500 text-white hover:bg-orange-400'
    }
  ];

  // Auto-slide carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Applicant Profile Form State
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('edutribe_applicant_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      firstName: user?.full_name?.split(' ')[0] || 'Anita',
      lastName: user?.full_name?.split(' ').slice(1).join(' ') || 'Murmu',
      email: user?.email || 'anita.murmu@example.com',
      phone: '9876543210',
      whatsapp: '9876543210',
      sameAsMobile: true,
      dob: '2000-08-15',
      gender: 'Female',
      state: 'Jharkhand',
      district: 'Ranchi',
      religion: 'Sarna',
      category: 'Scheduled Tribe (ST)',
      aadhaar: '8945 6123 9842',
      aadhaarVerified: true,
      otrVerified: true,
      presentClass: 'Post Graduation',
      stream: 'M.Sc(IT)',
      institute: 'Indian Institute of Technology Delhi',
      marksPercent: 78.5,
      income: 200000,
      disability: 'No',
      studyAbroad: 'No'
    };
  });

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      if (name === 'sameAsMobile' && checked) {
        updated.whatsapp = updated.phone;
      }
      if (name === 'phone' && prev.sameAsMobile) {
        updated.whatsapp = value;
      }
      return updated;
    });
  };

  const handleSaveProfile = (e) => {
    e?.preventDefault();
    localStorage.setItem('edutribe_applicant_profile', JSON.stringify(profile));
    setToastMessage(language === 'hi' ? 'प्रोफ़ाइल जानकारी सफलतापूर्वक अपडेट और सहेजी गई!' : 'Profile information successfully updated and saved!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  function handleFileSelect(appId, docName) {
    setUploadStatus(prev => ({
      ...prev,
      [`${appId}-${docName}`]: true,
    }));
    setToastMessage(language === 'hi' ? `दस्तावेज़ "${docName}" आवेदन #${appId} हेतु अपलोड हो गया` : `Document "${docName}" uploaded for application #${appId}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }

  // Calculate live matched scholarships based on profile
  const matchedSchemes = evaluateProfile({
    educationLevel: profile.presentClass,
    income: Number(profile.income) || 0,
    age: 24,
    institute: profile.institute,
    isTopClassInstitute: !!profile.institute,
    studyDestination: profile.studyAbroad === 'Yes' ? 'Abroad' : 'India',
    marksPercent: Number(profile.marksPercent) || 75
  }, schemeRules);

  const menuItems = [
    { id: 'profile', label: t('tabs.myProfile', 'My Profile'), icon: '👤', badge: null },
    { id: 'wallet', label: t('tabs.docWallet', 'My Document Wallet'), icon: '🗂️', badge: language === 'hi' ? 'ओसीआर ✓' : 'OCR ✓', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
    { id: 'matched', label: t('tabs.matchedSchemes', 'Matched Scholarships'), icon: '⇄', badge: `${matchedSchemes.filter(s => s.status === 'ELIGIBLE').length} ${language === 'hi' ? 'पात्र' : 'Live'}`, badgeColor: 'bg-amber-500 text-slate-900' },
    { id: 'applied', label: t('tabs.appliedSchemes', 'Applied Scholarships'), icon: '📋', badge: applications.length, badgeColor: 'bg-navy-700 text-blue-200' },
    { id: 'stream', label: t('tabs.premierInstitutes', '252 Premier Institutes'), icon: '🎯', badge: '252', badgeColor: 'bg-blue-500/30 text-blue-200' },
    { id: 'support', label: t('tabs.support', 'Support & Helpdesk'), icon: '🎧', badge: null }
  ];

  return (
    <div className={`bg-[#f0f4f9] min-h-screen text-slate-800 pb-12 ${language === 'hi' ? 'font-devanagari' : ''}`}>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-slate-900 text-white px-4 py-3 sm:px-5 sm:py-3 rounded-xl shadow-2xl flex items-center gap-3 border-l-4 border-amber-400 animate-slide-up">
          <span className="text-emerald-400 font-bold text-lg">✓</span>
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Dynamic Layout (Responsive 2-Column: Sidebar + Full Workspace) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          
          {/* ========================================================= */}
          {/* COLUMN 1: LEFT SIDEBAR (Dynamic Width & Mobile Optimized)  */}
          {/* ========================================================= */}
          <aside className="lg:col-span-4 xl:col-span-3 w-full">
            <div className="bg-[#0c2340] text-white rounded-2xl shadow-md overflow-hidden lg:sticky lg:top-20">
              
              {/* Profile Avatar & Identity Card */}
              <div className="p-4 sm:p-5 flex flex-col items-center text-center border-b border-navy-700/80 bg-gradient-to-b from-[#091b33] to-[#0c2340]">
                <div className="relative mb-2.5">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 border-emerald-400/90 shadow-lg p-0.5 bg-slate-800 overflow-hidden flex items-center justify-center">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.firstName}&backgroundColor=b6e3f4`}
                      alt="Student Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 bg-emerald-500 text-white rounded-full p-1 shadow-md border-2 border-[#0c2340]" title="Verified Student">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-[11px] sm:text-xs text-blue-200 mt-0.5 font-medium">
                  {profile.presentClass} &bull; {profile.category}
                </p>

                {/* Generate Contact Card Button */}
                <button
                  type="button"
                  onClick={() => {
                    setToastMessage(language === 'hi' ? 'संपर्क कार्ड बनाया और डाउनलोड किया गया!' : 'Contact Card generated and downloaded!');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                  }}
                  className="mt-3 w-full py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold rounded-lg shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path></svg>
                  {t('profile.generateCard', 'Generate Contact Card')}
                </button>
                
              </div>

              {/* Sidebar Menu Items (Horizontal on small screens, Vertical on Desktop) */}
              <nav className="p-2 flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 text-xs font-medium no-scrollbar">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`shrink-0 lg:w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                      activeTab === item.id
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-200 hover:bg-navy-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* ========================================================= */}
          {/* COLUMN 2: FULL-WIDTH RESPONSIVE MAIN WORKSPACE             */}
          {/* ========================================================= */}
          <main className="lg:col-span-8 xl:col-span-9 w-full space-y-5">
            
            {/* Top Carousel Announcement Banner */}
            <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-white">
              <div className={`p-4 sm:p-6 bg-gradient-to-r ${banners[currentBannerIndex].bgGradient} text-white transition-all duration-500`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] tracking-wider uppercase bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
                    {banners[currentBannerIndex].tag}
                  </span>
                  <span className="text-xs bg-black/30 px-2 py-0.5 rounded font-mono text-blue-200">
                    {banners[currentBannerIndex].badge}
                  </span>
                </div>
                
                <h3 className="text-base sm:text-xl font-bold tracking-tight mb-1">
                  {banners[currentBannerIndex].title}
                </h3>
                <p className="text-xs sm:text-sm text-blue-100 mb-4 max-w-2xl leading-relaxed">
                  {banners[currentBannerIndex].sub}
                </p>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('matched')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg shadow transition cursor-pointer ${banners[currentBannerIndex].buttonColor}`}
                  >
                    {banners[currentBannerIndex].buttonText}
                  </button>

                  {/* Carousel Indicator Dots */}
                  <div className="flex items-center gap-1.5">
                    {banners.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentBannerIndex(i)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          currentBannerIndex === i ? 'bg-white w-5 sm:w-6' : 'bg-white/40 w-2'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* TAB 1: MY PROFILE (The Complete Form) */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4 sm:space-y-5">
                
                {/* 1. Header Contact & Photo Card */}
                <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-gray-100 gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-navy-900">
                      {profile.firstName} {profile.lastName}
                    </h3>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 w-fit">
                      {t('profile.completeBadge', 'Profile 100% Complete ✓')}
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row gap-5">
                    {/* Left: Photo Box */}
                    <div className="flex flex-col items-center md:w-40 shrink-0">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-100 rounded-xl border border-gray-200 p-1 flex items-center justify-center overflow-hidden shadow-xs">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.firstName}&backgroundColor=c0aede`}
                          alt="Student Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-2.5 text-xs text-blue-600 font-semibold">
                        <span className="cursor-pointer hover:underline">{t('common.edit', 'Edit')}</span>
                        <span className="text-gray-300">&bull;</span>
                        <span className="cursor-pointer hover:underline">{t('common.view', 'View')}</span>
                        <span className="text-gray-300">&bull;</span>
                        <span className="cursor-pointer hover:underline">{t('common.download', 'Download')}</span>
                      </div>
                    </div>

                    {/* Right: Contact Details with Verified Buttons */}
                    <div className="flex-1 space-y-3.5">
                      {/* Email */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-gray-700">{t('profile.email', 'E-mail')}</label>
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {t('common.verified', 'Verified')}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="email"
                            name="email"
                            value={profile.email}
                            onChange={handleProfileChange}
                            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setToastMessage(language === 'hi' ? 'ईमेल सत्यापन हेतु ओटीपी भेजा गया।' : 'OTP sent to email for update verification.');
                              setShowToast(true);
                              setTimeout(() => setShowToast(false), 3000);
                            }}
                            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shrink-0 shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>{t('profile.changeEmail', 'Change Email-Id')}</span>
                            <span className="text-[10px]">✏️</span>
                          </button>
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-gray-700">{t('profile.phone', 'Phone')}</label>
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {t('common.verified', 'Verified')}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            name="phone"
                            value={profile.phone}
                            onChange={handleProfileChange}
                            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setToastMessage(language === 'hi' ? 'मोबाइल नंबर सत्यापन हेतु ओटीपी भेजा गया।' : 'OTP sent to phone for update verification.');
                              setShowToast(true);
                              setTimeout(() => setShowToast(false), 3000);
                            }}
                            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shrink-0 shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>{t('profile.changePhone', 'Change Mobile No.')}</span>
                            <span className="text-[10px]">✏️</span>
                          </button>
                        </div>
                      </div>

                      {/* Whatsapp */}
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">{t('profile.whatsapp', 'Whatsapp')}</label>
                        <input
                          type="text"
                          name="whatsapp"
                          value={profile.whatsapp}
                          onChange={handleProfileChange}
                          disabled={profile.sameAsMobile}
                          className={`w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono ${
                            profile.sameAsMobile ? 'bg-slate-100 text-gray-500' : 'bg-white'
                          }`}
                        />
                        <div className="mt-1.5 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="sameAsMobile"
                            name="sameAsMobile"
                            checked={profile.sameAsMobile}
                            onChange={handleProfileChange}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <label htmlFor="sameAsMobile" className="text-xs text-gray-600 cursor-pointer">
                            {t('profile.sameAsMobile', 'Same as Mobile')}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Personal Information Card */}
                <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4 sm:p-6">
                  <h4 className="text-sm sm:text-base font-bold text-navy-900 mb-3 pb-2 border-b border-gray-100">
                    {t('profile.personalInfo', 'Personal Information')}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
                    {/* First Name */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        {t('profile.firstName', 'First Name')} <span className="text-gray-400">ⓘ</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={profile.firstName}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">{t('profile.lastName', 'Last Name')}</label>
                      <input
                        type="text"
                        name="lastName"
                        value={profile.lastName}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        {t('profile.dob', 'Date of Birth')} <span className="text-gray-400">ⓘ</span>
                      </label>
                      <input
                        type="date"
                        name="dob"
                        value={profile.dob}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        {t('profile.gender', 'Gender')} <span className="text-gray-400">ⓘ</span>
                      </label>
                      <select
                        name="gender"
                        value={profile.gender}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Female">{language === 'hi' ? 'महिला' : 'Female'}</option>
                        <option value="Male">{language === 'hi' ? 'पुरुष' : 'Male'}</option>
                        <option value="Other">{language === 'hi' ? 'अन्य' : 'Other'}</option>
                      </select>
                    </div>

                    {/* State */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">{t('profile.state', 'State')}</label>
                      <select
                        name="state"
                        value={profile.state}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Jharkhand">Jharkhand</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Chhattisgarh">Chhattisgarh</option>
                        <option value="Odisha">Odisha</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Delhi">Delhi</option>
                      </select>
                    </div>

                    {/* District */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">{t('profile.district', 'District')}</label>
                      <input
                        type="text"
                        name="district"
                        value={profile.district}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Religion */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        {t('profile.religion', 'Religion')} <span className="text-gray-400">ⓘ</span>
                      </label>
                      <select
                        name="religion"
                        value={profile.religion}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Sarna">Sarna</option>
                        <option value="Hindu">Hindu</option>
                        <option value="Christian">Christian</option>
                        <option value="Muslim">Muslim</option>
                        <option value="Sikh">Sikh</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Category */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        {t('profile.category', 'Category (MoTA ST Portal Priority)')}
                      </label>
                      <select
                        name="category"
                        value={profile.category}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 text-xs border border-amber-300 bg-amber-50/60 rounded-lg font-semibold text-navy-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Scheduled Tribe (ST)">{t('profile.categoryValue', 'Scheduled Tribe (ST) - 100% MoTA Scheme Eligible')}</option>
                        <option value="Scheduled Caste (SC)">Scheduled Caste (SC)</option>
                        <option value="OBC">Other Backward Classes (OBC)</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. KYC (Aadhaar Card Details) Card */}
                <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4 sm:p-6">
                  <h4 className="text-sm sm:text-base font-bold text-navy-900 mb-3 pb-2 border-b border-gray-100 flex items-center justify-between">
                    <span>{t('profile.kycTitle', 'KYC (Aadhaar Card Details)')}</span>
                    <span className="text-xs text-blue-600 font-medium">{t('profile.kycSubtitle', 'UIDAI e-KYC Integrated')}</span>
                  </h4>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex-1 w-full">
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        {t('profile.aadhaarNum', 'Aadhaar Number')} <span className="text-emerald-600 font-semibold">( ● {t('common.verified', 'verified')} )</span>
                      </label>
                      <input
                        type="text"
                        name="aadhaar"
                        value={profile.aadhaar}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-gray-300 rounded-lg font-mono text-gray-800"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setToastMessage(language === 'hi' ? 'आधार डिजिलॉकर केवाईसी पुनः सत्यापित!' : 'Aadhaar DigiLocker KYC re-validated!');
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 3000);
                      }}
                      className="w-full sm:w-auto mt-0 sm:mt-5 px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-lg shrink-0 transition cursor-pointer"
                    >
                      {t('profile.verifyBtn', 'Verify')}
                    </button>
                  </div>
                </div>

                {/* 4. Educational Information Card */}
                <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4 sm:p-6">
                  <h4 className="text-sm sm:text-base font-bold text-navy-900 mb-3 pb-2 border-b border-gray-100">
                    {t('profile.educationalInfo', 'Educational Information')}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Present Class/Degree */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        {t('profile.presentClass', 'Present Class/Degree')}* <span className="text-gray-400">ⓘ</span>
                      </label>
                      <select
                        name="presentClass"
                        value={profile.presentClass}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Class IX">Class IX</option>
                        <option value="Class X">Class X</option>
                        <option value="Class XI">Class XI</option>
                        <option value="Class XII">Class XII</option>
                        <option value="Diploma">Diploma / Polytechnic</option>
                        <option value="Graduate">Graduate (B.Tech / MBBS / B.Sc / BA)</option>
                        <option value="Post Graduation">Post Graduation (M.Tech / M.Sc / MA / MD)</option>
                        <option value="MPhil">MPhil</option>
                        <option value="PhD">PhD (Doctoral Research)</option>
                      </select>
                    </div>

                    {/* Course / Subject / Stream */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        {t('profile.stream', 'Course / Subject / Stream')}* <span className="text-gray-400">ⓘ</span>
                      </label>
                      <input
                        type="text"
                        name="stream"
                        value={profile.stream}
                        onChange={handleProfileChange}
                        placeholder="e.g. M.Sc(IT), Computer Science, MBBS"
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Institute / University */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        {t('profile.institute', 'Current Institute (252 MoTA Premier Institutes Autocomplete)')}
                      </label>
                      <select
                        name="institute"
                        value={profile.institute}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">{t('profile.selectInstitute', '-- Select or Other Recognized Institute --')}</option>
                        {instituteList.slice(0, 60).map((inst, i) => (
                          <option key={i} value={inst}>{inst}</option>
                        ))}
                      </select>
                    </div>

                    {/* Previous Marks Percentage */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        {t('profile.marks', 'Previous Academic Marks / CGPA (%)')}
                      </label>
                      <input
                        type="number"
                        name="marksPercent"
                        value={profile.marksPercent}
                        onChange={handleProfileChange}
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Other Information Card */}
                <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4 sm:p-6">
                  <h4 className="text-sm sm:text-base font-bold text-navy-900 mb-3 pb-2 border-b border-gray-100">
                    {t('profile.otherInfo', 'Other Information')}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Annual Family Income */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        {t('profile.annualIncome', 'Annual Family Income (₹)')}* <span className="text-gray-400">ⓘ</span>
                      </label>
                      <input
                        type="number"
                        name="income"
                        value={profile.income}
                        onChange={handleProfileChange}
                        placeholder="e.g. 200000"
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        {t('profile.incomeHelp', 'MoTA Pre/Post ceiling: ₹2.5L | Top-Class / NOS ceiling: ₹6.0L | NFST: No limit')}
                      </p>
                    </div>

                    {/* Person with Disability */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        {t('profile.disability', 'Person with Disability')} <span className="text-gray-400">ⓘ</span>
                      </label>
                      <div className="flex items-center gap-4 mt-2">
                        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="disability"
                            value="Yes"
                            checked={profile.disability === 'Yes'}
                            onChange={handleProfileChange}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          {t('common.yes', 'Yes')}
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="disability"
                            value="No"
                            checked={profile.disability === 'No'}
                            onChange={handleProfileChange}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          {t('common.no', 'No')}
                        </label>
                      </div>
                    </div>

                    {/* Study Abroad */}
                    <div className="sm:col-span-2 pt-2 border-t border-gray-100">
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        {t('profile.studyAbroad', 'Are you looking for a scholarship to study abroad? (National Overseas Scholarship)')}
                      </label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 mt-2">
                        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="studyAbroad"
                            value="Yes"
                            checked={profile.studyAbroad === 'Yes'}
                            onChange={handleProfileChange}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          {t('profile.studyAbroadYes', 'Yes (NOS Overseas Scheme)')}
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="studyAbroad"
                            value="No"
                            checked={profile.studyAbroad === 'No'}
                            onChange={handleProfileChange}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          {t('profile.studyAbroadNo', 'No (Study in India)')}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition transform active:scale-98 cursor-pointer"
                  >
                    {t('profile.updateProfileBtn', 'Update Profile')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('matched')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{t('profile.viewMatchedBtn', 'View Matched Schemes for this Profile')}</span>
                    <span>→</span>
                  </button>
                </div>

                {/* Delete Account */}
                <div className="pt-4 text-center sm:text-left">
                  <button
                    type="button"
                    onClick={() => alert(language === 'hi' ? 'खाता हटाने के लिए मंत्रालय नोडल अधिकारी से अनुमति आवश्यक है।' : 'Account deletion requires administrative clearance from Ministry nodal officer.')}
                    className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
                  >
                    {t('profile.deleteAccount', 'Delete My Account')}
                  </button>
                </div>

              </form>
            )}

            {/* TAB 2: MY DOCUMENT WALLET */}
            {activeTab === 'wallet' && (
              <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-navy-900">{t('wallet.title', 'My Document Wallet')}</h3>
                    <p className="text-xs text-gray-500">{t('wallet.subtitle', 'Certified government documents with instant OCR verification.')}</p>
                  </div>
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold w-fit">
                    {t('wallet.digilockerSynced', 'DigiLocker Synced ✓')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { name: t('wallet.stCert', 'ST Caste Certificate'), status: 'VERIFIED', num: 'JH/ST/2024/98124', date: '14-May-2024' },
                    { name: t('wallet.incomeCert', 'Annual Income Certificate'), status: 'VERIFIED', num: 'REV/INC/2026/4412', date: '01-Jan-2026' },
                    { name: t('wallet.marksheet', 'Previous Degree Marksheet'), status: 'VERIFIED', num: 'UNIV/MSc/2025/112', date: '20-Jun-2025' },
                    { name: t('wallet.admissionProof', 'Doctoral / College Admission Proof'), status: 'VERIFIED', num: 'IITD/ADM/2026/089', date: '12-Jul-2026' }
                  ].map((doc, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-navy-900">{doc.name}</p>
                          <p className="text-[11px] text-gray-500 font-mono mt-0.5">{doc.num}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between text-xs text-gray-600">
                        <span>{t('wallet.issued', 'Issued')}: {doc.date}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setToastMessage(language === 'hi' ? `${doc.name} खोला जा रहा है` : `Viewing ${doc.name}`);
                            setShowToast(true);
                            setTimeout(() => setShowToast(false), 2000);
                          }}
                          className="text-blue-600 hover:underline font-semibold cursor-pointer"
                        >
                          {t('wallet.viewDoc', 'View Document')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: MATCHED SCHEMES */}
            {activeTab === 'matched' && (
              <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-navy-900">{t('matched.title', 'Matched MoTA Scholarships')}</h3>
                    <p className="text-xs text-gray-500">{t('matched.subtitle', 'Live evaluation against all 5 Ministry of Tribal Affairs schemes.')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 font-semibold cursor-pointer w-fit"
                  >
                    {t('matched.editParams', 'Edit Profile Parameters')}
                  </button>
                </div>

                <div className="space-y-3">
                  {matchedSchemes.map((res) => (
                    <div
                      key={res.scheme.id}
                      className={`p-4 rounded-xl border transition ${
                        res.status === 'ELIGIBLE'
                          ? 'border-emerald-300 bg-emerald-50/40'
                          : res.status === 'PARTIALLY_ELIGIBLE'
                          ? 'border-amber-300 bg-amber-50/40'
                          : 'border-gray-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                              res.status === 'ELIGIBLE' ? 'bg-emerald-600 text-white' :
                              res.status === 'PARTIALLY_ELIGIBLE' ? 'bg-amber-500 text-slate-900' :
                              'bg-gray-400 text-white'
                            }`}>
                              {res.status === 'ELIGIBLE'
                                ? t('matched.eligible', 'Eligible')
                                : res.status === 'PARTIALLY_ELIGIBLE'
                                ? t('matched.partiallyEligible', 'Partially Eligible')
                                : t('matched.notEligible', 'Not Eligible')}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">{res.scheme.id}</span>
                          </div>
                          <h4 className="text-sm sm:text-base font-bold text-navy-900">{res.scheme.name}</h4>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{res.scheme.benefitSummary}</p>
                        </div>

                        {res.status === 'ELIGIBLE' && (
                          <button
                            type="button"
                            onClick={() => {
                              setToastMessage(language === 'hi' ? `${res.scheme.name} हेतु आवेदन पत्र शुरू किया गया!` : `Application draft initialized for ${res.scheme.name}!`);
                              setShowToast(true);
                              setTimeout(() => setShowToast(false), 3000);
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs shrink-0 cursor-pointer w-full sm:w-auto text-center"
                          >
                            {t('common.applyNow', 'Apply Now')}
                          </button>
                        )}
                      </div>

                      {res.failingCondition && (
                        <div className="mt-2 text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                          <strong>{t('matched.note', 'Note')}:</strong> {res.failingCondition}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: APPLIED SCHOLARSHIPS */}
            {activeTab === 'applied' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4 sm:p-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-navy-900">
                      {t('applied.title', 'Applied Scholarships')} ({applications.length})
                    </h3>
                    <p className="text-xs text-gray-500">{t('applied.subtitle', 'Track current status and upload pending verification certificates.')}</p>
                  </div>
                </div>

                {applications.map(app => (
                  <div key={app.id} className="border border-gray-200 bg-white rounded-2xl shadow-xs overflow-hidden">
                    {/* App header */}
                    <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs text-gray-500 font-mono bg-white px-2 py-0.5 rounded border border-gray-200">{app.id}</span>
                          <StatusBadge status={app.status} />
                        </div>
                        <h3 className="font-bold text-navy-900 text-sm sm:text-base">{app.scheme}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {t('applied.submittedOn', 'Submitted')}: {app.submittedDate} &bull; {t('applied.state', 'State')}: {app.state}
                        </p>
                      </div>
                    </div>

                    {/* Progress tracker */}
                    <div className="p-4 sm:p-5 bg-white border-b border-gray-100 overflow-x-auto">
                      <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-3">
                        {t('applied.stages', 'Verification Stages')}
                      </p>
                      <ProgressTracker currentStatus={app.status} />
                    </div>

                    {/* Documents */}
                    <div className="p-4 sm:p-5 bg-slate-50/40">
                      <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-3">
                        {t('applied.requiredDocs', 'Required Documents')}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {app.documents.map(doc => {
                          const key = `${app.id}-${doc.name}`;
                          const isUploaded = doc.uploaded || uploadStatus[key];

                          return (
                            <div
                              key={doc.name}
                              className={`flex items-center justify-between p-3 border rounded-xl text-xs ${
                                isUploaded
                                  ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                                  : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isUploaded ? (
                                  <span className="text-emerald-600 font-bold text-sm">✓</span>
                                ) : (
                                  <span className="text-gray-300 text-sm">○</span>
                                )}
                                <span className={isUploaded ? 'font-semibold text-emerald-950' : 'text-gray-600'}>
                                  {doc.name}
                                </span>
                              </div>

                              {!isUploaded && (
                                <label className="cursor-pointer text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-medium shadow-xs">
                                  {t('common.upload', 'Upload')}
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={() => handleFileSelect(app.id, doc.name)}
                                  />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: 252 PREMIER INSTITUTES */}
            {activeTab === 'stream' && (
              <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-navy-900">{t('premier.title', '252 MoTA Premier Notified Institutes')}</h3>
                    <p className="text-xs text-gray-500">{t('premier.subtitle', 'Institutions covered under the National Scholarship Top Class Education Scheme.')}</p>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200 font-bold w-fit">
                    {t('premier.centers', '252 Centers')}
                  </span>
                </div>

                <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
                  {instituteList.map((inst, idx) => (
                    <div key={idx} className="p-3 border border-gray-200 rounded-xl hover:bg-blue-50/50 transition flex items-center justify-between text-xs gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-navy-100 text-navy-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-navy-900">{inst}</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold shrink-0">
                        {t('premier.topClassEligible', 'Top-Class Eligible')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: SUPPORT */}
            {activeTab === 'support' && (
              <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4 sm:p-6 space-y-4">
                <div className="pb-3 border-b border-gray-100">
                  <h3 className="text-base sm:text-lg font-bold text-navy-900">{t('support.title', 'Student Grievance & Helpdesk')}</h3>
                  <p className="text-xs text-gray-500">{t('support.subtitle', 'Ministry of Tribal Affairs dedicated student support team.')}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-gray-200">
                    <p className="font-bold text-navy-900 mb-1">{t('support.helplineTitle', '📞 National Helpline')}</p>
                    <p className="text-gray-600">{t('support.helplineTollFree', 'Toll Free: 1800-11-2026')}</p>
                    <p className="text-gray-500 mt-1">{t('support.helplineHours', 'Monday – Friday (9:30 AM – 6:00 PM)')}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-gray-200">
                    <p className="font-bold text-navy-900 mb-1">{t('support.emailTitle', '✉️ Email Support')}</p>
                    <p className="text-gray-600">{t('support.emailAddress', 'support.scholarships@tribal.gov.in')}</p>
                    <p className="text-gray-500 mt-1">{t('support.emailResponse', 'Response time within 24-48 hours')}</p>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
