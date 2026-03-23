import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { flutterwaveApi } from '@/lib/flutterwave';
import { Users, Plus, Upload, Search, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatNaira } from '@/lib/constants';

interface StaffMember {
  id: string;
  full_name: string;
  bank_name: string;
  account_number: string;
  salary: number;
  pay_day: number;
  is_active: boolean;
}

interface Bank {
  code: string;
  name: string;
}

const Staff = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStaff, setNewStaff] = useState({ full_name: '', bank_code: '', bank_name: '', account_number: '', salary: '', pay_day: '25' });

  useEffect(() => {
    if (user) {
      loadStaff();
      loadBanks();
    }
  }, [user]);

  const loadStaff = async () => {
    setLoading(true);
    const { data } = await supabase.from('staff').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    if (data) setStaff(data as StaffMember[]);
    setLoading(false);
  };

  const loadBanks = async () => {
    try {
      const result = await flutterwaveApi.getBanks();
      if (result.success && result.banks) setBanks(result.banks);
    } catch (err) {
      console.error('Failed to load banks:', err);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const selectedBank = banks.find(b => b.code === newStaff.bank_code);

    const { error } = await supabase.from('staff').insert({
      user_id: user!.id,
      full_name: newStaff.full_name,
      bank_name: selectedBank?.name || newStaff.bank_name || newStaff.bank_code,
      account_number: newStaff.account_number,
      salary: parseFloat(newStaff.salary) || 0,
      pay_day: parseInt(newStaff.pay_day) || 25,
    });

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${newStaff.full_name} added successfully`);
      setNewStaff({ full_name: '', bank_code: '', bank_name: '', account_number: '', salary: '', pay_day: '25' });
      setShowAddModal(false);
      loadStaff();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const newMembers: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length >= 4) {
          newMembers.push({
            user_id: user!.id,
            full_name: parts[0],
            bank_name: parts[1],
            account_number: parts[2],
            salary: parseFloat(parts[3]) || 0,
            pay_day: parseInt(parts[4]) || 25,
          });
        }
      }

      if (newMembers.length > 0) {
        const { error } = await supabase.from('staff').insert(newMembers);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(`${newMembers.length} staff members imported`);
          loadStaff();
        }
      } else {
        toast.error('No valid records found. Expected: Name, Bank, Account Number, Salary, Pay Day');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const removeStaff = async (id: string) => {
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Staff member removed');
      setStaff(prev => prev.filter(s => s.id !== id));
    }
  };

  const filtered = staff.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.account_number.includes(search)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 section-reveal">
          <div>
            <h1 className="text-2xl font-bold">Staff Management</h1>
            <p className="text-muted-foreground">Manage your employees and their payment details</p>
          </div>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <Upload className="w-4 h-4" />
              Import CSV
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
            <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" />
              Add Staff
            </button>
          </div>
        </div>

        <div className="relative section-reveal stagger-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or account number..." className="input-field w-full pl-11" />
        </div>

        <div className="card-elevated overflow-hidden section-reveal stagger-2">
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Name</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Bank</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Account No.</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Salary</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Pay Day</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(member => (
                    <tr key={member.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">{member.full_name}</td>
                      <td className="p-4 text-muted-foreground">{member.bank_name}</td>
                      <td className="p-4 font-mono text-sm">{member.account_number}</td>
                      <td className="p-4 text-right font-medium tabular-nums">{formatNaira(member.salary)}</td>
                      <td className="p-4 text-center">{member.pay_day}th</td>
                      <td className="p-4 text-right">
                        <button onClick={() => removeStaff(member.id)} className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No staff members yet</p>
              <p className="text-sm mt-1">Add staff manually or import from a CSV file</p>
              <p className="text-xs mt-3 bg-muted/50 rounded-lg p-3 max-w-md mx-auto">CSV format: Name, Bank Name, Account Number, Salary, Pay Day</p>
            </div>
          )}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setShowAddModal(false)}>
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 section-reveal" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-6">Add Staff Member</h2>
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full Name</label>
                  <input value={newStaff.full_name} onChange={e => setNewStaff(p => ({ ...p, full_name: e.target.value }))} required className="input-field w-full" placeholder="Adebayo Ogundimu" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Bank</label>
                  {banks.length > 0 ? (
                    <select
                      value={newStaff.bank_code}
                      onChange={e => setNewStaff(p => ({ ...p, bank_code: e.target.value }))}
                      required
                      className="input-field w-full"
                    >
                      <option value="">Select bank</option>
                      {banks.map(b => (
                        <option key={b.code} value={b.code}>{b.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input value={newStaff.bank_name} onChange={e => setNewStaff(p => ({ ...p, bank_name: e.target.value }))} required className="input-field w-full" placeholder="First Bank" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Account Number</label>
                  <input value={newStaff.account_number} onChange={e => setNewStaff(p => ({ ...p, account_number: e.target.value }))} required maxLength={10} className="input-field w-full" placeholder="0123456789" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Salary (₦)</label>
                    <input type="number" value={newStaff.salary} onChange={e => setNewStaff(p => ({ ...p, salary: e.target.value }))} required className="input-field w-full" placeholder="250000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Pay Day</label>
                    <input type="number" min={1} max={28} value={newStaff.pay_day} onChange={e => setNewStaff(p => ({ ...p, pay_day: e.target.value }))} required className="input-field w-full" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Staff'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Staff;
