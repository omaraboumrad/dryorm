import React, { useState } from 'react';
import { ClipboardCopyIcon, CheckIcon } from '../icons';
import { copyToClipboard } from '../../lib/utils';

export function CopyButton({
  text,
  className = '',
  size = 20,
  showLabel = false,
  label = 'Copy',
  successLabel = 'Copied!',
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors ${className}`}
      title={copied ? successLabel : label}
    >
      {copied ? (
        <CheckIcon size={size} className="text-django-secondary" />
      ) : (
        <ClipboardCopyIcon size={size} />
      )}
      {showLabel && (
        <span className="text-sm">
          {copied ? successLabel : label}
        </span>
      )}
    </button>
  );
}

export default CopyButton;
