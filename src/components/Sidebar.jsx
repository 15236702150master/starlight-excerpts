import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  BookOpen, 
  Star, 
  Archive,
  Home
} from 'lucide-react'
import './Sidebar.css'

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: '首页',
      description: '返回主页'
    },
    {
      path: '/library',
      icon: BookOpen,
      label: '文库',
      description: '管理您的文章'
    },
    {
      path: '/starfield',
      icon: Star,
      label: '星空',
      description: '探索您的摘录'
    },
    {
      path: '/capsules',
      icon: Archive,
      label: '记忆胶囊',
      description: '时间胶囊'
    }
  ]

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="app-logo">
          <Star className="logo-icon" />
          <span className="app-name">星光摘录馆</span>
        </div>
        <p className="app-tagline">收集文字的光芒，点亮思想的星空</p>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <button
              key={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon className="nav-icon" />
              <div className="nav-content">
                <span className="nav-label">{item.label}</span>
                <span className="nav-description">{item.description}</span>
              </div>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default Sidebar
