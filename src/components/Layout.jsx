import React, { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const isMessagingRoute = pathname.startsWith('/messages');

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.style.overflow = isMessagingRoute ? 'hidden' : '';
    document.body.style.overflow = isMessagingRoute ? 'hidden' : '';

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [pathname, isMessagingRoute]);

  return (
    <div
      className={
        isMessagingRoute
          ? 'flex h-screen flex-col overflow-hidden'
          : 'flex min-h-screen flex-col'
      }
    >
      <Navbar />
      <main
        className={
          isMessagingRoute
            ? 'flex min-h-0 flex-1 flex-col overflow-hidden pt-[4.25rem]'
            : 'flex-grow pt-[4.25rem]'
        }
      >
        {children}
      </main>
      {!isMessagingRoute && <Footer />}
    </div>
  );
};

export default Layout;

