import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('Verification token is missing.');
      return;
    }

    const verify = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
        const response = await fetch(
          `${apiUrl}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );
        const data = await response.json();

        if (!response.ok) {
          setStatus(data.message || 'Email verification failed.');
          return;
        }

        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        setStatus('Email verified. Redirecting...');

        const target = data.user?.role === 'tutor' ? '/create-profile' : '/find-tutors';
        window.setTimeout(() => navigate(target), 900);
      } catch (error) {
        setStatus(error.message || 'Network error while verifying email.');
      }
    };

    verify();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow-md rounded-xl p-8 max-w-md w-full text-center">
        <h1 className="text-xl font-bold text-brand-medium-blue mb-2">Email Verification</h1>
        <p className="text-gray-700">{status}</p>
      </div>
    </div>
  );
};

export default VerifyEmail;
