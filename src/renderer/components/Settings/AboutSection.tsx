/**
 * AboutSection Component
 * 
 * Displays application information including version, author, and links.
 * 
 * Validates: Requirements 5.1, 14.1
 * - 5.1: Clean and intuitive layout
 * - 14.1: Include comprehensive README file
 */

import React from 'react'
import { Card, Typography, Space, Divider, Tag, Button, Descriptions } from 'antd'
import {
  InfoCircleOutlined,
  GithubOutlined,
  BugOutlined,
  HeartOutlined,
  CodeOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

const { Title, Text, Paragraph, Link } = Typography

// ============================================================================
// Application Info
// ============================================================================

const APP_INFO = {
  name: 'Dev Tools Manager',
  version: '1.0.0',
  author: 'Dev Tools Team',
  license: 'MIT',
  repository: 'https://github.com/example/dev-tools-manager',
  issueTracker: 'https://github.com/example/dev-tools-manager/issues',
  description: {
    'en-US': 'A unified visual interface for detecting, viewing, and managing development tools and dependencies installed on your system.',
    'zh-CN': '一个统一的可视化界面，用于检测、查看和管理系统中安装的各种开发工具和依赖包。',
  },
}

// ============================================================================
// Feature List
// ============================================================================

const FEATURES = [
  { key: 'tools', icon: <ToolOutlined />, label: { 'en-US': 'Tool Detection', 'zh-CN': '工具检测' } },
  { key: 'packages', icon: <CodeOutlined />, label: { 'en-US': 'Package Management', 'zh-CN': '包管理' } },
  { key: 'services', icon: <HeartOutlined />, label: { 'en-US': 'Service Monitoring', 'zh-CN': '服务监控' } },
]

// ============================================================================
// AboutSection Component
// ============================================================================

interface AboutSectionProps {
  className?: string
}

export const AboutSection: React.FC<AboutSectionProps> = ({ className = '' }) => {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language as 'en-US' | 'zh-CN'

  const handleOpenRepository = () => {
    window.open(APP_INFO.repository, '_blank')
  }

  const handleReportIssue = () => {
    window.open(APP_INFO.issueTracker, '_blank')
  }

  return (
    <div className={className}>
      <Card>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <ToolOutlined className="text-3xl text-blue-500" />
          </div>
          <Title level={3} className="!mb-1">
            {APP_INFO.name}
          </Title>
          <Space>
            <Tag color="blue">v{APP_INFO.version}</Tag>
            <Tag color="green">{APP_INFO.license}</Tag>
          </Space>
        </div>

        {/* Description */}
        <Paragraph className="text-center text-gray-600 mb-6">
          {APP_INFO.description[currentLang] || APP_INFO.description['en-US']}
        </Paragraph>

        <Divider />

        {/* Features */}
        <div className="mb-6">
          <Title level={5} className="!mb-4">
            <InfoCircleOutlined className="mr-2" />
            {currentLang === 'zh-CN' ? '主要功能' : 'Key Features'}
          </Title>
          <Space wrap>
            {FEATURES.map(feature => (
              <Tag key={feature.key} icon={feature.icon} className="py-1 px-3">
                {feature.label[currentLang] || feature.label['en-US']}
              </Tag>
            ))}
          </Space>
        </div>

        <Divider />

        {/* Application Details */}
        <Descriptions
          column={1}
          size="small"
          className="mb-6"
          labelStyle={{ fontWeight: 500 }}
        >
          <Descriptions.Item label={t('settings.version')}>
            {APP_INFO.version}
          </Descriptions.Item>
          <Descriptions.Item label={t('settings.author')}>
            {APP_INFO.author}
          </Descriptions.Item>
          <Descriptions.Item label={t('settings.license')}>
            <Tag color="green">{APP_INFO.license}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('settings.repository')}>
            <Link href={APP_INFO.repository} target="_blank">
              {APP_INFO.repository}
            </Link>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* Action Buttons */}
        <Space className="w-full justify-center">
          <Button
            icon={<GithubOutlined />}
            onClick={handleOpenRepository}
          >
            {t('settings.repository')}
          </Button>
          <Button
            icon={<BugOutlined />}
            onClick={handleReportIssue}
          >
            {t('settings.reportIssue')}
          </Button>
        </Space>
      </Card>

      {/* Tech Stack */}
      <Card className="mt-4">
        <Title level={5} className="!mb-4">
          <CodeOutlined className="mr-2" />
          {currentLang === 'zh-CN' ? '技术栈' : 'Tech Stack'}
        </Title>
        <Space wrap>
          <Tag>Electron</Tag>
          <Tag>React 18</Tag>
          <Tag>TypeScript</Tag>
          <Tag>Ant Design</Tag>
          <Tag>Zustand</Tag>
          <Tag>i18next</Tag>
          <Tag>Tailwind CSS</Tag>
        </Space>
      </Card>

      {/* Copyright */}
      <div className="text-center mt-6 text-gray-400 text-sm">
        <Text type="secondary">
          © {new Date().getFullYear()} {APP_INFO.author}. All rights reserved.
        </Text>
      </div>
    </div>
  )
}

export default AboutSection
