"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TransactionItem {
  quantity: number;
  products: { name: string } | null;
}

interface Transaction {
  id: string;
  created_at: string;
  total_amount: number;
  payment_method: string;
  staff_id: string;
  status: string;
  transaction_items: TransactionItem[];
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select(`
        id,
        created_at,
        total_amount,
        payment_method,
        staff_id,
        status,
        transaction_items (
          quantity,
          products (name)
        )
      `)
      .order("created_at", { ascending: false });

    if (data) setTransactions(data as unknown as Transaction[]);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions();
  }, []);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    }).format(d);
  };

  return (
    <div className="space-y-6 relative">
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-x-1/4 hidden md:block"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-chart-1">Riwayat Transaksi</h2>
          <p className="text-muted-foreground font-medium mt-1">Log semua penjualan dari seluruh kasir.</p>
        </div>
      </div>

      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-xl shadow-background/50 overflow-hidden relative z-10">
        <CardHeader className="border-b border-border/30 bg-muted/20">
          <CardTitle className="text-xl">Semua Transaksi</CardTitle>
          <CardDescription>Menampilkan log transaksi terbaru.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teks ID</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Pesanan</TableHead>
                <TableHead className="text-right">Total Tagihan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">Loading data...</TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">Belum ada transaksi sama sekali.</TableCell>
                </TableRow>
              ) : (
                transactions.map((trx) => (
                  <TableRow key={trx.id} className="hover:bg-muted/50 transition-colors group">
                    <TableCell className="font-mono text-xs font-medium text-foreground/80 group-hover:text-primary transition-colors">
                      #{trx.id.substring(0, 8)}
                    </TableCell>
                    <TableCell>{formatDate(trx.created_at)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${trx.payment_method === 'qris' ? 'bg-blue-500/20 text-blue-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                        {trx.payment_method.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {trx.transaction_items.map((ti) => `${ti.quantity}x ${ti.products?.name}`).join(", ")}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-extrabold text-foreground bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                        Rp {trx.total_amount.toLocaleString("id-ID")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
