/**
 * PackageTable Component (Clean Version)
 * - Based on Old version structure
 * - Removed all log logic
 * - Merged Version display
 * - Separated Actions column
 */

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Table,
  Button,
  Typography,
  Tooltip,
  message,
  Tag,
  Space,
  Progress,
  Badge,
} from "antd";
import {
  LinkOutlined,
  CopyOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  LoadingOutlined,
  SyncOutlined,
  DownloadOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { PackageInfo } from "@shared/types";
import type { ColumnsType } from "antd/es/table";

const { Text, Paragraph } = Typography;

export interface PackageTableProps {
  packages: PackageInfo[];
  loading: boolean;
  onUninstall: (packageName: string) => void;
  onRefresh: () => void;
  manager: "npm" | "pip" | "composer";
}

interface VersionInfo {
  latest: string;
  checking: boolean;
  checked: boolean;
  updating?: boolean;
}

const getPackageUrl = (
  packageName: string,
  manager: "npm" | "pip" | "composer"
): string => {
  switch (manager) {
    case "npm":
      return `https://www.npmjs.com/package/${packageName}`;
    case "pip":
      return `https://pypi.org/project/${packageName}`;
    case "composer":
      return `https://packagist.org/packages/${packageName}`;
    default:
      return "";
  }
};

const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1
    .replace(/^[^\d]*/, "")
    .split(".")
    .map((n) => parseInt(n) || 0);
  const parts2 = v2
    .replace(/^[^\d]*/, "")
    .split(".")
    .map((n) => parseInt(n) || 0);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  return 0;
};

