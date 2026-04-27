import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformAccess } from '@/hooks/usePlatformAccess';
import { formatNaira } from '@/lib/constants';
import { GraduationCap, Plus, Search, CreditCard, Loader2, School } from 'lucide-react';
import { toast } from 'sonner';

const SchoolManagement = () => {
  const { user, organizationId, access } = usePlatformAccess();
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [feeFilter, setFeeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [classForm, setClassForm] = useState({ class_name: '', level: '', teacher_name: '' });
  const [studentForm, setStudentForm] = useState({ first_name: '', last_name: '', admission_number: '', class_id: '', guardian_name: '', guardian_phone: '', outstanding_balance: '0' });
  const [feeForm, setFeeForm] = useState({ student_id: '', amount: '', payment_status: 'paid', term: '', session_year: '' });

  useEffect(() => { if (user && organizationId) loadData(); }, [user, organizationId]);

  const loadData = async () => {
    setLoading(true);
    const [classesRes, studentsRes, paymentsRes] = await Promise.all([
      supabase.from('school_classes').select('*').eq('organization_user_id', organizationId).order('class_name'),
      supabase.from('students').select('*').eq('organization_user_id', organizationId).order('created_at', { ascending: false }),
      supabase.from('student_fee_payments').select('*').eq('organization_user_id', organizationId).order('created_at', { ascending: false }),
    ]);
    setClasses(classesRes.data || []);
    setStudents(studentsRes.data || []);
    setPayments(paymentsRes.data || []);
    setLoading(false);
  };

  const addClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('school_classes').insert({ ...classForm, organization_user_id: organizationId });
    if (error) toast.error(error.message); else { toast.success('Class created'); setClassForm({ class_name: '', level: '', teacher_name: '' }); loadData(); }
  };

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('students').insert({ ...studentForm, organization_user_id: organizationId, outstanding_balance: Number(studentForm.outstanding_balance) || 0, fee_status: Number(studentForm.outstanding_balance) > 0 ? 'unpaid' : 'paid' });
    if (error) toast.error(error.message); else { toast.success('Student registered'); setStudentForm({ first_name: '', last_name: '', admission_number: '', class_id: '', guardian_name: '', guardian_phone: '', outstanding_balance: '0' }); loadData(); }
  };

  const recordFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(feeForm.amount) || 0;
    const { error } = await supabase.from('student_fee_payments').insert({ ...feeForm, amount, organization_user_id: organizationId, recorded_by: user!.id });
    if (!error) {
      const student = students.find(s => s.id === feeForm.student_id);
      const nextBalance = Math.max(Number(student?.outstanding_balance || 0) - amount, 0);
      await supabase.from('students').update({ outstanding_balance: nextBalance, fee_status: feeForm.payment_status }).eq('id', feeForm.student_id);
      toast.success('Fee status updated');
      setFeeForm({ student_id: '', amount: '', payment_status: 'paid', term: '', session_year: '' });
      loadData();
    } else toast.error(error.message);
  };

  const filteredStudents = useMemo(() => students.filter(s => {
    const q = `${s.first_name} ${s.last_name} ${s.admission_number} ${s.guardian_phone}`.toLowerCase();
    return q.includes(search.toLowerCase()) && (classFilter === 'all' || s.class_id === classFilter) && (feeFilter === 'all' || s.fee_status === feeFilter);
  }), [students, search, classFilter, feeFilter]);

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  if (!access.isSchool) return <DashboardLayout><div className="card-elevated p-8">School mode is not enabled for this account.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="section-reveal">
          <h1 className="text-2xl font-bold flex items-center gap-2"><School className="w-6 h-6 text-primary" /> Student & Fees Management</h1>
          <p className="text-muted-foreground">Register students, manage classes, and track fee payment status.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="stat-card"><GraduationCap className="w-5 h-5 text-primary mb-2" /><p className="text-2xl font-bold">{students.length}</p><p className="text-sm text-muted-foreground">Students</p></div>
          <div className="stat-card"><School className="w-5 h-5 text-[hsl(var(--info))] mb-2" /><p className="text-2xl font-bold">{classes.length}</p><p className="text-sm text-muted-foreground">Classes</p></div>
          <div className="stat-card"><CreditCard className="w-5 h-5 text-[hsl(var(--success))] mb-2" /><p className="text-2xl font-bold">{formatNaira(totalCollected)}</p><p className="text-sm text-muted-foreground">Fees Collected</p></div>
        </div>

        {access.isBursar && <div className="grid lg:grid-cols-3 gap-4">
          <form onSubmit={addClass} className="card-elevated p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Create Class</h2>
            <input className="input-field w-full" placeholder="JSS 1A" value={classForm.class_name} onChange={e => setClassForm({ ...classForm, class_name: e.target.value })} required />
            <input className="input-field w-full" placeholder="Level" value={classForm.level} onChange={e => setClassForm({ ...classForm, level: e.target.value })} />
            <input className="input-field w-full" placeholder="Teacher" value={classForm.teacher_name} onChange={e => setClassForm({ ...classForm, teacher_name: e.target.value })} />
            <button className="btn-primary w-full py-2 rounded-lg">Save Class</button>
          </form>
          <form onSubmit={addStudent} className="card-elevated p-5 space-y-3 lg:col-span-1">
            <h2 className="font-semibold">Register Student</h2>
            <div className="grid grid-cols-2 gap-2"><input className="input-field" placeholder="First name" value={studentForm.first_name} onChange={e => setStudentForm({ ...studentForm, first_name: e.target.value })} required /><input className="input-field" placeholder="Last name" value={studentForm.last_name} onChange={e => setStudentForm({ ...studentForm, last_name: e.target.value })} required /></div>
            <input className="input-field w-full" placeholder="Admission no." value={studentForm.admission_number} onChange={e => setStudentForm({ ...studentForm, admission_number: e.target.value })} />
            <select className="input-field w-full" value={studentForm.class_id} onChange={e => setStudentForm({ ...studentForm, class_id: e.target.value })}><option value="">Assign class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}</select>
            <input className="input-field w-full" placeholder="Guardian name" value={studentForm.guardian_name} onChange={e => setStudentForm({ ...studentForm, guardian_name: e.target.value })} />
            <input className="input-field w-full" placeholder="Guardian phone" value={studentForm.guardian_phone} onChange={e => setStudentForm({ ...studentForm, guardian_phone: e.target.value })} />
            <input className="input-field w-full" type="number" placeholder="Opening balance" value={studentForm.outstanding_balance} onChange={e => setStudentForm({ ...studentForm, outstanding_balance: e.target.value })} />
            <button className="btn-primary w-full py-2 rounded-lg">Register</button>
          </form>
          <form onSubmit={recordFee} className="card-elevated p-5 space-y-3">
            <h2 className="font-semibold">Update Fee Status</h2>
            <select className="input-field w-full" value={feeForm.student_id} onChange={e => setFeeForm({ ...feeForm, student_id: e.target.value })} required><option value="">Select student</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
            <input className="input-field w-full" type="number" placeholder="Amount paid" value={feeForm.amount} onChange={e => setFeeForm({ ...feeForm, amount: e.target.value })} required />
            <select className="input-field w-full" value={feeForm.payment_status} onChange={e => setFeeForm({ ...feeForm, payment_status: e.target.value })}><option value="paid">Paid</option><option value="part_payment">Part Payment</option><option value="unpaid">Unpaid</option></select>
            <input className="input-field w-full" placeholder="Term" value={feeForm.term} onChange={e => setFeeForm({ ...feeForm, term: e.target.value })} />
            <input className="input-field w-full" placeholder="Session" value={feeForm.session_year} onChange={e => setFeeForm({ ...feeForm, session_year: e.target.value })} />
            <button className="btn-primary w-full py-2 rounded-lg">Record Payment</button>
          </form>
        </div>}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input className="input-field w-full pl-10" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className="input-field" value={classFilter} onChange={e => setClassFilter(e.target.value)}><option value="all">All classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}</select>
          <select className="input-field" value={feeFilter} onChange={e => setFeeFilter(e.target.value)}><option value="all">All fee status</option><option value="paid">Paid</option><option value="part_payment">Part Payment</option><option value="unpaid">Unpaid</option></select>
        </div>

        <div className="card-elevated overflow-x-auto">
          {loading ? <div className="p-10 text-center"><Loader2 className="w-7 h-7 animate-spin mx-auto text-primary" /></div> : <table className="w-full">
            <thead><tr className="border-b bg-muted/50"><th className="p-4 text-left text-xs uppercase text-muted-foreground">Student</th><th className="p-4 text-left text-xs uppercase text-muted-foreground">Class</th><th className="p-4 text-left text-xs uppercase text-muted-foreground">Guardian</th><th className="p-4 text-left text-xs uppercase text-muted-foreground">Fee Status</th><th className="p-4 text-right text-xs uppercase text-muted-foreground">Balance</th></tr></thead>
            <tbody>{filteredStudents.map(s => <tr key={s.id} className="border-b last:border-0"><td className="p-4 font-medium">{s.first_name} {s.last_name}<p className="text-xs text-muted-foreground">{s.admission_number}</p></td><td className="p-4">{classes.find(c => c.id === s.class_id)?.class_name || 'Unassigned'}</td><td className="p-4 text-sm text-muted-foreground">{s.guardian_name}<p>{s.guardian_phone}</p></td><td className="p-4"><span className="badge-success capitalize">{String(s.fee_status).replace('_', ' ')}</span></td><td className="p-4 text-right font-semibold">{formatNaira(Number(s.outstanding_balance || 0))}</td></tr>)}</tbody>
          </table>}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolManagement;
