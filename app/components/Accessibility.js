'use client';
import { createContext, useContext, useRef, useEffect, useCallback } from 'react';

/**
 * Accessibility utilities and components
 */

// ============================================
// LIVE REGION FOR ANNOUNCEMENTS
// ============================================

/**
 * Context for screen reader announcements
 */
const AnnouncerContext = createContext(null);

/**
 * Provider for screen reader announcements
 */
export function AnnouncerProvider({ children }) {
  const announcerRef = useRef(null);
  
  const announce = useCallback((message, priority = 'polite') => {
    if (!announcerRef.current) return;
    
    // Clear previous announcement
    announcerRef.current.textContent = '';
    
    // Set new announcement after a brief delay (helps screen readers detect change)
    setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = message;
      }
    }, 100);
  }, []);
  
  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      {/* Polite announcements (non-urgent) */}
      <div
        ref={announcerRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      {/* Assertive announcements (urgent) */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        id="assertive-announcer"
      />
    </AnnouncerContext.Provider>
  );
}

/**
 * Hook for screen reader announcements
 */
export function useAnnounce() {
  const context = useContext(AnnouncerContext);
  if (!context) {
    // Return no-op if outside provider
    return { announce: () => {} };
  }
  return context;
}

// ============================================
// FOCUS MANAGEMENT
// ============================================

/**
 * Hook for trapping focus within a modal/dialog
 */
export function useFocusTrap(isActive = true) {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Focus first element on mount
    firstElement?.focus();
    
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);
  
  return containerRef;
}

/**
 * Hook for restoring focus when modal closes
 */
export function useFocusRestore() {
  const previousFocusRef = useRef(null);
  
  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    
    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);
}

// ============================================
// SKIP LINK
// ============================================

/**
 * Skip to main content link for keyboard users
 */
export function SkipLink({ href = '#main-content', children = 'Skip to main content' }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
    >
      {children}
    </a>
  );
}

// ============================================
// VISUALLY HIDDEN (SR-ONLY)
// ============================================

/**
 * Visually hidden content for screen readers only
 */
export function VisuallyHidden({ children, as: Component = 'span' }) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
}

// ============================================
// ACCESSIBLE BUTTON
// ============================================

/**
 * Button with proper accessibility attributes
 */
export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaHasPopup,
  ariaPressed,
  className = '',
  ...props
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      aria-pressed={ariaPressed}
      aria-busy={loading}
      aria-disabled={disabled}
      className={className}
      {...props}
    >
      {loading ? (
        <>
          <span className="sr-only">Loading...</span>
          <span aria-hidden="true">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

// ============================================
// ACCESSIBLE MODAL
// ============================================

/**
 * Modal with proper accessibility
 */
export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = '',
}) {
  const focusTrapRef = useFocusTrap(isOpen);
  useFocusRestore();
  
  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal content */}
      <div
        ref={focusTrapRef}
        className={`relative bg-card rounded-2xl shadow-xl max-h-[90vh] overflow-auto ${className}`}
      >
        <h2 id="modal-title" className="sr-only">
          {title}
        </h2>
        
        {description && (
          <p id="modal-description" className="sr-only">
            {description}
          </p>
        )}
        
        {children}
      </div>
    </div>
  );
}

// ============================================
// ACCESSIBLE TABS
// ============================================

/**
 * Tab panel context
 */
const TabContext = createContext(null);

/**
 * Tab list container
 */
export function TabList({ children, ariaLabel, className = '' }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * Individual tab button
 */
export function Tab({ 
  id, 
  children, 
  isSelected, 
  onClick, 
  controls,
  className = '' 
}) {
  return (
    <button
      role="tab"
      id={id}
      aria-selected={isSelected}
      aria-controls={controls}
      tabIndex={isSelected ? 0 : -1}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  );
}

/**
 * Tab panel content
 */
export function TabPanel({ 
  id, 
  children, 
  labelledBy, 
  isSelected,
  className = '' 
}) {
  return (
    <div
      role="tabpanel"
      id={id}
      aria-labelledby={labelledBy}
      hidden={!isSelected}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  );
}

// ============================================
// LOADING INDICATOR
// ============================================

/**
 * Accessible loading indicator
 */
export function LoadingSpinner({ size = 'md', label = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };
  
  return (
    <div role="status" aria-label={label}>
      <div
        className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

// ============================================
// FORM HELPERS
// ============================================

/**
 * Form field wrapper with label and error
 */
export function FormField({
  id,
  label,
  error,
  required = false,
  children,
  className = '',
}) {
  const errorId = error ? `${id}-error` : undefined;
  
  return (
    <div className={className}>
      <label 
        htmlFor={id}
        className="block text-sm font-medium text-foreground mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        {required && <span className="sr-only">(required)</span>}
      </label>
      
      {/* Clone children to add aria attributes */}
      {children}
      
      {error && (
        <p 
          id={errorId}
          role="alert"
          className="mt-1 text-sm text-red-500"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================
// CSS FOR SR-ONLY
// ============================================

// Add this to globals.css:
// .sr-only {
//   position: absolute;
//   width: 1px;
//   height: 1px;
//   padding: 0;
//   margin: -1px;
//   overflow: hidden;
//   clip: rect(0, 0, 0, 0);
//   white-space: nowrap;
//   border: 0;
// }
