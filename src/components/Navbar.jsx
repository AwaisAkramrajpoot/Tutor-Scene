import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { getConversations } from '../services/messagingService';

// Icons
const SearchIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

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

  useEffect(() => {
    // Check if user is logged in
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
    <nav className="bg-white border-b-2 border-blue-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <div className="flex items-center">
                {/* Logo Image */}
                <img 
                  src="/images/logo.png.png" 
                  alt="Tutor Scene Logo" 
                  className="h-10 w-auto"
                  onError={(e) => {
                    // Fallback to graduation cap icon if logo image doesn't exist
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                {/* Fallback Graduation Cap Icon */}
                <div className="hidden items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-blue-600 leading-none">TUTOR</span>
                    <span className="text-xl font-bold text-blue-600 leading-none">SCENE</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearchSubmit} className="flex">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Want to learn?"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-l-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsExploreOpen(!isExploreOpen)}
                  className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-blue-100 text-blue-700 text-sm font-medium hover:bg-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  Explore
                  <ChevronDownIcon className="ml-1" />
                </button>
                
                {/* Dropdown Menu */}
                {isExploreOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                    <div className="py-1">
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mathematics</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Science</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Languages</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Programming</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Music</a>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {/* Show Home only when user is not authenticated */}
              {!user && (
                <Link
                  to="/"
                  className="text-blue-600 hover:text-blue-800 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Home
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
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    (location.pathname === '/dashboard' && user.role === 'student') ||
                    (location.pathname === '/tutor-dashboard' && user.role === 'tutor') ||
                    (location.pathname === '/admin-dashboard' && user.role === 'admin')
                      ? 'text-blue-600 hover:text-blue-800'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </Link>
              )}
              {/* Show Find Tutors only if user is logged in and role is student */}
              {user && user.role === 'student' && (
                <Link
                  to="/find-tutors"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Find Tutors
                </Link>
              )}
              {/* Show Availability only for authenticated tutors with active status */}
              {user && user.role === 'tutor' && user.prospectStatus === 'active' && (
                <Link
                  to="/tutor/availability"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Availability
                </Link>
              )}
              {/* Show Interviews link for authenticated tutors and admins */}
              {user && (user.role === 'tutor' || user.role === 'admin') && (
                <Link
                  to="/interviews"
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname === '/interviews'
                      ? 'text-blue-600 hover:text-blue-800'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Interviews
                </Link>
              )}
              {/* Show Messages link for authenticated users (students always, tutors only if active) */}
              {user && (user.role === 'student' || user.role === 'admin' || (user.role === 'tutor' && user.prospectStatus === 'active')) && (
                <Link
                  to="/messages"
                  className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/messages')
                      ? 'text-blue-600 hover:text-blue-800'
                      : 'text-gray-700 hover:text-gray-900'
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
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Become a Tutor
                </Link>
              )}
              {/* Show About only when user is not authenticated */}
              {!user && (
                <Link
                  to="/about"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  About
                </Link>
              )}
            </div>
          </div>

          {/* Auth Buttons / User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              // Show user menu when logged in
              <>
                <button
                  onClick={handleMenuOpen}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
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
            ) : (
              // Show auth buttons when not logged in
              <>
                <Link
                  to="/signin"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-lg"
                >
                  Create free account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

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
