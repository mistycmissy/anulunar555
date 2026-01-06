import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Navbar = () => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <nav className="bg-cosmic-950/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🌙</span>
            <span className="text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cosmic-300 to-lunar-300">
              AnuLunar
            </span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link to="/" className="text-gray-300 hover:text-cosmic-300 transition-colors">
              Home
            </Link>
            <Link to="/today" className="text-gray-300 hover:text-cosmic-300 transition-colors">
              Today
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-300 hover:text-cosmic-300 transition-colors">
                  Dashboard
                </Link>
                <Link to="/marketplace" className="text-gray-300 hover:text-cosmic-300 transition-colors">
                  Marketplace
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-300 hover:text-cosmic-300 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/signin" className="text-gray-300 hover:text-cosmic-300 transition-colors">
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary text-sm py-1.5 px-4">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
