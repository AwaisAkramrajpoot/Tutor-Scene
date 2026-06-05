import React, { useState, useEffect } from "react";

export const DashboardStatsSection = () => {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const full =
          (typeof user.fullName === 'string' && user.fullName.trim()) ||
          [user.firstName || user.first_name, user.lastName || user.last_name]
            .filter(Boolean)
            .join(' ')
            .trim() ||
          (user.firstName || user.first_name || '');
        setUserName(full);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUserName('');
      }
    }
  }, []);

  return (
    <header
      className="w-full text-white"
      style={{
        background: `linear-gradient(to right, var(--brand-medium-blue), var(--brand-dark-blue))`,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-normal">
          Welcome Back{userName ? `, ${userName}` : ''}!
        </h1>
      </div>
    </header>
  );
};
