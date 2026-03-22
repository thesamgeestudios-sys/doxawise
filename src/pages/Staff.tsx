import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Users, Plus, Upload, Search, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatNaira } from '@/lib/constants';

interface StaffMember {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  salary: number;
  payDay: number;
}

const Staff = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [newStaff, setNewStaff] = useState({ name: '', bankName: '', accountNumber: '', salary: '', payDay: '25' });

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const member: StaffMember = {
      id: crypto.randomUUID(),
      name: newStaff.name,
      bankName: newStaff.bankName,
      accountNumber: newStaff.accountNumber,
      salary: parseFloat(newStaff.salary),
      payDay: parseInt(newStaff.payDay),
    };
    setStaff(prev => [...prev, member]);
    setNewStaff({ name: '', bankName: '', accountNumber: '', salary: '', payDay: '25' });
    setShowAddModal(false);
    toast.success(`${member.name} added successfully`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const newMembers: StaffMember[] = [];

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length >= 4) {
          newMembers.push({
            id: crypto.randomUUID(),
            name: parts[0],
            bankName: parts[1],
            accountNumber: parts[2],
            salary: parseFloat(parts[3]) || 0,
            payDay: parseInt(parts[4]) || 25,
          });
        }
      }

      if (newMembers.length > 0) {
        setStaff(prev => [...prev, ...newMembers]);
        toast.success(`${newMembers.length} staff members imported`);
      } else {
        toast.error('No valid records found in file. Expected: Name, Bank, Account Number, Salary, Pay Day');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const removeStaff = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
    toast.success('Staff member removed');
  };

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.accountNumber.includes(search)
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
            <label className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80">
              <Upload className="w-4 h-4" />
              Import CSV
              <input type="file" accept=".csv,.txt,.doc,.pdf" onChange={handleFileUpload} className="hidden" />
            </label>
            <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" />
              Add Staff
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative section-reveal stagger-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or account number..."
            className="input-field w-full pl-11"
          />
        </div>

        {/* Staff Table */}
        <div className="card-elevated overflow-hidden section-reveal stagger-2">
          {filtered.length > 0 ? (
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
                      <td className="p-4 font-medium">{member.name}</td>
                      <td className="p-4 text-muted-foreground">{member.bankName}</td>
                      <td className="p-4 font-mono text-sm">{member.accountNumber}</td>
                      <td className="p-4 text-right font-medium tabular-nums">{formatNaira(member.salary)}</td>
                      <td className="p-4 text-center">{member.payDay}th</td>
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
              <p className="text-xs mt-3 bg-muted/50 rounded-lg p-3 max-w-md mx-auto">
                CSV format: Name, Bank Name, Account Number, Salary, Pay Day
              </p>
            </div>
          )}
        </div>

        {/* Add Staff Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setShowAddModal(false)}>
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 section-reveal" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-6">Add Staff Member</h2>
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full Name</label>
                  <input value={newStaff.name} onChange={e => setNewStaff(p => ({ ...p, name: e.target.value }))} required className="input-field w-full" placeholder="Adebayo Ogundimu" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Bank Name</label>
                  <input value={newStaff.bankName} onChange={e => setNewStaff(p => ({ ...p, bankName: e.target.value }))} required className="input-field w-full" placeholder="First Bank" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Account Number</label>
                  <input value={newStaff.accountNumber} onChange={e => setNewStaff(p => ({ ...p, accountNumber: e.target.value }))} required maxLength={10} className="input-field w-full" placeholder="0123456789" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Salary (₦)</label>
                    <input type="number" value={newStaff.salary} onChange={e => setNewStaff(p => ({ ...p, salary: e.target.value }))} required className="input-field w-full" placeholder="250000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Pay Day</label>
                    <input type="number" min={1} max={28} value={newStaff.payDay} onChange={e => setNewStaff(p => ({ ...p, payDay: e.target.value }))} required className="input-field w-full" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary py-2.5 rounded-lg text-sm font-medium">Add Staff</button>
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