const PackageTable: React.FC<PackageTableProps> = ({
  packages,
  loading,
  onRefresh,
  manager,
}) => {
  const { t } = useTranslation();
  const [versionCache, setVersionCache] = useState<Record<string, VersionInfo>>(
    {}
  );
  const [checkingAll, setCheckingAll] = useState(false);
  const [checkProgress, setCheckProgress] = useState<{
    total: number;
    completed: number;
    cancelled: boolean;
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset cache only when manager changes effectively
  useEffect(() => {
    // Keep cache unless packages are completely swapped out (optional optimization)
  }, [packages]);

  const memoizedVersionComparison = useMemo(() => {
    return packages.reduce(
      (acc, pkg) => {
        const cached = versionCache[pkg.name];
        if (cached?.checked && cached.latest && cached.latest !== "error") {
          acc[pkg.name] = compareVersions(pkg.version, cached.latest);
        }
        return acc;
      },
      {} as Record<string, number>
    );
  }, [packages, versionCache]);

  const handleCopyLocation = useCallback(
    (location: string) => {
      navigator.clipboard
        .writeText(location)
        .then(() => message.success(t("notifications.copySuccess")))
        .catch(() => message.error(t("notifications.copyFailed")));
    },
    [t]
  );

  const handleCopyUpdateCommand = useCallback(
    (packageName: string) => {
      let command = "";
      if (manager === "npm") command = `npm update -g ${packageName}`;
      else if (manager === "pip")
        command = `pip install --upgrade ${packageName}`;
      else if (manager === "composer")
        command = `composer global update ${packageName}`;

      navigator.clipboard
        .writeText(command)
        .then(() => message.success(t("notifications.copySuccess")))
        .catch(() => message.error(t("notifications.copyFailed")));
    },
    [manager, t]
  );

  const checkVersion = useCallback(
    async (packageName: string) => {
      if (manager !== "npm" && manager !== "pip") return;
      setVersionCache((prev) => ({
        ...prev,
        [packageName]: { ...prev[packageName], checking: true, checked: false },
      }));
      try {
        const result =
          manager === "npm"
            ? await window.electronAPI.packages.checkNpmLatestVersion(
                packageName
              )
            : await window.electronAPI.packages.checkPipLatestVersion(
                packageName
              );
        setVersionCache((prev) => ({
          ...prev,
          [packageName]: {
            latest: result?.latest || t("common.unknown"),
            checking: false,
            checked: true,
          },
        }));
      } catch {
        setVersionCache((prev) => ({
          ...prev,
          [packageName]: { latest: "error", checking: false, checked: true },
        }));
      }
    },
    [manager, t]
  );

  const handleUpdatePackage = useCallback(
    async (packageName: string) => {
      if (manager !== "npm" && manager !== "pip") return;

      setVersionCache((prev) => ({
        ...prev,
        [packageName]: { ...prev[packageName], updating: true },
      }));

      try {
        // Direct update call without log listeners
        const result = await window.electronAPI.packages.update(
          packageName,
          manager
        );

        if (result.success) {
          message.success(t("packages.updateSuccess"));
          await checkVersion(packageName); // Re-check to update UI
          onRefresh(); // Refresh list data
        } else {
          message.error(result.error || t("packages.updateFailed"));
        }
      } catch (error) {
        message.error(t("packages.updateFailed"));
      } finally {
        setVersionCache((prev) => ({
          ...prev,
          [packageName]: { ...prev[packageName], updating: false },
        }));
      }
    },
    [manager, t, checkVersion, onRefresh]
  );

  const checkAllVersions = useCallback(async () => {
    if (manager !== "npm" && manager !== "pip") return;

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setCheckingAll(true);
    setCheckProgress({
      total: packages.length,
      completed: 0,
      cancelled: false,
    });

    const CONCURRENCY_LIMIT = 5; // 同时进行的请求数量
    const queue = [...packages];
    let completedCount = 0;

    // 定义单个执行单元
    const worker = async () => {
      while (queue.length > 0 && !signal.aborted) {
        const pkg = queue.shift();
        if (!pkg) break;

        try {
          await checkVersion(pkg.name);
        } catch (error) {
          // 单个失败不影响整体
        } finally {
          completedCount++;
          setCheckProgress((prev) =>
            prev ? { ...prev, completed: completedCount } : null
          );
        }

        // 可选：在高并发下增加极小的随机延迟，模拟人类行为
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    };

    // 启动多个并行 worker
    const workers = Array(Math.min(CONCURRENCY_LIMIT, packages.length))
      .fill(null)
      .map(() => worker());

    try {
      await Promise.all(workers);
    } catch (err) {
      console.error("Parallel check failed", err);
    } finally {
      setCheckingAll(false);
      if (!signal.aborted) {
        message.success(t("packages.versionCheckComplete"));
      } else {
        setCheckProgress((prev) =>
          prev ? { ...prev, cancelled: true } : null
        );
      }

      // 延迟清除进度条，让用户看到 100%
      setTimeout(() => setCheckProgress(null), 1000);
      abortControllerRef.current = null;
    }
  }, [packages, checkVersion, t, manager]);

  const columns: ColumnsType<PackageInfo> = [
    {
      title: t("packages.name"),
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name) => (
        <Space>
          <Text strong className="font-mono">
            {name}
          </Text>
          <Button
            type="text"
            size="small"
            icon={<LinkOutlined />}
            onClick={() => window.open(getPackageUrl(name, manager), "_blank")}
          />
        </Space>
      ),
    },
    {
      title: t("packages.version"),
      key: "version",
      width: 200,
      render: (_, record) => {
        const info = versionCache[record.name];
        const comparison = memoizedVersionComparison[record.name];
        const hasUpdate = comparison !== undefined && comparison < 0;
        return (
          <Space size="small">
            <Tag color="blue" className="font-mono m-0">
              {record.version}
            </Tag>
            {hasUpdate && info && (
              <>
                <ArrowRightOutlined
                  style={{ fontSize: 10, color: "#bfbfbf" }}
                />
                <Tooltip title={t("packages.clickToCopyCommand")}>
                  <Tag
                    color="orange"
                    className="font-mono m-0 cursor-pointer"
                    icon={<ArrowUpOutlined />}
                    onClick={() => handleCopyUpdateCommand(record.name)}
                  >
                    {info.latest}
                  </Tag>
                </Tooltip>
              </>
            )}
          </Space>
        );
      },
    },
    {
      title: t("packages.location"),
      dataIndex: "location",
      key: "location",
      ellipsis: true,
      render: (location) => (
        <div className="flex items-center gap-2">
          <Tooltip title={location}>
            <Paragraph
              className="font-mono text-xs m-0 flex-1"
              ellipsis={{ rows: 1 }}
            >
              {location}
            </Paragraph>
          </Tooltip>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyLocation(location)}
          />
        </div>
      ),
    },
    {
      title: t("common.actions"),
      key: "actions",
      width: 140,
      align: "right",
      render: (_, record) => {
        const info = versionCache[record.name];
        if (manager !== "npm" && manager !== "pip") return null;

        if (!info || !info.checked) {
          return (
            <Button
              type="link"
              size="small"
              icon={info?.checking ? <LoadingOutlined /> : <SyncOutlined />}
              onClick={() => checkVersion(record.name)}
              disabled={info?.checking}
            >
              {info?.checking ? "" : t("packages.checkUpdate")}
            </Button>
          );
        }

        const comparison = memoizedVersionComparison[record.name] ?? 0;
        if (comparison >= 0) {
          return (
            <Badge
              status="success"
              text={
                <Text type="success" style={{ fontSize: 12 }}>
                  {t("packages.latest")}
                </Text>
              }
            />
          );
        }

        return (
          <Button
            type="primary"
            size="small"
            ghost
            icon={info.updating ? <LoadingOutlined /> : <DownloadOutlined />}
            onClick={() => handleUpdatePackage(record.name)}
            disabled={info.updating}
          >
            {info.updating ? t("packages.updating") : t("packages.update")}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="package-table">
      {(manager === "npm" || manager === "pip") && (
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              icon={checkingAll ? <LoadingOutlined /> : <SyncOutlined />}
              onClick={checkAllVersions}
              disabled={checkingAll || packages.length === 0}
            >
              {checkingAll
                ? t("packages.checking")
                : t("packages.checkAllUpdates")}
            </Button>
            {checkingAll && (
              <Button
                icon={<StopOutlined />}
                onClick={() => abortControllerRef.current?.abort()}
                danger
              >
                {t("common.cancel")}
              </Button>
            )}
          </Space>
          {checkProgress && (
            <div style={{ marginTop: 8 }}>
              <Progress
                percent={Math.round(
                  (checkProgress.completed / checkProgress.total) * 100
                )}
                size="small"
                status={checkProgress.cancelled ? "exception" : "active"}
                format={() =>
                  `${checkProgress.completed}/${checkProgress.total}`
                }
              />
            </div>
          )}
        </div>
      )}
      <Table
        columns={columns}
        dataSource={packages}
        loading={loading}
        rowKey="name"
        size="middle"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `${total} ${t("packages.title").toLowerCase()}`,
        }}
        locale={{
          emptyText: loading ? t("common.loading") : t("packages.noPackages"),
        }}
      />
    </div>
  );
};

export default PackageTable;
