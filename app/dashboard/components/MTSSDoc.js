'use client';
import { getMTSSTier } from '../../../constants/defaults';

/**
 * MTSSDoc - Hidden Document for Print
 * 
 * This component is visually hidden (display: none) on screen.
 * When teacher clicks "Print Report", the @media print CSS query
 * hides the dashboard and reveals ONLY this document.
 */
export default function MTSSDoc({ 
  student, 
  logs = [], 
  parentContacts = [],
  teacherName,
  schoolName,
  printTrigger // When this changes, trigger print
}) {
  if (!student) return null;

  const infractions = logs.filter(l => l.studentId === student.id && l.type === 'INFRACTION');
  const incentives = logs.filter(l => l.studentId === student.id && l.type === 'INCENTIVE');
  const tardies = logs.filter(l => l.studentId === student.id && l.type === 'TARDY');
  const contacts = parentContacts.filter(c => c.studentId === student.id);

  const tier = getMTSSTier(student.mtss_score || 0);
  const tierLabel = tier.label;
  const tierColor = tier.color;

  const formatDate = (ts) => {
    if (!ts?.seconds) return 'N/A';
    return new Date(ts.seconds * 1000).toLocaleDateString();
  };

  const formatDateTime = (ts) => {
    if (!ts?.seconds) return 'N/A';
    return new Date(ts.seconds * 1000).toLocaleString();
  };

  return (
    <div className="printable-doc hidden print:block bg-white text-black p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold">{schoolName || 'School Name'}</h1>
        <h2 className="text-xl font-semibold mt-1">Multi-Tiered System of Supports (MTSS)</h2>
        <h3 className="text-lg">Student Behavioral Report</h3>
        <p className="text-sm text-gray-600 mt-2">Generated: {new Date().toLocaleString()}</p>
      </div>

      {/* Student Information */}
      <section className="mb-6">
        <h4 className="font-bold text-lg border-b border-gray-300 pb-1 mb-3">Student Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-semibold">Name:</span> {student.full_name}
          </div>
          <div>
            <span className="font-semibold">Student ID:</span> {student.student_id_number}
          </div>
          <div>
            <span className="font-semibold">Grade Level:</span> {student.grade_level}
          </div>
          <div>
            <span className="font-semibold">House:</span> {student.houseId || 'Unassigned'}
          </div>
        </div>
      </section>

      {/* MTSS Status */}
      <section className="mb-6 p-4 bg-gray-100 rounded">
        <h4 className="font-bold text-lg mb-3">Current MTSS Status</h4>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-white rounded shadow">
            <div className="text-3xl font-bold">{student.mtss_score || 0}</div>
            <div className="text-sm text-gray-600">MTSS Score</div>
          </div>
          <div className="p-3 bg-white rounded shadow">
            <div className="text-3xl font-bold">{student.infraction_count || 0}</div>
            <div className="text-sm text-gray-600">Infractions</div>
          </div>
          <div className="p-3 bg-white rounded shadow">
            <div className="text-3xl font-bold">{student.tardy_count || 0}</div>
            <div className="text-sm text-gray-600">Tardies</div>
          </div>
          <div className="p-3 bg-white rounded shadow">
            <div className="text-xl font-bold">{tierLabel}</div>
            <div className="text-sm text-gray-600">Current Tier</div>
          </div>
        </div>
      </section>

      {/* Tier Recommendations */}
      <section className="mb-6 p-4 border border-gray-300 rounded">
        <h4 className="font-bold text-lg mb-3">Tier {tierLabel} Recommended Interventions</h4>
        {tier.label === 'Universal' && (
          <ul className="list-disc list-inside space-y-1">
            <li>Continue positive reinforcement strategies</li>
            <li>Maintain current classroom management approaches</li>
            <li>Monitor for any changes in behavior patterns</li>
          </ul>
        )}
        {tier.label === 'Targeted' && (
          <ul className="list-disc list-inside space-y-1">
            <li>Implement Check-In/Check-Out (CICO) system</li>
            <li>Create behavior contract with student</li>
            <li>Schedule parent/guardian conference</li>
            <li>Consider small group social skills instruction</li>
            <li>Increase positive reinforcement frequency</li>
          </ul>
        )}
        {tier.label === 'Intensive' && (
          <ul className="list-disc list-inside space-y-1">
            <li>Convene Student Support Team (SST) meeting</li>
            <li>Consider Functional Behavioral Assessment (FBA)</li>
            <li>Develop Behavior Intervention Plan (BIP)</li>
            <li>Coordinate with school counselor/psychologist</li>
            <li>Evaluate need for outside agency support</li>
          </ul>
        )}
        {tier.label === 'Critical' && (
          <ul className="list-disc list-inside space-y-1 text-red-800">
            <li><strong>IMMEDIATE: Admin referral required</strong></li>
            <li>Emergency SST meeting within 48 hours</li>
            <li>Mandatory parent conference</li>
            <li>Consider alternative placement options</li>
            <li>Document all interventions for due process</li>
          </ul>
        )}
      </section>

      {/* Infraction History */}
      <section className="mb-6">
        <h4 className="font-bold text-lg border-b border-gray-300 pb-1 mb-3">
          Infraction History ({infractions.length} total)
        </h4>
        {infractions.length === 0 ? (
          <p className="text-gray-600 italic">No infractions recorded</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Reported By</th>
              </tr>
            </thead>
            <tbody>
              {infractions.slice(0, 20).map((inf, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{formatDate(inf.ts)}</td>
                  <td className="p-2">{inf.detail}</td>
                  <td className="p-2">{inf.employeeId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Parent Contact Log */}
      <section className="mb-6">
        <h4 className="font-bold text-lg border-b border-gray-300 pb-1 mb-3">
          Parent/Guardian Contact Log ({contacts.length} contacts)
        </h4>
        {contacts.length === 0 ? (
          <p className="text-gray-600 italic">No parent contacts recorded</p>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded border">
                <div className="flex justify-between">
                  <span className="font-semibold">{formatDate(contact.ts)}</span>
                  <span className="text-sm">
                    {contact.contactMade ? `✓ Contact Made (${contact.contactMethod})` : '✗ No Contact'}
                  </span>
                </div>
                {contact.interventions?.length > 0 && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Interventions tried: </span>
                    {contact.interventions.join(', ')}
                  </div>
                )}
                {contact.notes && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Notes: </span>
                    {contact.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Positive Behaviors */}
      <section className="mb-6">
        <h4 className="font-bold text-lg border-b border-gray-300 pb-1 mb-3">
          Positive Behaviors / Incentives ({incentives.length} total)
        </h4>
        <p className="mb-2">
          <span className="font-semibold">Total Points Earned:</span> {student.incentive_points_student || 0} (personal) + {student.incentive_points_team || 0} (team contribution)
        </p>
        {incentives.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-50">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Recognition</th>
                <th className="text-left p-2">Points</th>
              </tr>
            </thead>
            <tbody>
              {incentives.slice(0, 10).map((inc, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{formatDate(inc.ts)}</td>
                  <td className="p-2">{inc.detail}</td>
                  <td className="p-2">+{inc.points || 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Signatures */}
      <section className="mt-12 pt-6 border-t-2 border-black">
        <div className="grid grid-cols-3 gap-8">
          <div>
            <div className="border-b border-black h-12 mb-2"></div>
            <p className="text-sm">Teacher Signature</p>
            <p className="text-xs text-gray-600">{teacherName}</p>
          </div>
          <div>
            <div className="border-b border-black h-12 mb-2"></div>
            <p className="text-sm">Administrator Signature</p>
          </div>
          <div>
            <div className="border-b border-black h-12 mb-2"></div>
            <p className="text-sm">Parent/Guardian Signature</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Date: _________________ | Conference Date (if applicable): _________________
        </p>
      </section>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-gray-500">
        <p>This document is confidential student information protected under FERPA.</p>
        <p>STRIDE School Management System • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
