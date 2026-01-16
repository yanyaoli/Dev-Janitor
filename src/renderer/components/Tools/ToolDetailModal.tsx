/**
 * ToolDetailModal Component
 * 
 * Modal dialog displaying detailed information about a tool:
 * - Full tool information (name, version, path, status)
 * - Installation method
 * - Category
 * - Action buttons (update, uninstall, copy path)
 * 
 * Validates: Requirements 2.2, 2.3, 2.4, 2.5, 6.1, 6.2, 6.3, 6.4
 * Property 3: Complete Tool Information Display
 */

import React from 'react'
import { Modal, Descriptions, Tag, Button, Space, Typography, message, Divider } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  CopyOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { ToolInfo } from '@shared/types'

const { Text, Paragraph } = Typography

export interface ToolDetailModalProps {
  tool: ToolInfo | null
  open: boolean
  onClose: () => void
  onRefresh?: () => void
}

/**
 * Get icon for tool based on name
 */
const getToolIcon = (toolName: string): string => {
  const iconMap: Record<string, string> = {
    'node': '🟢',
    'nodejs': '🟢',
    'python': '🐍',
    'php': '🐘',
    'npm': '📦',
    'pip': '📦',
    'composer': '🎼',
    'git': '🔀',
    'docker': '🐳',
    'java': '☕',
    'go': '🔵',
    'rust': '🦀',
    'ruby': '💎',
  }
  
  const lowerName = toolName.toLowerCase()
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) {
      return icon
    }
  }
  return '🔧'
}

/**
 * Get category color for tag
 */
const getCategoryColor = (category: ToolInfo['category']): string => {
  const colorMap: Record<ToolInfo['category'], string> = {
    'runtime': 'blue',
    'package-manager': 'green',
    'tool': 'orange',
    'other': 'default',
  }
  return colorMap[category] || 'default'
}

const ToolDetailModal: React.FC<ToolDetailModalProps> = ({
  tool,
  open,
  onClose,
  onRefresh,
}) => {
  const { t } = useTranslation()

  if (!tool) {
    return null
  }

  const handleCopyPath = () => {
    if (tool.path) {
      navigator.clipboard.writeText(tool.path)
        .then(() => {
          message.success(t('notifications.copySuccess'))
        })
        .catch(() => {
          message.error(t('notifications.copyFailed'))
        })
    }
  }

  const handleUpdate = () => {
    message.info('Update functionality coming soon')
  }

  const handleUninstall = () => {
    message.info('Uninstall functionality coming soon')
  }

  const handleOpenLocation = () => {
    message.info('Open location functionality coming soon')
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getToolIcon(tool.name)}</span>
          <span>{tool.displayName || tool.name}</span>
          {tool.isInstalled ? (
            <Tag icon={<CheckCircleOutlined />} color="success">
              {t('tools.installed')}
            </Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="error">
              {t('tools.notInstalled')}
            </Tag>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>{t('common.close')}</Button>
          {onRefresh && (
            <Button icon={<SyncOutlined />} onClick={onRefresh}>
              {t('common.refresh')}
            </Button>
          )}
        </Space>
      }
      width={600}
    >
      {/* Tool Information - Validates: Property 3 */}
      <Descriptions
        bordered
        column={1}
        size="small"
        className="mb-4"
      >
        {/* Name - Validates: Requirement 2.2 */}
        <Descriptions.Item label={<Text strong>{t('tools.toolNames.nodejs').split('.')[0] ? 'Name' : 'Name'}</Text>}>
          <Text>{tool.displayName || tool.name}</Text>
        </Descriptions.Item>

        {/* Version - Validates: Requirement 2.3 */}
        <Descriptions.Item label={<Text strong>{t('tools.version')}</Text>}>
          <Text className="font-mono">
            {tool.version || t('common.unknown')}
          </Text>
        </Descriptions.Item>

        {/* Path - Validates: Requirement 2.4 */}
        <Descriptions.Item label={<Text strong>{t('tools.path')}</Text>}>
          <div className="flex items-center justify-between">
            <Paragraph
              className="font-mono text-sm m-0 flex-1"
              ellipsis={{ rows: 2, expandable: true }}
            >
              {tool.path || t('common.unknown')}
            </Paragraph>
            {tool.path && (
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={handleCopyPath}
              />
            )}
          </div>
        </Descriptions.Item>

        {/* Category */}
        <Descriptions.Item label={<Text strong>{t('tools.category')}</Text>}>
          <Tag color={getCategoryColor(tool.category)}>
            {t(`tools.categories.${tool.category === 'package-manager' ? 'packageManager' : tool.category}`)}
          </Tag>
        </Descriptions.Item>

        {/* Install Method */}
        {tool.installMethod && (
          <Descriptions.Item label={<Text strong>{t('tools.installMethod')}</Text>}>
            <Tag>{t(`tools.installMethods.${tool.installMethod}`)}</Tag>
          </Descriptions.Item>
        )}

        {/* Status - Validates: Requirement 2.5 */}
        <Descriptions.Item label={<Text strong>Status</Text>}>
          {tool.isInstalled ? (
            <Tag icon={<CheckCircleOutlined />} color="success">
              {t('tools.installed')}
            </Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="error">
              {t('tools.notInstalled')}
            </Tag>
          )}
        </Descriptions.Item>
      </Descriptions>

      {/* Actions - Validates: Requirements 6.1, 6.2, 6.3, 6.4 */}
      {tool.isInstalled && (
        <>
          <Divider orientation="left">{t('common.actions')}</Divider>
          <Space wrap>
            {tool.path && (
              <>
                <Button
                  icon={<FolderOpenOutlined />}
                  onClick={handleOpenLocation}
                >
                  {t('tools.openLocation')}
                </Button>
                <Button
                  icon={<CopyOutlined />}
                  onClick={handleCopyPath}
                >
                  {t('tools.copyPath')}
                </Button>
              </>
            )}
            {tool.installMethod && (
              <>
                <Button
                  icon={<SyncOutlined />}
                  onClick={handleUpdate}
                >
                  {t('tools.update')}
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleUninstall}
                >
                  {t('tools.uninstall')}
                </Button>
              </>
            )}
          </Space>
        </>
      )}
    </Modal>
  )
}

export default ToolDetailModal
