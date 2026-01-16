/**
 * PackageTable Component
 * 
 * Table component for displaying packages from a package manager:
 * - Package name and version
 * - Location
 * - Uninstall action
 * 
 * Validates: Requirements 3.2, 4.2, 6.4
 * Property 5: Package Information Completeness
 */

import React from 'react'
import { Table, Button, Popconfirm, Typography, Tooltip, message, Tag } from 'antd'
import {
  DeleteOutlined,
  LinkOutlined,
  CopyOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { PackageInfo } from '@shared/types'
import type { ColumnsType } from 'antd/es/table'

const { Text, Paragraph } = Typography

export interface PackageTableProps {
  packages: PackageInfo[]
  loading: boolean
  onUninstall: (packageName: string) => void
  onRefresh: () => void
  manager: 'npm' | 'pip' | 'composer'
}

/**
 * Get external link URL for package based on manager
 */
const getPackageUrl = (packageName: string, manager: 'npm' | 'pip' | 'composer'): string => {
  switch (manager) {
    case 'npm':
      return `https://www.npmjs.com/package/${packageName}`
    case 'pip':
      return `https://pypi.org/project/${packageName}`
    case 'composer':
      return `https://packagist.org/packages/${packageName}`
    default:
      return ''
  }
}

/**
 * Get link text for package manager
 */
const getLinkText = (manager: 'npm' | 'pip' | 'composer', t: (key: string) => string): string => {
  switch (manager) {
    case 'npm':
      return t('packages.viewOnNpm')
    case 'pip':
      return t('packages.viewOnPypi')
    case 'composer':
      return t('packages.viewOnPackagist')
    default:
      return ''
  }
}

const PackageTable: React.FC<PackageTableProps> = ({
  packages,
  loading,
  onUninstall,
  manager,
}) => {
  const { t } = useTranslation()

  const handleCopyLocation = (location: string) => {
    navigator.clipboard.writeText(location)
      .then(() => {
        message.success(t('notifications.copySuccess'))
      })
      .catch(() => {
        message.error(t('notifications.copyFailed'))
      })
  }

  const handleOpenExternal = (packageName: string) => {
    const url = getPackageUrl(packageName, manager)
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  // Table columns - Validates: Property 5 (Package Information Completeness)
  const columns: ColumnsType<PackageInfo> = [
    {
      title: t('packages.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => (
        <div className="flex items-center gap-2">
          <Text strong className="font-mono">{name}</Text>
          <Tooltip title={getLinkText(manager, t)}>
            <Button
              type="text"
              size="small"
              icon={<LinkOutlined />}
              onClick={() => handleOpenExternal(name)}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: t('packages.version'),
      dataIndex: 'version',
      key: 'version',
      width: 120,
      sorter: (a, b) => a.version.localeCompare(b.version),
      render: (version: string) => (
        <Tag color="blue" className="font-mono">{version}</Tag>
      ),
    },
    {
      title: t('packages.location'),
      dataIndex: 'location',
      key: 'location',
      ellipsis: true,
      render: (location: string) => (
        <div className="flex items-center gap-2">
          <Tooltip title={location}>
            <Paragraph
              className="font-mono text-xs m-0 flex-1"
              ellipsis={{ rows: 1 }}
            >
              {location}
            </Paragraph>
          </Tooltip>
          <Tooltip title={t('common.copy')}>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyLocation(location)}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Popconfirm
          title={t('packages.uninstallTitle')}
          description={t('packages.uninstallConfirm')}
          onConfirm={() => onUninstall(record.name)}
          okText={t('common.yes')}
          cancelText={t('common.no')}
          okButtonProps={{ danger: true }}
        >
          <Tooltip title={t('tools.uninstall')}>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={packages}
      loading={loading}
      rowKey="name"
      size="middle"
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        showTotal: (total) => `${total} ${t('packages.title').toLowerCase()}`,
      }}
      locale={{
        emptyText: t('packages.noPackages'),
      }}
    />
  )
}

export default PackageTable
