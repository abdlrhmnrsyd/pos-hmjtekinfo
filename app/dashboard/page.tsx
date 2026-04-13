"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Coins, ShoppingBag, IceCream, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

interface TransactionItem {
  quantity: number;
  products: { name: string } | null;
}

interface Transaction {
  id: string;
  created_at: string;
  total_amount: number;
  payment_method: string;
  transaction_items: TransactionItem[];
}

interface TrxData {
  created_at: string;
  total_amount: number;
  payment_method: string;
  transaction_items: { quantity: number }[];
}

interface ChartDataEntry {
  name: string;
  sales: number;
  dateString: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [recentTrx, setRecentTrx] = useState<Transaction[]>([]);
  
  // Real data states
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayTrxCount, setTodayTrxCount] = useState(0);
  const [todayItemsSold, setTodayItemsSold] = useState(0);
  const [favMethodText, setFavMethodText] = useState("Belum ada");
  const [favMethodPercent, setFavMethodPercent] = useState(0);
  const [dynamicChartData, setDynamicChartData] = useState<ChartDataEntry[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }

      // 1. Fetch recent 5 transactions for the list
      const { data: trxList } = await supabase
        .from('transactions')
        .select(`
          id,
          created_at,
          total_amount,
          payment_method,
          transaction_items (
            quantity,
            products (name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (trxList) {
        setRecentTrx(trxList as unknown as Transaction[]);
      }

      // 2. Fetch last 7 days aggregation data
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setHours(0, 0, 0, 0);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      const { data: trxData } = await supabase
        .from('transactions')
        .select(`
          created_at,
          total_amount,
          payment_method,
          transaction_items (
            quantity
          )
        `)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true }); // Ascending for chart

      // Initial chart data array for the last 7 days
      const daysStr = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      const chartMap = new Map();
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        const dateKey = d.toISOString().split('T')[0];
        chartMap.set(dateKey, { 
          name: daysStr[d.getDay()], 
          sales: 0,
          dateString: dateKey
        });
      }

      let rev = 0;
      let count = 0;
      let items = 0;
      let qris = 0;
      let cash = 0;

      // To handle local time vs UTC, we rely on local date strings matching
      const todayStr = new Date().toISOString().split('T')[0];

      if (trxData) {
        (trxData as unknown as TrxData[]).forEach((t) => {
          const tDate = new Date(t.created_at);
          const dateKey = tDate.toISOString().split('T')[0];
          
          // Chart aggregation
          if (chartMap.has(dateKey)) {
            const entry = chartMap.get(dateKey);
            entry.sales += t.total_amount;
          }

          // Today aggregation
          if (dateKey === todayStr) {
            rev += t.total_amount;
            count += 1;
            
            if (t.payment_method === 'qris') qris++;
            else cash++;

            if (t.transaction_items) {
              t.transaction_items.forEach((item) => {
                items += item.quantity || 0;
              });
            }
          }
        });
      }

      setDynamicChartData(Array.from(chartMap.values()));
      setTodayRevenue(rev);
      setTodayTrxCount(count);
      setTodayItemsSold(items);

      if (count > 0) {
        const isQris = qris >= cash;
        setFavMethodText(isQris ? 'QRIS' : 'Tunai');
        setFavMethodPercent(Math.round(((isQris ? qris : cash) / count) * 100));
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, [router]);

  // Format time util
  const timeAgo = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `${min}m yll`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}j yll`;
    return `${Math.floor(hr / 24)}h yll`;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview Penjualan</h2>
        <p className="text-muted-foreground">
          Ringkasan aktivitas penjualan toko es krim hari ini dari database riil.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics" disabled>Analytics</TabsTrigger>
          <TabsTrigger value="reports" disabled>Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="group hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Coins className="h-16 w-16 text-primary animate-pulse-glow" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pendapatan Hari Ini
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Coins className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-chart-1">Rp {(todayRevenue / 1000).toLocaleString("id-ID")}k</div>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  Total pemasukan terkini
                </p>
              </CardContent>
            </Card>
            <Card className="group hover:-translate-y-1 hover:shadow-xl hover:shadow-chart-1/20 transition-all duration-300 border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShoppingBag className="h-16 w-16 text-chart-1" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Transaksi
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-chart-1/10 flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-chart-1" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-foreground">{todayTrxCount}</div>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  Jumlah pesanan sukses
                </p>
              </CardContent>
            </Card>
            <Card className="group hover:-translate-y-1 hover:shadow-xl hover:shadow-chart-3/20 transition-all duration-300 border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <IceCream className="h-16 w-16 text-chart-3" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Es Krim Terjual
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-chart-3/10 flex items-center justify-center">
                  <IceCream className="h-4 w-4 text-chart-3" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-foreground">{todayItemsSold}</div>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  Porsi es krim laku hari ini
                </p>
              </CardContent>
            </Card>
            <Card className="group hover:-translate-y-1 hover:shadow-xl hover:shadow-chart-4/20 transition-all duration-300 border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="h-16 w-16 text-chart-4" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pembayaran Terfavorit
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-chart-4/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-chart-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-foreground uppercase">{favMethodText}</div>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  {favMethodPercent}% dari total transaksi
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 border-border/50 bg-card/60 backdrop-blur-xl shadow-lg shadow-background/50">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Grafik Pendapatan (7 Hari Terakhir)</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={dynamicChartData}
                      margin={{
                        top: 5,
                        right: 10,
                        left: -20,
                        bottom: 0,
                      }}
                    >
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `Rp ${value / 1000}k`}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <RechartsTooltip 
                        formatter={(value) => [`Rp ${Number(value).toLocaleString("id-ID")}`, "Pendapatan"]}
                        labelFormatter={(label, payload) => {
                           if(payload && payload.length > 0) {
                             return payload[0].payload.dateString;
                           }
                           return label;
                        }}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorSales)"
                        strokeWidth={4}
                        activeDot={{ r: 8, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3 border-border/50 bg-card/60 backdrop-blur-xl shadow-lg shadow-background/50">
              <CardHeader className="pb-3 border-b border-border/30">
                <CardTitle className="text-xl font-bold">Transaksi Terbaru</CardTitle>
                <CardDescription>
                  Data faktur terbaru dari seluruh kasir.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {recentTrx.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-xl rounded-xl border border-dashed border-border">
                      <IceCream className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">Belum ada transaksi.</p>
                    </div>
                  ) : (
                    recentTrx.map((trx) => (
                      <div key={trx.id} className="flex items-center group p-2 -mx-2 rounded-xl hover:bg-muted/50 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-chart-1/20 flex items-center justify-center border border-border/50">
                          {trx.payment_method === 'qris' ? (
                            <span className="text-xs font-bold text-primary">QR</span>
                          ) : (
                            <span className="text-xs font-bold text-chart-1">RP</span>
                          )}
                        </div>
                        <div className="ml-4 flex-1 space-y-1">
                          <p className="text-sm font-bold leading-none">
                            Trx #{trx.id.substring(0, 8).toUpperCase()}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-1 pr-4">
                            {trx.transaction_items.map((ti) => `${ti.quantity}x ${ti.products?.name}`).join(", ")}
                          </p>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-sm font-extrabold text-foreground bg-secondary/50 px-3 py-1 rounded-full border border-border/50">
                            +Rp {Number(trx.total_amount).toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {timeAgo(trx.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
