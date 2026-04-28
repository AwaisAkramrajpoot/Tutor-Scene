import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { getConversations } from '../services/messagingService';

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
  }, [user?.id]); // Only depend on user ID, not the entire user object

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
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
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
              user.role === 'tutor' ? '/tutor-dashboard' :
              user.role === 'admin' ? '/admin-dashboard' : '/'
            ) : '/'}
            className="absolute left-4 sm:left-6 lg:left-8 bottom-0 translate-y-[42%] z-20 flex items-end cursor-pointer"
          >
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
          </Link>
        <div className="flex flex-1 min-h-[2.75rem] pl-[6.5rem] sm:pl-[8.5rem] md:pl-[10.5rem] lg:pl-[11rem] items-center justify-end gap-2 md:gap-3">
              {/* Show Home only when user is not authenticated */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 flex-shrink-0">
              {!user && (
                <Link
                  to="/"
                  className="text-brand-medium-blue hover:text-brand-dark-blue px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Home
                </Link>
              )}
              {!user && (
                <Link
                  to="/about"
                  className="text-gray-700 hover:text-brand-medium-blue px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  About
                </Link>
              )}
              {!user && (
                <Link
                  to="/signin"
                  className="text-brand-medium-blue hover:text-brand-dark-blue px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Sign in
                </Link>
              )}
              {/* Show Dashboard for authenticated students, tutors (active), and admins */}
              {user && (user.role === 'student' || user.role === 'admin' || (user.role === 'tutor' && user.prospectStatus === 'active')) && (
                <Link
                  to={
                    user.role === 'student' 
                      ? '/dashboard' 
                      : user.role === 'tutor' 
                      ? '/tutor-dashboard' 
                      : '/admin-dashboard'
                  }
                  className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    (location.pathname === '/dashboard' && user.role === 'student') ||
                    (location.pathname === '/tutor-dashboard' && user.role === 'tutor') ||
                    (location.pathname === '/admin-dashboard' && user.role === 'admin')
                      ? 'text-brand-medium-blue hover:text-brand-dark-blue font-semibold'
                      : 'text-gray-700 hover:text-brand-medium-blue'
                  }`}
                >
                  Dashboard
                </Link>
              )}
              {/* Show Find Tutors only if user is logged in and role is student */}
              {user && user.role === 'student' && (
                <Link
                  to="/find-tutors"
                  className="text-gray-700 hover:text-brand-medium-blue px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Find Tutors
                </Link>
              )}
              {/* Show Availability only for authenticated tutors with active status */}
              {user && user.role === 'tutor' && user.prospectStatus === 'active' && (
                <Link
                  to="/tutor/availability"
                  className="text-gray-700 hover:text-brand-medium-blue px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Availability
                </Link>
              )}
              {/* Show Interviews link for authenticated tutors and admins */}
              {user && (user.role === 'tutor' || user.role === 'admin') && (
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
              )}
              {/* Show Messages link for authenticated users (students always, tutors only if active) */}
              {user && (user.role === 'student' || user.role === 'admin' || (user.role === 'tutor' && user.prospectStatus === 'active')) && (
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
              {/* Hide "Become a Tutor" if user is already a tutor (active or pending) */}
              {(!user || user.role !== 'tutor') && (
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
                <button
                  onClick={handleMenuOpen}
                  className="flex items-center space-x-2 text-brand-dark-blue hover:text-brand-medium-blue px-3 py-2 text-sm font-semibold transition-colors"
                >
                  <span>{`${user.firstName.toUpperCase()} ${user.lastName.toUpperCase()}`}</span>
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
                  <MenuItem onClick={handleLogoutClick} sx={{ color: 'red' }}>Logout</MenuItem>
                </Menu>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <div className="w-full shrink-0 border-b-2 border-brand-gold" />
      <div className="w-full shrink-0 h-2.5 md:h-2.5 bg-white" />

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
