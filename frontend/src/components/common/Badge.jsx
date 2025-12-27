import React from 'react';

const variants = {
  select: 'badge-select',
  insert: 'badge-insert',
  update: 'badge-update',
  delete: 'badge-delete',
  ddl: 'badge-ddl',
  tcl: 'badge-tcl',
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

export function Badge({
  children,
  variant = 'default',
  className = '',
  ...props
}) {
  return (
    <span
      className={`badge ${variants[variant] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export function QueryTypeBadge({ type }) {
  const normalizedType = type?.toLowerCase() || 'ddl';
  return (
    <Badge variant={normalizedType}>
      {type?.toUpperCase() || 'DDL'}
    </Badge>
  );
}

export default Badge;
