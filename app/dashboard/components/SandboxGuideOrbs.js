'use client';
import { useState, useEffect, useCallback } from 'react';

/**
 * Panel-specific guide configurations
 * Each panel has its own set of orbs pointing to specific UI elements
 */
const PANEL_GUIDES = {
  hallpass: [
    { selector: '[data-guide="student-search"]', hint: 'Search for a student by name or ID. Start typing and pick from the list.', label: '1' },
    { selector: '[data-guide="destination-buttons"]', hint: 'Pick where the student is going. These destinations are customizable in Admin.', label: '2' },
    { selector: '[data-guide="issue-pass"]', hint: 'Click this to send the student out. The timer starts automatically.', label: '3' },
    { selector: '[data-guide="active-passes"]', hint: 'All students currently out appear here. Click "Return" when they come back.', label: '4' },
  ],
  infractions: [
    { selector: '[data-guide="student-select"]', hint: 'First, pick which student had the behavior issue.', label: '1' },
    { selector: '[data-guide="infraction-buttons"]', hint: 'Choose the type of infraction. This adds to their MTSS score.', label: '2' },
    { selector: '[data-guide="mtss-tier"]', hint: 'The tier updates automatically based on their score. Higher tiers need more intervention.', label: '3' },
    { selector: '[data-guide="parent-contact"]', hint: 'Log parent contacts here. Required for Tier 2+ students.', label: '4' },
  ],
  incentives: [
    { selector: '[data-guide="student-select"]', hint: 'Pick the student who earned recognition.', label: '1' },
    { selector: '[data-guide="incentive-buttons"]', hint: 'Choose why they earned points. 40% goes to them, 60% to their house!', label: '2' },
    { selector: '[data-guide="house-standings"]', hint: 'Watch the house scores update in real-time. The mascots celebrate wins!', label: '3' },
  ],
  safety: [
    { selector: '[data-guide="lockdown-toggle"]', hint: 'EMERGENCY ONLY. This freezes all passes and alerts every teacher instantly.', label: '1' },
    { selector: '[data-guide="conflict-groups"]', hint: 'Define students who should never be in the hall at the same time.', label: '2' },
    { selector: '[data-guide="add-conflict"]', hint: 'Create a new conflict group. Add 2+ students who have issues together.', label: '3' },
  ],
  communication: [
    { selector: '[data-guide="broadcast-input"]', hint: 'Type your message here. All teachers in your school will see it.', label: '1' },
    { selector: '[data-guide="priority-select"]', hint: 'Set priority: Normal, Important (yellow), or Urgent (red alert).', label: '2' },
    { selector: '[data-guide="send-broadcast"]', hint: 'Send it! StrideBot will announce it to everyone.', label: '3' },
    { selector: '[data-guide="broadcast-list"]', hint: 'Previous broadcasts. Pin important ones to keep them at the top.', label: '4' },
  ],
  analytics: [
    { selector: '[data-guide="charts"]', hint: 'Visual breakdown of passes, infractions, and incentives over time.', label: '1' },
    { selector: '[data-guide="destination-stats"]', hint: 'See which destinations are most used. Identify bottlenecks.', label: '2' },
    { selector: '[data-guide="mtss-report"]', hint: 'Print MTSS reports for admin meetings. Hidden on screen, visible when printed.', label: '3' },
  ],
  records: [
    { selector: '[data-guide="search-records"]', hint: 'Search any student to see their complete history.', label: '1' },
    { selector: '[data-guide="filter-type"]', hint: 'Filter by type: passes, infractions, incentives, or tardies.', label: '2' },
    { selector: '[data-guide="log-list"]', hint: 'Complete audit trail. Every action is logged with timestamp and who did it.', label: '3' },
  ],
  admin: [
    { selector: '[data-guide="upload-roster"]', hint: 'Upload student roster via Excel/CSV. It will merge with existing data.', label: '1' },
    { selector: '[data-guide="labels-config"]', hint: 'Customize button labels for infractions, incentives, and destinations.', label: '2' },
    { selector: '[data-guide="economy-config"]', hint: 'Adjust the point split between students and houses (default 40/60).', label: '3' },
    { selector: '[data-guide="houses-config"]', hint: 'Set up your school\'s houses: names, colors, and mascots.', label: '4' },
  ],
};

