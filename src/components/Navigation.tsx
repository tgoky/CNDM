import { Link, useLocation } from 'react-router-dom'
import { WalletButton } from './WalletButton'
import { Switch, Tooltip } from 'antd'
import { 
  DashboardOutlined,
  ShopOutlined,
  PlusCircleOutlined,
  UserOutlined,
  StarOutlined,
  ExperimentOutlined,
  BookOutlined,
} from '@ant-design/icons'
import { GraduationCap, Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'
import './navstyle/navigation.css'

export function Navigation() {
  const location = useLocation()
  const [darkMode, setDarkMode] = useState(false)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = (checked: boolean) => {
    setDarkMode(checked)
    if (checked) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const navItems = [
    { path: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { path: '/marketplace', icon: <ShopOutlined />, label: 'Marketplace' },
    { path: '/create', icon: <PlusCircleOutlined />, label: 'Create' },
    { path: '/my-listings', icon: <BookOutlined />, label: 'My Listings' },
    { path: '/reputation', icon: <StarOutlined />, label: 'Reputation' },
    { path: '/learning-session/demo', icon: <ExperimentOutlined />, label: 'Learning Session' },
    { path: '/profile', icon: <UserOutlined />, label: 'Profile' },
  ]

  return (
    <nav className="premium-nav">
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <div className="logo-icon">
            <GraduationCap size={20} />
          </div>
          <span className="logo-text">DED PLATFORM</span>
        </Link>

        {/* Main Navigation Icons */}
        <div className="nav-items">
          {navItems.map((item) => (
            <Tooltip key={item.path} title={item.label} placement="bottom">
              <Link 
                to={item.path} 
                className={`nav-icon-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.icon}
              </Link>
            </Tooltip>
          ))}
        </div>

        {/* Right Section */}
        <div className="nav-actions">
          {/* Theme Toggle */}
          <div className="theme-toggle">
            <Sun className={`theme-icon ${!darkMode ? 'active' : ''}`} size={16} />
            <Switch
              checked={darkMode}
              onChange={toggleTheme}
              size="small"
            />
            <Moon className={`theme-icon ${darkMode ? 'active' : ''}`} size={16} />
          </div>
          
          <WalletButton />
        </div>
      </div>
    </nav>
  )
}