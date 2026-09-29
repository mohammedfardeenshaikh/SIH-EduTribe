import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedSchemeModal, setSelectedSchemeModal] = useState(null);

  const featuredSchemes = [
    {
      id: 'nfst_fellowship',
      title: 'National Fellowship for Scheduled Tribe (NFST)',
      description: 'Financial support for eligible research programmes (M.Phil./Ph.D.) in India.',
      badge: 'Active',
      iconType: 'graduation',
      boxColor: 'bg-blue-100 text-blue-600',
      btnBg: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
      details: 'Monthly fellowship of ₹35,000 + ₹10,000 contingency allowance. No income ceiling required for doctoral scholars.',
      level: 'MPhil / PhD',
      amount: '₹35,000 / month'
    },
    {
      id: 'nos_overseas',
      title: 'National Overseas Scholarship (NOS)',
      description: "Support for Master's and Ph.D. programmes abroad.",
      badge: 'Active',
      iconType: 'plane',
      boxColor: 'bg-emerald-100 text-emerald-600',
      btnBg: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
      details: 'Full international tuition coverage + living allowance for studying at top-ranked universities outside India.',
      level: "Master's / PhD Abroad",
      amount: 'Up to ₹25 Lakh'
    },
    {
      id: 'national_scholarship_top_class',
      title: 'Top Class Education Scheme for ST Students',
      description: 'Support for professional and technical courses in top institutions.',
      badge: 'Active',
      iconType: 'institution',
      boxColor: 'bg-amber-100 text-amber-600',
      btnBg: 'bg-amber-50 text-amber-800 hover:bg-amber-100',
      details: 'Full tuition fee reimbursement + ₹3.5 Lakhs annual allowance across 252 notified premier centers (IITs, AIIMS, IIMs, NLUs).',
      level: 'Graduation / PG',
      amount: 'Full Fee + ₹3.5 Lakh'
    },
    {
      id: 'post_matric',
      title: 'Post-Matric Scholarship for ST Students',
      description: 'Financial assistance for higher secondary and undergraduate studies.',
      badge: 'Active',
      iconType: 'book',
      boxColor: 'bg-purple-100 text-purple-600',
      btnBg: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
      details: 'Covers maintenance allowance and mandatory non-refundable fees from Class XI up to postgraduate levels.',
      level: 'Class XI to PG',
      amount: '₹50,000 / year'
    }
  ];

  function renderIcon(type) {
    switch (type) {
      case 'graduation':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18C5 19.94 8.13 22 12 22C15.87 22 19 19.94 19 17.18V13.18L12 17.09L5 13.18Z" />
          </svg>
        );
      case 'plane':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z" />
          </svg>
        );
      case 'institution':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L2 6V8H22V6L12 1M4 10V18H7V10H4M10 10V18H14V10H10M17 10V18H20V10H17M2 20V22H22V20H2Z" />
          </svg>
        );
      case 'book':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H19C20.1 22 21 21.1 21 20V4C21 2.9 20.1 2 19 2M19 20H6V4H7V13L9.5 11.5L12 13V4H19V20Z" />
          </svg>
        );
      default:
        return null;
    }
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800">
      
      {/* ========================================================= */}
      {/* 1. HERO SECTION                                           */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#eef5fc] via-[#e2efff] to-[#d6e9fc] pt-10 pb-20 lg:pt-14 lg:pb-28">
        
        {/* Soft Background Wave Accents */}
        <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-[400px] h-[400px] rounded-full bg-blue-300/20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-[500px] h-[500px] rounded-full bg-indigo-200/30 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Heading & Content */}
            <div className="lg:col-span-7 space-y-5 text-left">
              
              {/* Ministry Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/90 text-blue-700 text-xs font-semibold shadow-xs border border-blue-200">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L2 6V8H22V6L12 1M4 10V18H7V10H4M10 10V18H14V10H10M17 10V18H20V10H17M2 20V22H22V20H2Z" />
                </svg>
                <span>Ministry of Tribal Affairs</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-navy-900 leading-[1.15] tracking-tight">
                Scholarships & Fellowships<br />
                for <span className="text-blue-600">Scheduled Tribe Students</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
                Empowering ST students through digital access to education opportunities across India and abroad.
              </p>

              {/* Action CTA Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/eligibility')}
                  className="inline-flex items-center gap-2.5 bg-[#1a56db] hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform active:scale-98 cursor-pointer"
                >
                  <span>Check My Eligibility</span>
                  <span className="text-base font-bold">→</span>
                </button>
              </div>
            </div>

            {/* Right Column: Hero Visual Graphic */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[480px]">
                
                {/* Handwritten Artistic Badge Overlay */}
                <div className="absolute -top-3 -right-2 sm:-right-4 z-20 bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded-full shadow-md border border-blue-200/80 -rotate-3">
                  <span className="text-xs sm:text-sm font-bold text-blue-600 tracking-tight font-serif italic">
                    Education Empowers Communities ✨
                  </span>
                </div>

                {/* Hero Students Image */}
                <div className="rounded-2xl overflow-hidden shadow-xl border-4 border-white/90 bg-white aspect-4/3 relative">
                  <img
                    src="/hero_st_students.jpg"
                    alt="Scheduled Tribe College Students"
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      // Fallback if local image load fails
                      e.target.src = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  
                  {/* Subtle Gradient Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. FLOATING STATS BAR                                     */}
      {/* ========================================================= */}
      <section className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 -mt-10 sm:-mt-14 mb-14">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-7 grid grid-cols-2 md:grid-cols-4 gap-6 divide-y sm:divide-y-0 md:divide-x divide-gray-100">
          
          {/* Stat 1 */}
          <div className="flex items-center gap-3.5 pt-2 sm:pt-0">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2M18 20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-navy-900 leading-none">5+</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">MoTA Schemes</p>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="flex items-center gap-3.5 md:pl-6 pt-2 sm:pt-0">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18C5 19.94 8.13 22 12 22C15.87 22 19 19.94 19 17.18V13.18L12 17.09L5 13.18Z" />
              </svg>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-navy-900 leading-none">250+</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Partner Institutes</p>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="flex items-center gap-3.5 md:pl-6 pt-4 sm:pt-0">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xl font-mono">
              ₹
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-navy-900 leading-none">₹10 Lakh</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Max Support per Year</p>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="flex items-center gap-3.5 md:pl-6 pt-4 sm:pt-0">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11M8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11M8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13M16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" />
              </svg>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-navy-900 leading-none">100%</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Dedicated for ST Students</p>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. FEATURED SCHOLARSHIPS SECTION                          */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Featured <span className="text-blue-600">Scholarships</span>
          </h2>
          <Link
            to="/eligibility"
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
          >
            <span>View All Scholarships</span>
            <span className="text-base font-bold">→</span>
          </Link>
        </div>

        {/* 4 Schemes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredSchemes.map((scheme) => (
            <div
              key={scheme.id}
              className="bg-white rounded-xl p-5 border border-gray-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Icon + Active Badge Header */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className={`w-11 h-11 rounded-lg ${scheme.boxColor} flex items-center justify-center shrink-0`}>
                    {renderIcon(scheme.iconType)}
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {scheme.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-navy-900 text-sm leading-snug mb-2 line-clamp-2">
                  {scheme.title}
                </h3>

                {/* Short Description */}
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-4">
                  {scheme.description}
                </p>
              </div>

              {/* View Details Button */}
              <button
                type="button"
                onClick={() => setSelectedSchemeModal(scheme)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold ${scheme.btnBg} transition flex items-center justify-center gap-1 cursor-pointer`}
              >
                <span>View Details</span>
                <span className="text-sm font-bold">→</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. DETAILS MODAL                                          */}
      {/* ========================================================= */}
      {selectedSchemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative border border-gray-100">
            <button
              onClick={() => setSelectedSchemeModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold text-xl cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg ${selectedSchemeModal.boxColor} flex items-center justify-center shrink-0`}>
                {renderIcon(selectedSchemeModal.iconType)}
              </div>
              <div>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
                  {selectedSchemeModal.badge}
                </span>
                <h3 className="text-base font-bold text-navy-900 leading-snug mt-0.5">
                  {selectedSchemeModal.title}
                </h3>
              </div>
            </div>

            <div className="space-y-3 text-xs text-gray-600 bg-slate-50 p-4 rounded-xl border border-gray-200">
              <p><strong>Applicable Level:</strong> {selectedSchemeModal.level}</p>
              <p><strong>Benefit / Amount:</strong> <span className="text-emerald-700 font-bold">{selectedSchemeModal.amount}</span></p>
              <p><strong>Details:</strong> {selectedSchemeModal.details}</p>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedSchemeModal(null);
                  navigate('/eligibility');
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow transition cursor-pointer"
              >
                Check Eligibility for this Scheme →
              </button>
              <button
                type="button"
                onClick={() => setSelectedSchemeModal(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