export default function SandboxGuideOrbs({ sandboxMode, botRef, activeTab }) {
  const [positions, setPositions] = useState([]);
  const [dismissed, setDismissed] = useState({});
  const [isVisible, setIsVisible] = useState(true);

  // Get current panel's guides
  const currentGuides = PANEL_GUIDES[activeTab] || [];

  // Calculate positions of guide elements
  const updatePositions = useCallback(() => {
    if (!sandboxMode || !isVisible) return;

    const newPositions = [];
    
    currentGuides.forEach((guide, index) => {
      const el = document.querySelector(guide.selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Position orb to the right of the element
        newPositions.push({
          id: `${activeTab}-${index}`,
          x: rect.right + 8,
          y: rect.top + rect.height / 2 - 12,
          hint: guide.hint,
          label: guide.label,
          selector: guide.selector,
        });
      }
    });
    
    setPositions(newPositions);
  }, [sandboxMode, activeTab, currentGuides, isVisible]);

  // Update positions on mount, tab change, resize, scroll
  useEffect(() => {
    if (!sandboxMode) return;

    // Initial delay to let panel render
    const timeout = setTimeout(updatePositions, 300);
    
    // Update on resize and scroll
    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions, true);
    
    // Also observe DOM changes (for dynamic content)
    const observer = new MutationObserver(() => {
      setTimeout(updatePositions, 100);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions, true);
      observer.disconnect();
    };
  }, [sandboxMode, activeTab, updatePositions]);

  // Reset dismissed when changing tabs
  useEffect(() => {
    // Keep dismissed state per-tab
  }, [activeTab]);

  const handleOrbClick = (orb) => {
    // Tell StrideBot to explain this feature
    botRef?.current?.push?.('guide', { 
      message: orb.hint 
    });
    
    // Mark as dismissed for this tab
    setDismissed(prev => ({
      ...prev,
      [orb.id]: true
    }));

    // Highlight the element briefly
    const el = document.querySelector(orb.selector);
    if (el) {
      el.classList.add('ring-2', 'ring-amber-400', 'ring-offset-2');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-amber-400', 'ring-offset-2');
      }, 2000);
    }
  };

  const resetGuides = () => {
    setDismissed({});
    setIsVisible(true);
    setTimeout(updatePositions, 100);
  };

  const hideGuides = () => {
    setIsVisible(false);
  };

  if (!sandboxMode) return null;

  const visibleOrbs = positions.filter(orb => !dismissed[orb.id]);

  return (
    <>
      {/* Guide orbs */}
      {isVisible && visibleOrbs.map(orb => (
        <button
          key={orb.id}
          onClick={() => handleOrbClick(orb)}
          className="fixed z-[100] w-6 h-6 bg-amber-400 hover:bg-amber-300 text-black rounded-full flex items-center justify-center font-bold text-xs shadow-lg shadow-amber-400/40 animate-pulse hover:animate-none hover:scale-125 transition-transform cursor-pointer"
          style={{ 
            left: orb.x, 
            top: orb.y,
            // Ensure orbs stay on screen
            transform: orb.x > window.innerWidth - 40 ? 'translateX(-40px)' : undefined
          }}
          title="Click for explanation"
          aria-label={`Guide: ${orb.hint.substring(0, 30)}...`}
        >
          {orb.label}
        </button>
      ))}

      {/* Sandbox mode banner */}
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2">
        <div className="bg-amber-500 text-black px-4 py-2 rounded-xl shadow-lg flex items-center gap-3">
          <span className="text-lg">🎮</span>
          <div>
            <div className="font-black text-sm">SANDBOX MODE</div>
            <div className="text-[10px] opacity-80">Click numbered orbs for guidance</div>
          </div>
        </div>
        
        {isVisible && visibleOrbs.length > 0 && (
          <button
            onClick={hideGuides}
            className="px-3 py-2 bg-black/20 hover:bg-black/30 backdrop-blur rounded-xl text-xs font-bold text-white transition-colors"
          >
            Hide
          </button>
        )}
        
        {(!isVisible || visibleOrbs.length === 0) && (
          <button
            onClick={resetGuides}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 rounded-xl text-xs font-bold text-black transition-colors"
          >
            Show Guides
          </button>
        )}
      </div>
    </>
  );
}
