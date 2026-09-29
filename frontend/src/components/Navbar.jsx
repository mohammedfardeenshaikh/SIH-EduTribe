import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regForm, setRegForm] = useState({
    name: 'Anita Murmu',
    email: 'anita.murmu@example.com',
    category: 'Scheduled Tribe (ST)',
    state: 'Jharkhand',
    aadhaar: '8945 6123 9842',
    password: 'applicant123'
  });
  const [regSuccess, setRegSuccess] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  function handleDummyRegister(e) {
    e.preventDefault();
    setRegSuccess(true);
    setTimeout(() => {
      setRegSuccess(false);
      setShowRegisterModal(false);
      navigate('/login');
    }, 1500);
  }

  return (
    <>
      <nav className="bg-white border-b border-gray-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2.5 text-xl font-extrabold text-navy-900 tracking-tight">
              <svg viewBox="0 0 36 36" className="w-8 h-8 text-navy-900" fill="none">
                <circle cx="18" cy="18" r="15" stroke="currentColor" strokeWidth="2.2" />
                <circle cx="18" cy="18" r="3.5" fill="currentColor" />
                {[...Array(24)].map((_, i) => (
                  <line
                    key={i}
                    x1="18"
                    y1="5"
                    x2="18"
                    y2="9.5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    transform={`rotate(${i * 15} 18 18)`}
                  />
                ))}
              </svg>
              <span className="text-navy-900 font-bold">Edu<span className="text-blue-600">Tribe</span></span>
            </Link>

            {/* Right Navigation Controls */}
            <div className="flex items-center gap-2 sm:gap-4 text-sm">
              {/* Compact Language Toggle */}
              <div
                className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold shadow-xs"
                role="group"
                aria-label="Language selection"
              >
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    language === 'en'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-navy-900 hover:bg-slate-200/60'
                  }`}
                  title="Switch to English"
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={`px-2.5 py-1 rounded-md font-devanagari transition-all cursor-pointer ${
                    language === 'hi'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-navy-900 hover:bg-slate-200/60'
                  }`}
                  title="हिंदी में बदलें"
                >
                  हिंदी
                </button>
              </div>

              {user ? (
                <>
                  <span className="text-gray-700 text-xs sm:text-sm font-medium hidden md:inline-block">
                    {user.full_name || user.email}
                  </span>

                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded uppercase tracking-wider hidden sm:inline-block">
                    {user.role === 'APPLICANT'
                      ? t('nav.applicant', 'APPLICANT')
                      : user.role === 'INSTITUTE_OFFICER'
                      ? t('nav.officer', 'INSTITUTE OFFICER')
                      : t('nav.admin', 'MINISTRY ADMIN')}
                  </span>

                  {user.role === 'APPLICANT' && (
                    <Link to="/applicant" className="text-gray-700 hover:text-blue-600 font-medium text-xs sm:text-sm">
                      {t('nav.dashboard', 'Dashboard')}
                    </Link>
                  )}
                  {user.role === 'INSTITUTE_OFFICER' && (
                    <Link to="/officer" className="text-gray-700 hover:text-blue-600 font-medium text-xs sm:text-sm">
                      {t('nav.dashboard', 'Dashboard')}
                    </Link>
                  )}
                  {user.role === 'MINISTRY_ADMIN' && (
                    <Link to="/admin" className="text-gray-700 hover:text-blue-600 font-medium text-xs sm:text-sm">
                      {t('nav.dashboard', 'Dashboard')}
                    </Link>
                  )}

                  <Link to="/eligibility" className="text-gray-700 hover:text-blue-600 font-medium text-xs sm:text-sm hidden sm:inline-block">
                    {t('nav.eligibility', 'Eligibility')}
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-xs font-medium transition cursor-pointer"
                  >
                    {t('nav.logout', 'Logout')}
                  </button>
                </>
              ) : (
                <>
                  {/* Dummy Registration Button */}
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(true)}
                    className="px-3 sm:px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    {t('nav.register', 'Register')}
                  </button>

                  {/* Login Button */}
                  <Link
                    to="/login"
                    className="px-3 sm:px-4 py-1.5 bg-navy-900 text-white rounded-md hover:bg-navy-800 text-xs font-semibold shadow-xs transition"
                  >
                    {t('nav.login', 'Login')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Dummy Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-gray-100">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold text-xl cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center mb-5">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                🎓
              </div>
              <h3 className="text-lg font-bold text-navy-900">Student Registration (OTR)</h3>
              <p className="text-xs text-gray-500">Ministry of Tribal Affairs — One-Time Registration</p>
            </div>

            {regSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-center rounded-xl space-y-1 my-4">
                <p className="font-bold text-sm">✓ OTR Account Created Successfully!</p>
                <p className="text-xs text-emerald-700">Redirecting to Login Portal...</p>
              </div>
            ) : (
              <form onSubmit={handleDummyRegister} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Category</label>
                    <input
                      type="text"
                      value={regForm.category}
                      readOnly
                      className="w-full px-3 py-1.5 text-xs bg-amber-50 border border-amber-300 rounded font-semibold text-navy-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">State</label>
                    <input
                      type="text"
                      value={regForm.state}
                      onChange={(e) => setRegForm({ ...regForm, state: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Aadhaar Number (UIDAI e-KYC)
                  </label>
                  <input
                    type="text"
                    value={regForm.aadhaar}
                    onChange={(e) => setRegForm({ ...regForm, aadhaar: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Password</label>
                  <input
                    type="password"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
                  >
                    Complete One-Time Registration (OTR)
                  </button>
                </div>

                <p className="text-[11px] text-gray-400 text-center mt-2">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegisterModal(false);
                      navigate('/login');
                    }}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Login here
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
