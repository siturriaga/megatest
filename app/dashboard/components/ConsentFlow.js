'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Camera, FileText, Users, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

const CONSENT_VERSION = '1.0.0';

const POLICY_SECTIONS = [
  {
    id: 'aup',
    icon: FileText,
    title: 'Acceptable Use Policy',
    required: true,
    content: `By using STRIDE, you agree to:
    
• Use this application solely for legitimate educational purposes
• Access only student data for students in your assigned classes/school
• Never share login credentials with others
• Report any security concerns immediately to administration
• Follow all district technology policies and FERPA regulations
• Use the system responsibly during school hours for school purposes`
  },
  {
    id: 'camera',
    icon: Camera,
    title: 'Camera Permission',
    required: true,
    content: `STRIDE uses your device camera to:

• Scan student QR codes for quick hall pass check-in/out
• Camera access is ONLY used when you actively tap the scan button
• No images or video are stored or transmitted
• Camera feed is processed locally on your device only
• You can revoke camera permission at any time in your browser settings`
  },
  {
    id: 'ferpa',
    icon: Users,
    title: 'Student Data Privacy (FERPA)',
    required: true,
    content: `You acknowledge and agree that:

• All student information displayed is protected under FERPA
• You will NOT share, screenshot, or distribute student data
• Student information must not be discussed in public areas
• You will only access records for students you have legitimate educational interest in
• Violations may result in disciplinary action and legal consequences
• All access to student records is logged and auditable`
  },
  {
    id: 'liability',
    icon: AlertTriangle,
    title: 'Liability & Disclaimer',
    required: true,
    content: `Important disclaimers:

• STRIDE is a hall pass management tool, not a safety guarantee
• Teachers remain responsible for student supervision
• The system supplements but does not replace professional judgment
• Technical issues may occur; have backup procedures ready
• The school district is not liable for issues arising from system downtime
• Data is provided "as-is" and should be verified when critical`
  },
  {
    id: 'data',
    icon: Shield,
    title: 'Data Handling Agreement',
    required: true,
    content: `You understand and agree:

• Student names, IDs, and pass history are stored securely in the cloud
• Data is encrypted in transit and at rest
• Only authorized school personnel can access your school's data
• Logs are retained per district data retention policies
• You will not export or copy student data except through official channels
• Any suspected data breach must be reported immediately`
  }
];

export default function ConsentFlow({ 
  user, 
  onComplete, 
  onSandbox,
  existingSchoolId = null 
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [consents, setConsents] = useState({});
  const [schoolCode, setSchoolCode] = useState('');
  const [showSchoolInput, setShowSchoolInput] = useState(false);
  const [error, setError] = useState('');

  const allConsentsGiven = POLICY_SECTIONS.every(s => consents[s.id]);

  const handleConsent = (sectionId) => {
    setConsents(prev => ({ ...prev, [sectionId]: true }));
  };

  const handleNext = () => {
    if (currentStep < POLICY_SECTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowSchoolInput(true);
    }
  };

  const handleSchoolSubmit = () => {
    const code = schoolCode.trim().toUpperCase();
    
    if (!code) {
      setError('Please enter a school code');
      return;
    }

    if (code === 'SANDBOX') {
      onSandbox?.();
      return;
    }

    // Build detailed consent record for audit trail
    const timestamp = new Date().toISOString();
    const consentDetails = {};
    POLICY_SECTIONS.forEach(section => {
      consentDetails[section.id] = {
        accepted: consents[section.id] || false,
        title: section.title,
        timestamp: timestamp,
      };
    });

    // Pass the school code and detailed consents to parent
    onComplete?.({
      consents,
      consentDetails,
      consentVersion: CONSENT_VERSION,
      schoolCode: code,
      consentedAt: timestamp,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    });
  };

  const currentSection = POLICY_SECTIONS[currentStep];
  const Icon = currentSection?.icon || FileText;

  // School input screen (after all consents)
  if (showSchoolInput) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-black mb-2">Almost There!</h1>
              <p className="text-muted-foreground">
                Enter your school code to get started
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">School Code</label>
                <input
                  type="text"
                  value={schoolCode}
                  onChange={(e) => {
                    setSchoolCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="e.g., WESTSIDE_HS or SANDBOX"
                  className="w-full px-4 py-3 bg-accent border border-border rounded-xl font-mono text-lg uppercase"
                  autoFocus
                />
                {error && (
                  <p className="text-red-400 text-sm mt-2">{error}</p>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Get your school code from your administrator.<br />
                Type <span className="font-mono font-bold text-primary">SANDBOX</span> to practice with demo data.
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSchoolSubmit}
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg"
              >
                Enter STRIDE
              </motion.button>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-6">
              Signed in as {user?.email}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Consent screens
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="w-full max-w-lg"
      >
        <div className="glass-card p-8">
          {/* Progress */}
          <div className="flex gap-1 mb-6">
            {POLICY_SECTIONS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= currentStep ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </div>

          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Step {currentStep + 1} of {POLICY_SECTIONS.length}
              </p>
              <h2 className="text-xl font-black">{currentSection.title}</h2>
            </div>
          </div>

          {/* Content */}
          <div className="bg-accent/50 rounded-xl p-4 mb-6 max-h-[300px] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-muted-foreground">
              {currentSection.content}
            </pre>
          </div>

          {/* Consent checkbox */}
          <label className="flex items-start gap-3 mb-6 cursor-pointer group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={consents[currentSection.id] || false}
                onChange={() => handleConsent(currentSection.id)}
                className="sr-only"
              />
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                consents[currentSection.id] 
                  ? 'bg-primary border-primary' 
                  : 'border-border group-hover:border-primary/50'
              }`}>
                {consents[currentSection.id] && (
                  <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                )}
              </div>
            </div>
            <span className="text-sm font-medium">
              I have read, understand, and agree to the {currentSection.title}
              {currentSection.required && <span className="text-red-400 ml-1">*</span>}
            </span>
          </label>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-6 py-3 bg-accent border border-border rounded-xl font-bold"
              >
                Back
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              disabled={!consents[currentSection.id]}
              className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${
                consents[currentSection.id]
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent text-muted-foreground cursor-not-allowed'
              }`}
            >
              {currentStep < POLICY_SECTIONS.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                'Continue to School Selection'
              )}
            </motion.button>
          </div>

          {/* Footer */}
          <p className="text-xs text-center text-muted-foreground mt-6">
            Signed in as {user?.email}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
