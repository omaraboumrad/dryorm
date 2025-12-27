import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon, MinusIcon, PlusIcon } from '../icons';

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  className = '',
  headerClassName = '',
  contentClassName = '',
  icon = 'chevron', // 'chevron' or 'plusminus'
  rightContent,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef(null);
  const [height, setHeight] = useState(defaultOpen ? 'auto' : '0px');

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? `${contentRef.current.scrollHeight}px` : '0px');
    }
  }, [isOpen]);

  const IconComponent = icon === 'plusminus'
    ? (isOpen ? MinusIcon : PlusIcon)
    : (isOpen ? ChevronDownIcon : ChevronRightIcon);

  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-left ${headerClassName}`}
      >
        <div className="flex items-center gap-2">
          <IconComponent size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span>{title}</span>
        </div>
        {rightContent && (
          <div onClick={(e) => e.stopPropagation()}>
            {rightContent}
          </div>
        )}
      </button>
      <div
        ref={contentRef}
        style={{ maxHeight: height }}
        className={`overflow-hidden transition-all duration-200 ease-out ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

export default Collapsible;
