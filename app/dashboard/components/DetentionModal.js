'use client';
import { X, Printer, FileText } from 'lucide-react';

export default function DetentionModal({ student, infractions, teacherName, employeeId, schoolName, onClose }) {
  const handlePrint = () => window.print();
  const formatDate = (ts) => ts?.seconds ? new Date(ts.seconds * 1000).toLocaleDateString() : '';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-border flex justify-between items-center no-print">
          <h2 className="font-black flex items-center gap-2"><FileText size={20} /> Detention Document</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold flex items-center gap-2">
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} className="p-2 bg-red-500/20 text-red-400 rounded-lg"><X size={20} /></button>
          </div>
        </div>

        <div className="p-6 printable-doc">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black">{schoolName}</h1>
            <h2 className="text-lg font-bold">Student Discipline Notice</h2>
            <p className="text-sm text-muted-foreground">Date: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-accent/50 rounded-xl">
            <div><span className="text-muted-foreground text-sm">Student:</span><div className="font-bold">{student?.full_name}</div></div>
            <div><span className="text-muted-foreground text-sm">ID:</span><div className="font-bold">{student?.student_id_number}</div></div>
            <div><span className="text-muted-foreground text-sm">Grade:</span><div className="font-bold">{student?.grade_level}</div></div>
            <div><span className="text-muted-foreground text-sm">Teacher:</span><div className="font-bold">{teacherName}</div></div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold mb-2">Recent Infractions</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2">Date</th><th className="text-left py-2">Infraction</th></tr></thead>
              <tbody>
                {infractions?.map((inf, i) => (
                  <tr key={i} className="border-b"><td className="py-2">{formatDate(inf.ts)}</td><td className="py-2">{inf.detail}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-8 pt-8 border-t">
            <div><div className="border-b border-foreground mb-2 h-8" /><span className="text-sm">Student Signature</span></div>
            <div><div className="border-b border-foreground mb-2 h-8" /><span className="text-sm">Parent/Guardian Signature</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
