import DashboardLayout from '@/components/DashboardLayout';
import { FileText, Download, Filter } from 'lucide-react';

const Transactions = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 section-reveal">
          <div>
            <h1 className="text-2xl font-bold">Transaction History</h1>
            <p className="text-muted-foreground">Complete record of all payments and top-ups</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="card-elevated p-12 text-center text-muted-foreground section-reveal stagger-1">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No transactions yet</p>
          <p className="text-sm mt-1">All payment records will appear here</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Transactions;
