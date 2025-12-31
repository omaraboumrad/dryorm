import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon, MinusIcon, PlusIcon } from '../icons';

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  className = '',
  headerClassName = '',
  contentClassName = '',
  iconClassName = 'text-gray-500 dark:text-gray-400',
  icon = 'chevron', // 'chevron' or 'plusminus'
  rightContent,
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const contentRef = useRef(null);
  const [height, setHeight] = useState(isOpen ? 'auto' : '0px');

  const setIsOpen = (value) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };

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
        className={`group w-full flex items-center justify-between text-left ${headerClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <IconComponent size={16} className={`flex-shrink-0 ${iconClassName}`} />
          <div className="min-w-0 flex-1">{title}</div>
        </div>
        {rightContent && (
          <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
