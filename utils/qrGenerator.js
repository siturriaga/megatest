import QRCode from 'qrcode';
import JSZip from 'jszip';

/**
 * Generate a single QR code as data URL
 * @param {string} studentId - Student ID to encode
 * @param {string} schoolId - School ID for namespacing
 * @returns {Promise<string>} - Data URL of QR code image
 */
export async function generateStudentQR(studentId, schoolId) {
  const data = JSON.stringify({
    type: 'STRIDE_STUDENT',
    schoolId,
    studentId,
    v: 1, // Version for future compatibility
  });

  return QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Generate QR codes for all students and package as ZIP
 * @param {Array} students - Array of student objects with id, full_name, student_id_number
 * @param {string} schoolId - School ID for namespacing
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Blob>} - ZIP file blob
 */
export async function generateBulkStudentQRs(students, schoolId, onProgress) {
  const zip = new JSZip();
  const folder = zip.folder('student-qr-codes');

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    
    try {
      // Generate QR code
      const qrDataUrl = await generateStudentQR(student.id, schoolId);
      
      // Convert data URL to binary
      const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      
      // Create filename: "StudentName_ID.png"
      const safeName = student.full_name
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 30);
      const filename = `${safeName}_${student.student_id_number}.png`;
      
      // Add to ZIP
      folder.file(filename, base64Data, { base64: true });

      // Report progress
      if (onProgress) {
        onProgress(Math.round(((i + 1) / students.length) * 100));
      }
    } catch (err) {
      console.error(`Failed to generate QR for ${student.full_name}:`, err);
    }
  }

  // Generate ZIP blob
  return zip.generateAsync({ type: 'blob' });
}

/**
 * Generate printable ID card HTML for a student
 * @param {Object} student - Student object
 * @param {string} schoolId - School ID
 * @param {string} schoolName - School display name
 * @returns {Promise<string>} - HTML string for printing
 */
export async function generateStudentIDCard(student, schoolId, schoolName) {
  const qrDataUrl = await generateStudentQR(student.id, schoolId);

  return `
    <div style="
      width: 3.375in;
      height: 2.125in;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 12px;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-inside: avoid;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: white;
    ">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-size: 8px; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px;">
            ${schoolName}
          </div>
          <div style="font-size: 14px; font-weight: bold; margin-top: 4px;">
            ${student.full_name}
          </div>
          <div style="font-size: 10px; opacity: 0.8; margin-top: 2px;">
            ID: ${student.student_id_number}
          </div>
          <div style="font-size: 10px; opacity: 0.8;">
            Grade: ${student.grade_level || 'N/A'}
          </div>
        </div>
        <img src="${qrDataUrl}" style="width: 60px; height: 60px; border-radius: 4px;" />
      </div>
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid rgba(255,255,255,0.2);
        padding-top: 8px;
        margin-top: 8px;
      ">
        <div style="font-size: 16px; font-weight: bold; letter-spacing: 2px;">
          STRIDE
        </div>
        <div style="font-size: 8px; opacity: 0.6;">
          Scan for Hall Pass
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate printable sheet of ID cards (8 per page)
 * @param {Array} students - Array of students
 * @param {string} schoolId - School ID
 * @param {string} schoolName - School display name
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<string>} - Full HTML document for printing
 */
export async function generatePrintableIDSheet(students, schoolId, schoolName, onProgress) {
  const cards = [];

  for (let i = 0; i < students.length; i++) {
    const card = await generateStudentIDCard(students[i], schoolId, schoolName);
    cards.push(card);
    
    if (onProgress) {
      onProgress(Math.round(((i + 1) / students.length) * 100));
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Student ID Cards - ${schoolName}</title>
      <style>
        @page {
          size: letter;
          margin: 0.5in;
        }
        body {
          margin: 0;
          padding: 0;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.25in;
        }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="padding: 20px; text-align: center; background: #f0f0f0;">
        <button onclick="window.print()" style="
          padding: 12px 24px;
          font-size: 16px;
          font-weight: bold;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        ">
          Print ID Cards
        </button>
        <p style="margin-top: 10px; color: #666;">
          ${students.length} cards ready to print (${Math.ceil(students.length / 8)} pages)
        </p>
      </div>
      <div class="grid">
        ${cards.join('\n')}
      </div>
    </body>
    </html>
  `;
}

/**
 * Download a blob as a file
 * @param {Blob} blob - File blob
 * @param {string} filename - Download filename
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
