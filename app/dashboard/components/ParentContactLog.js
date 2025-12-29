'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Printer, Download, Calendar, User, Phone } from 'lucide-react';
import { formatFormalDate, getCurrentSchoolYear } from '../../../utils/formatters';

/**
 * ParentContactLog - Formal Letterhead Export
 * Creates printable parent contact documentation with school branding
 */
export default function ParentContactLog({
  isOpen,
  onClose,
  student,
  contacts = [],
  teacherName,
  schoolName,
  schoolLogo,
}) {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [includeAll, setIncludeAll] = useState(true);

  // Filter contacts by date range
  const filteredContacts = includeAll 
    ? contacts 
    : contacts.filter(c => {
        if (!dateRange.start || !dateRange.end) return true;
        const contactDate = c.ts?.seconds ? new Date(c.ts.seconds * 1000) : new Date();
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        return contactDate >= start && contactDate <= end;
      });

  const generatePrintHTML = () => {
    const today = formatFormalDate(new Date());
    const schoolYear = getCurrentSchoolYear();

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Parent Contact Log - ${student?.full_name}</title>
  <style>
    @page { margin: 1in; }
    body { 
      font-family: 'Times New Roman', Times, serif; 
      font-size: 12pt;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 8.5in;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #1a1a1a;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 10px;
    }
    .school-name {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .document-title {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 20px;
    }
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .info-item {
      margin-bottom: 5px;
    }
    .info-label {
      font-weight: bold;
      display: inline-block;
      width: 120px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 10px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f0f0f0;
      font-weight: bold;
    }
    .contact-row:nth-child(even) {
      background: #fafafa;
    }
    .interventions {
      font-size: 10pt;
      color: #555;
    }
    .footer {
      margin-top: 60px;
      page-break-inside: avoid;
    }
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
    }
    .signature-line {
      width: 250px;
      border-top: 1px solid #1a1a1a;
      padding-top: 5px;
      text-align: center;
    }
    .confidential {
      text-align: center;
      font-size: 10pt;
      color: #666;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    ${schoolLogo ? `<img src="${schoolLogo}" class="logo" alt="School Logo">` : '<div class="logo" style="background:#ddd;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24pt;">🏫</div>'}
    <div class="school-name">${schoolName || 'School Name'}</div>
    <div>School Year ${schoolYear}</div>
    <div class="document-title">Parent/Guardian Contact Log</div>
  </div>

  <div class="info-section">
    <div>
      <div class="info-item"><span class="info-label">Student Name:</span> ${student?.full_name || 'N/A'}</div>
      <div class="info-item"><span class="info-label">Student ID:</span> ${student?.student_id_number || 'N/A'}</div>
      <div class="info-item"><span class="info-label">Grade Level:</span> ${student?.grade_level || 'N/A'}</div>
    </div>
    <div>
      <div class="info-item"><span class="info-label">Teacher:</span> ${teacherName || 'N/A'}</div>
      <div class="info-item"><span class="info-label">Date Generated:</span> ${today}</div>
      <div class="info-item"><span class="info-label">Total Contacts:</span> ${filteredContacts.length}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 100px;">Date</th>
        <th style="width: 80px;">Method</th>
        <th style="width: 60px;">Made</th>
        <th>Interventions Tried</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      ${filteredContacts.map(contact => `
        <tr class="contact-row">
          <td>${contact.ts?.seconds ? new Date(contact.ts.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
          <td>${contact.contactMethod || 'N/A'}</td>
          <td>${contact.contactMade ? '✓ Yes' : '✗ No'}</td>
          <td class="interventions">${(contact.interventions || []).join(', ') || 'None recorded'}</td>
          <td>${contact.notes || '-'}</td>
        </tr>
      `).join('')}
      ${filteredContacts.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:20px;">No contact records found for this period.</td></tr>' : ''}
    </tbody>
  </table>

  <div class="footer">
    <p><strong>Summary:</strong> This document summarizes all parent/guardian communication attempts and outcomes 
    for the student listed above during the specified period. All interventions listed were implemented 
    in accordance with the school's MTSS (Multi-Tiered System of Supports) framework.</p>

    <div class="signature-section">
      <div>
        <div class="signature-line">Teacher Signature</div>
      </div>
      <div>
        <div class="signature-line">Date</div>
      </div>
      <div>
        <div class="signature-line">Administrator Signature (if required)</div>
      </div>
    </div>

    <div class="confidential">
      <strong>CONFIDENTIAL</strong><br>
      This document contains confidential student information protected under FERPA. 
      Unauthorized disclosure is prohibited.
    </div>
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generatePrintHTML());
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-black flex items-center gap-2">
            <FileText className="text-primary" />
            Parent Contact Log - {student?.full_name}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Date Range Filter */}
          <div className="p-4 bg-accent/50 border border-border rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeAll}
                  onChange={(e) => setIncludeAll(e.target.checked)}
                  className="rounded"
                />
                <span className="font-bold">Include All Records</span>
              </label>
            </div>

            {!includeAll && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold block mb-2">
                    <Calendar size={14} className="inline mr-1" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-2">
                    <Calendar size={14} className="inline mr-1" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="p-4 bg-white/5 border border-border rounded-xl">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <User size={16} />
              Document Preview
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Student:</span> {student?.full_name}</div>
              <div><span className="text-muted-foreground">Grade:</span> {student?.grade_level}</div>
              <div><span className="text-muted-foreground">Teacher:</span> {teacherName}</div>
              <div><span className="text-muted-foreground">Records:</span> {filteredContacts.length}</div>
            </div>

            {filteredContacts.length > 0 && (
              <div className="mt-4 max-h-40 overflow-y-auto space-y-2">
                {filteredContacts.slice(0, 5).map((contact, i) => (
                  <div key={i} className="p-2 bg-background/50 rounded-lg text-xs flex justify-between">
                    <span>{contact.ts?.seconds ? new Date(contact.ts.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                    <span className={contact.contactMade ? 'text-emerald-400' : 'text-amber-400'}>
                      {contact.contactMade ? '✓ Contact Made' : '⚠ No Contact'}
                    </span>
                  </div>
                ))}
                {filteredContacts.length > 5 && (
                  <div className="text-center text-muted-foreground text-xs">
                    +{filteredContacts.length - 5} more records
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 py-3 bg-accent border border-border rounded-xl font-bold"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrint}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <Printer size={18} />
            Print / Save PDF
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
