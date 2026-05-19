import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { getConversations } from '../services/messagingService';
import { getNotifications } from '../services/notificationsService';
import {
  isTutorApproved,
  isTutorInInitialOnboarding,
  isTutorOnboardingPath,
} from '../utils/tutorProspectStatus';

// Icons
const ChevronDownIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifBadgeCount, setNotifBadgeCount] = useState(0);
  const isStudent = user?.role === 'student';
  const isVerifyIdentityRoute = location.pathname.startsWith('/verify-identity');
  const isTutorOnboardingPage =
    isTutorOnboardingPath(location.pathname) ||
    location.pathname === '/ready-to-teach' ||
    isVerifyIdentityRoute;
  const tutorApproved = isTutorApproved(user);
  const tutorInOnboarding = isTutorInInitialOnboarding(user);
  const showTutorMarketingNav =
    user?.role === 'tutor' && (isTutorOnboardingPage || tutorInOnboarding || !tutorApproved);

  // Check if user is logged in
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
    }
  }, []);

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return;
      try {
        const conversations = await getConversations();
        const totalUnread = conversations.reduce(
          (sum, conv) => sum + (conv.unreadCount || 0),
          0
        );
        setUnreadCount(totalUnread);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (!isStudent || !user?.id) return;
    const loadNotifs = async () => {
      try {
        const res = await getNotifications(user.id);
        const list = Array.isArray(res) ? res : res?.data || [];
        setNotifBadgeCount(Math.min(list.length, 99));
      } catch {
        setNotifBadgeCount(0);
      }
    };
    loadNotifs();
    const t = setInterval(loadNotifs, 60000);
    return () => clearInterval(t);
  }, [isStudent, user?.id]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log('Search query:', searchQuery);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDashboardClick = () => {
    handleMenuClose();
    // Route based on user role
    if (user.role === 'tutor') {
      navigate('/tutor-dashboard');
    } else if (user.role === 'student') {
      navigate('/dashboard');
    } else if (user.role === 'admin') {
      navigate('/admin-dashboard');
    }
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('tutorBgCheckTermsAccepted');
    sessionStorage.removeItem('tutorVerificationSubmitted');
    
    // Close dialog
    setLogoutDialogOpen(false);
    
    // Update state
    setUser(null);
    
    // Navigate to sign in
    navigate('/signin');
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-white shadow-sm">
      <div className="max-w-7xl mx-auto relative min-h-[4rem] md:min-h-[4.25rem] flex items-center justify-end px-4 sm:px-6 lg:px-8 py-2 w-full">
          <Link 
            to={user ? (
              user.role === 'student' ? '/dashboard' :
              user.role === 'tutor' ? (tutorApproved && !tutorInOnboarding ? '/tutor-dashboard' : '/create-profile') :
              user.role === 'admin' ? '/admin-dashboard' : '/'
            ) : '/'}
            className={`absolute left-4 sm:left-6 lg:left-8 z-20 flex cursor-pointer items-center ${
              isVerifyIdentityRoute
                ? 'top-1/2 -translate-y-1/2'
                : 'bottom-0 translate-y-[42%] items-end'
            }`}
          >
            {isVerifyIdentityRoute ? (
              <span className="text-lg font-bold tracking-tight text-brand-dark-blue sm:text-xl">
                Tutor Scene
              </span>
            ) : (
            <div className="flex items-end">
              <img 
                src="/images/logo.png.png" 
                alt="Tutor Scene Logo" 
                className="h-[3.25rem] sm:h-[4rem] md:h-[7.4rem] w-auto object-contain object-bottom drop-shadow-md"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden items-center gap-2 pb-0.5">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-dark-blue rounded-full flex items-center justify-center border-2 border-brand-gold flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                  </svg>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-lg md:text-xl font-bold text-brand-dark-blue">TUTOR</span>
                  <span className="text-lg md:text-xl font-bold text-brand-medium-blue">SCENE</span>
                </div>
              </div>
            </div>
            )}
          </Link>
        <div className={`flex flex-1 min-h-[2.75rem] items-center justify-end gap-2 md:gap-3 ${
          isVerifyIdentityRoute
            ? 'pl-28 sm:pl-32 md:pl-36'
            : 'pl-[6.5rem] sm:pl-[8.5rem] md:pl-[10.5rem] lg:pl-[11rem]'
        }`}>
              {/* Show Home only when user is not authenticated */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 flex-shrink-0">
              {(!user || user.role !== 'admin') && (
                <>
                  <Link
                    to="/"
                    className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      location.pathname === '/'
                        ? 'text-brand-medium-blue font-semibold'
                        : 'text-gray-700 hover:text-brand-medium-blue'
                    }`}
                  >
                    Home
                  </Link>
                  <Link
                    to="/about"
                    className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      location.pathname === '/about'
                        ? 'text-brand-medium-blue font-semibold'
                        : 'text-gray-700 hover:text-brand-medium-blue'
                    }`}
                  >
                    About
                  </Link>
                </>
              )}
              {showTutorMarketingNav && (
                <>
                  <Link
                    to="/become-tutor"
                    className="text-gray-700 hover:text-brand-medium-blue px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    Become a Tutor
                  </Link>
                  <Link
                    to="/create-profile"
                    className="bg-brand-gold hover:bg-brand-dark-blue text-white px-4 py-1 rounded-md text-sm font-normal uppercase tracking-wide transition-all shadow-md hover:shadow-lg border-2 border-transparent hover:border-brand-gold"
                  >
                    Get Started
                  </Link>
                </>
              )}
              {isStudent && (
                <>
                  <Link
                    to="/dashboard"
                    className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      location.pathname === '/dashboard'
                        ? 'text-brand-medium-blue font-semibold'
                        : 'text-gray-700 hover:text-brand-medium-blue'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/find-tutors"
                    className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      location.pathname === '/find-tutors'
                        ? 'text-brand-medium-blue font-semibold'
                        : 'text-gray-700 hover:text-brand-medium-blue'
                    }`}
                  >
                    Find Tutors
                  </Link>
                </>
              )}
              {!user && (
                <Link
                  to="/signin"
                  className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    location.pathname === '/signin'
                      ? 'text-brand-medium-blue font-semibold'
                      : 'text-gray-700 hover:text-brand-medium-blue'
                  }`}
                >
                  Sign In
                </Link>
              )}
              {user &&
                user.role !== 'student' &&
                (user.role === 'admin'
                  //  ||
                  // (user.role === 'tutor' && user.prospectStatus === 'active')
                ) && (
                  <Link
                    to={user.role === 'tutor' ? '/tutor-dashboard' : '/admin-dashboard'}
                    className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      (location.pathname === '/tutor-dashboard' && user.role === 'tutor') ||
                      (location.pathname === '/admin-dashboard' && user.role === 'admin')
                        ? 'text-brand-medium-blue hover:text-brand-dark-blue font-semibold'
                        : 'text-gray-700 hover:text-brand-medium-blue'
                    }`}
                  >
                    Dashboard
                  </Link>
                )}
              {/* Show Availability only for authenticated tutors with active status */}
              {/* {user && user.role === 'tutor' && user.prospectStatus === 'active' && (
                <Link
                  to="/tutor/availability"
                  className="text-gray-700 hover:text-brand-medium-blue px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Availability
                </Link>
              )} */}
              {/* Show Interviews link for authenticated tutors and admins */}
              {/* {user && (user.role === 'tutor' || user.role === 'admin') && !isTutorOnboardingPage && (
                <Link
                  to="/interviews"
                  className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    location.pathname === '/interviews'
                      ? 'text-brand-medium-blue hover:text-brand-dark-blue font-semibold'
                      : 'text-gray-700 hover:text-brand-medium-blue'
                  }`}
                >
                  Interviews
                </Link>
              )} */}
              {user &&
                user.role !== 'student' &&
                (user.role === 'admin'  
                  // (user.role === 'tutor' && user.prospectStatus === 'active')
                ) && (
                  <Link
                    to="/messages"
                    className={`relative px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      location.pathname.startsWith('/messages')
                        ? 'text-brand-medium-blue hover:text-brand-dark-blue font-semibold'
                        : 'text-gray-700 hover:text-brand-medium-blue'
                    }`}
                  >
                    Messages
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                )}
              {(!user || user.role !== 'tutor') && !(user && user.role === 'student') && (
                <Link
                  to="/become-tutor"
                  className="text-gray-700 hover:text-brand-medium-blue px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Become a Tutor
                </Link>
              )}
              {!user && (
                <Link
                  to="/signup"
                  className="bg-brand-gold hover:bg-brand-dark-blue text-white px-4 py-1 rounded-md text-sm font-normal uppercase tracking-wide transition-all shadow-md hover:shadow-lg border-2 border-transparent hover:border-brand-gold"
                >
                  Get Started
                </Link>
              )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {user ? (
              <>
                {user.role === 'tutor' && showTutorMarketingNav && !tutorApproved ? (
                  <button
                    onClick={handleLogoutClick}
                    className="px-4 py-1.5 text-sm font-medium text-gray-700 border border-gray-400 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Log Out
                  </button>
                ) : user.role === 'tutor' && tutorApproved ? (
                  <>
                    <button
                      onClick={handleMenuOpen}
                      className="flex items-center space-x-2 text-brand-dark-blue hover:text-brand-medium-blue px-3 py-2 text-sm font-semibold transition-colors"
                    >
                      <span>{user.firstName || 'Account'}</span>
                      <ChevronDownIcon />
                    </button>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleMenuClose}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                    >
                      <MenuItem onClick={handleDashboardClick}>Dashboard</MenuItem>
                      <MenuItem onClick={handleLogoutClick}>Log Out</MenuItem>
                    </Menu>
                  </>
                ) : (
                  <>
                    {/* ── STUDENT ONLY: Bell + Envelope icon symbols ── */}
                    {user.role === 'student' && (
                      <>
                        {/* Bell Icon - Notifications */}
                        <Link
                          to="/notifications"
                          className="relative text-yellow-500 hover:text-yellow-600 transition-colors"
                          title="Notifications"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          {notifBadgeCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center">
                              {notifBadgeCount > 9 ? '9+' : notifBadgeCount}
                            </span>
                          )}
                        </Link>

                        <Link
                          to="/messages"
                          className={`relative transition-colors ${
                            location.pathname.startsWith('/messages')
                              ? 'text-brand-medium-blue'
                              : 'text-brand-medium-blue hover:text-brand-dark-blue'
                          }`}
                          title="Messages"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </Link>
                      </>
                    )}

                    <button
                      onClick={handleMenuOpen}
                      className="flex items-center space-x-2 text-brand-dark-blue hover:text-brand-medium-blue px-3 py-2 text-sm font-semibold transition-colors"
                    >
                      <span>{user.firstName || 'Account'}</span>
                      <ChevronDownIcon />
                    </button>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleMenuClose}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                    >
                      {/* ── STUDENT ONLY: updated dropdown menu items ── */}
                      {user.role === 'student' ? (
                        <>
                          <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>Profile</MenuItem>
                          <MenuItem onClick={() => { handleMenuClose(); navigate('/account-settings'); }}>Account Settings</MenuItem>
                          <MenuItem onClick={() => { handleMenuClose(); navigate('/my-sessions'); }}>Session History</MenuItem>
                          <MenuItem onClick={() => { handleMenuClose(); navigate('/credits-referrals'); }}>Credits &amp; Referrals</MenuItem>
                          <MenuItem onClick={handleLogoutClick} sx={{ color: 'red' }}>Log Out</MenuItem>
                        </>
                      ) : (
                        // Tutor & Admin: original menu items UNCHANGED
                        <>
                          <MenuItem onClick={handleDashboardClick}>Dashboard</MenuItem>
                          <MenuItem onClick={handleLogoutClick} sx={{ color: 'red' }}>Logout</MenuItem>
                        </>
                      )}
                    </Menu>
                  </>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
      <div className="w-full shrink-0 border-b-4 border-brand-gold" />
      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        aria-labelledby="logout-dialog-title"
      >
        <DialogTitle id="logout-dialog-title">Confirm Logout</DialogTitle>
        <DialogContent>
          <p>Are you sure you want to logout?</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLogoutConfirm} color="error" variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </nav>
  );
};

export default Navbar;