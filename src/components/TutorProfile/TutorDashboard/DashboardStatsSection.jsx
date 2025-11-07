import React, { useState, useEffect } from "react";

export const DashboardStatsSection = () => {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const firstName = user.firstName || user.first_name || '';
        setUserName(firstName);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUserName('');
      }
    }
  }, []);

  return (
    <header className="w-full bg-gradient-to-r from-[#47A6E2] to-[#004D94] text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-normal">
          Welcome Back{userName ? `, ${userName}` : ''}!
        </h1>
        <p className="mt-2 text-[#f2e7fe] text-base md:text-lg">You're making a difference in students' lives</p>
      </div>
    </header>
  );
};
