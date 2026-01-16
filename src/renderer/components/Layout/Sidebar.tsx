/**
 * Sidebar Component
 * 
 * Navigation sidebar with menu items for different views:
 * - Tools
 * - Packages
 * - Services
 * - Environment
 * - Settings
 * 
 * Validates: Requirements 5.1, 5.2
 */

import React from 'react'
import { Layout, Menu } from 'antd'
import {
  ToolOutlined,
  AppstoreOutlined,
  CloudServerOutlined,
  SettingOutlined,
  CodeOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import type { ViewType } from '@shared/types'

const { Sider } = Layout

interface SidebarProps {
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onCollapse }) => {
  const { t } = useTranslation()
  const { currentView, setCurrentView } = useAppStore()

  const menuItems = [
    {
      key: 'tools' as ViewType,
      icon: <ToolOutlined />,
      label: t('nav.tools'),
    },
    {
      key: 'packages' as ViewType,
      icon: <AppstoreOutlined />,
      label: t('nav.packages'),
    },
    {
      key: 'services' as ViewType,
      icon: <CloudServerOutlined />,
      label: t('nav.services'),
    },
    {
      key: 'environment' as ViewType,
      icon: <CodeOutlined />,
      label: t('nav.environment'),
    },
    {
      key: 'settings' as ViewType,
      icon: <SettingOutlined />,
      label: t('nav.settings'),
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    setCurrentView(key as ViewType)
  }

  return (
    <Sider
      width={200}
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      className="bg-white border-r border-gray-200"
      theme="light"
      breakpoint="lg"
      collapsedWidth={80}
    >
      <Menu
        mode="inline"
        selectedKeys={[currentView]}
        onClick={handleMenuClick}
        items={menuItems}
        className="h-full border-r-0 pt-4"
        style={{ height: '100%' }}
      />
    </Sider>
  )
}

export default Sidebar
