import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'APPLICANT') navigate('/eligibility');
      else if (user.role === 'INSTITUTE_OFFICER') navigate('/officer');
      else if (user.role === 'MINISTRY_ADMIN') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-navy-800 py-6 px-4 flex flex-col items-center">
          <svg viewBox="0 0 32 32" className="w-12 h-12 text-white mb-2" fill="none">
            <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" />
            <circle cx="16" cy="16" r="3" fill="currentColor" />
            {[...Array(24)].map((_, i) => (
              <line
                key={i}
                x1="16"
                y1="5"
                x2="16"
                y2="9"
                stroke="currentColor"
                strokeWidth="1.2"
                transform={`rotate(${i * 15} 16 16)`}
              />
            ))}
          </svg>
          <h2 className="text-center text-3xl font-extrabold text-white">EduTribe</h2>
          <p className="mt-2 text-center text-sm text-blue-200">
            Sign in to your account
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Demo Credentials:</h3>
            <ul className="text-xs text-gray-500 space-y-1">
              <li><strong>Admin:</strong> admin@edutribe.gov.in / admin123</li>
              <li><strong>Officer:</strong> officer.iitd@edutribe.gov.in / officer123</li>
              <li><strong>Applicant:</strong> anita.murmu@example.com / applicant123</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
