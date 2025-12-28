'use client';
import { useState } from 'react';
import { Shield, Check, AlertTriangle, FileText } from 'lucide-react';

const AUP_VERSION = '2.0.0';
const AUP_DATE = 'December 2024';

export default function AUPGate({ user, onAccept, onDecline }) {
  const [agreed, setAgreed] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    if (!agreed) return;
    onAccept?.(AUP_VERSION);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center">
              <Shield className="text-primary" size={28} />
            </div>
            <div>
              <h1 className="text-xl font-black">Acceptable Use Policy</h1>
              <p className="text-sm text-muted-foreground">
                Version {AUP_VERSION} • {AUP_DATE}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-6 text-sm"
          onScroll={handleScroll}
        >
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold text-amber-400">Important Notice</p>
              <p className="text-muted-foreground text-sm mt-1">
                Please read this policy carefully before using STRIDE. You must accept these terms to continue.
              </p>
            </div>
          </div>

          <section>
            <h2 className="font-bold text-lg mb-2">1. Purpose</h2>
            <p className="text-muted-foreground">
              STRIDE (Student Tracking, Recording, Intervention, and Data Exchange) is a school management 
              system designed to facilitate hall pass management, behavioral tracking, and student support 
              services. This policy outlines the acceptable use of the system.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">2. Authorized Users</h2>
            <p className="text-muted-foreground">
              Access to STRIDE is restricted to authorized school personnel with valid @dadeschools.net 
              credentials. Users must not share their login credentials with others or attempt to access 
              accounts belonging to other users.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">3. Student Data Privacy (FERPA Compliance)</h2>
            <p className="text-muted-foreground">
              All student information accessed through STRIDE is protected under the Family Educational 
              Rights and Privacy Act (FERPA). Users agree to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground ml-4">
              <li>Access only data necessary for legitimate educational purposes</li>
              <li>Never share student information with unauthorized parties</li>
              <li>Report any suspected data breaches immediately</li>
              <li>Use the system only on secure, authorized devices</li>
              <li>Log out when leaving a device unattended</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">4. Appropriate Use</h2>
            <p className="text-muted-foreground">Users shall:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground ml-4">
              <li>Use STRIDE exclusively for its intended educational purposes</li>
              <li>Enter accurate and truthful information</li>
              <li>Respect the dignity of students when logging behavioral data</li>
              <li>Follow school policies regarding documentation and reporting</li>
              <li>Use the lockdown feature responsibly and only in genuine emergencies</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">5. Prohibited Activities</h2>
            <p className="text-muted-foreground">Users shall NOT:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground ml-4">
              <li>Falsify student records or behavioral logs</li>
              <li>Use the system to harass, discriminate, or retaliate</li>
              <li>Attempt to access administrative functions without authorization</li>
              <li>Share screenshots or exports of student data inappropriately</li>
              <li>Use STRIDE for personal or commercial purposes</li>
              <li>Attempt to circumvent security measures</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">6. Data Retention</h2>
            <p className="text-muted-foreground">
              Student behavioral data is retained in accordance with district policy. Users understand 
              that all actions within the system are logged and may be audited. Data exports should be 
              handled according to school records management procedures.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">7. Consequences of Misuse</h2>
            <p className="text-muted-foreground">
              Violations of this policy may result in:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground ml-4">
              <li>Revocation of STRIDE access</li>
              <li>Disciplinary action per district employment policies</li>
              <li>Legal action for FERPA violations</li>
              <li>Criminal prosecution for data misuse</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">8. Updates to Policy</h2>
            <p className="text-muted-foreground">
              This policy may be updated periodically. Users will be notified of significant changes 
              and may be required to re-accept the policy. Continued use constitutes acceptance of 
              any modifications.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">9. Support</h2>
            <p className="text-muted-foreground">
              For questions about this policy or STRIDE usage, contact your school administrator or 
              the district technology department.
            </p>
          </section>

          <div className="h-4" /> {/* Spacer to ensure scroll detection works */}
        </div>

        {/* Footer with checkbox and buttons */}
        <div className="p-6 border-t border-border space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={!scrolledToBottom}
              className="mt-1 rounded border-border"
            />
            <span className={`text-sm ${!scrolledToBottom ? 'text-muted-foreground' : ''}`}>
              I have read and understand the Acceptable Use Policy. I agree to comply with all terms 
              and conditions while using STRIDE.
              {!scrolledToBottom && (
                <span className="block text-xs text-amber-400 mt-1">
                  Please scroll to read the entire policy
                </span>
              )}
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={onDecline}
              className="flex-1 py-3 bg-accent border border-border rounded-xl font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Decline & Sign Out
            </button>
            <button
              onClick={handleAccept}
              disabled={!agreed}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Check size={18} />
              Accept & Continue
            </button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Accepting as: <span className="font-medium">{user?.email}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
