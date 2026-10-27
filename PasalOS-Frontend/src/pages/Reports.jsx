import { useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Wallet,
  Package,
  Download,
  CalendarDays,
  RefreshCw,
  Receipt,
} from "lucide-react";

import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  Bar,
  BarChart,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { useSales } from "../hooks/useSales";
import { usePurchases } from "../hooks/usePurchases";
import { useExpenses } from "../hooks/useExpenses";
import { useProducts } from "../hooks/useProducts";
import { formatCurrency } from "../utils/currency";

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#f97316",
];

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getRecordDate = (record) => {
  const value =
    record?.date ??
    record?.createdAt ??
    record?.purchaseDate ??
    record?.expenseDate ??
    record?.saleDate;

  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getAmount = (record) =>
  toNumber(
    record?.total ??
      record?.totalAmount ??
      record?.grandTotal ??
      record?.amount ??
      record?.subtotal
  );

const isCancelled = (record) =>
  String(record?.status ?? "").toLowerCase() === "cancelled";

const getItemQuantity = (item) =>
  toNumber(item?.quantity ?? item?.qty ?? item?.count);

const getItemPrice = (item) =>
  toNumber(item?.price ?? item?.unitPrice ?? item?.sellingPrice);

const getItemCost = (item) =>
  toNumber(
    item?.costPrice ??
      item?.purchasePrice ??
      item?.unitCost ??
      item?.cost
  );

const getSaleItems = (sale) =>
  Array.isArray(sale?.items)
    ? sale.items
    : Array.isArray(sale?.products)
      ? sale.products
      : [];

const getPurchaseItems = (purchase) =>
  Array.isArray(purchase?.items)
    ? purchase.items
    : Array.isArray(purchase?.products)
      ? purchase.products
      : [];

const formatShortDate = (date) =>
  date.toLocaleDateString("en-NP", {
    day: "2-digit",
    month: "short",
  });

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const escapeCsv = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const downloadCsv = (filename, rows) => {
  if (!rows.length) {
    window.alert("There is no data to export.");
    return;
  }

  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900">
            {value}
          </h3>
          <p className="mt-2 text-xs text-gray-500">{subtitle}</p>
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>

      {children}
    </section>
  );
}

function EmptyChart({ message = "No data available for this period." }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl bg-gray-50 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}

export default function Reports() {
  const [sales] = useSales();
  const [purchases] = usePurchases();
  const [expenses] = useExpenses();
  const [products] = useProducts();

  const [period, setPeriod] = useState("30");
  const [customStart, setCustomStart] = useState(
    getLocalDateString(
      new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
    )
  );
  const [customEnd, setCustomEnd] = useState(getLocalDateString(new Date()));

  const today = getLocalDateString(new Date());

  const dateRange = useMemo(() => {
    const end = new Date(`${today}T23:59:59.999`);
    let start = new Date(`${today}T00:00:00`);

    if (period === "today") {
      // Keep today's date range.
    } else if (period === "7") {
      start.setDate(start.getDate() - 6);
    } else if (period === "30") {
      start.setDate(start.getDate() - 29);
    } else if (period === "custom") {
      start = customStart
        ? new Date(`${customStart}T00:00:00`)
        : new Date("1970-01-01T00:00:00");

      const customEndDate = customEnd
        ? new Date(`${customEnd}T23:59:59.999`)
        : end;

      return {
        start,
        end: customEndDate,
        valid: start <= customEndDate,
      };
    } else if (period === "all") {
      start = new Date("1970-01-01T00:00:00");
    }

    return { start, end, valid: true };
  }, [period, customStart, customEnd, today]);

  const isInRange = (record) => {
    const date = getRecordDate(record);

    if (!date || !dateRange.valid) return false;

    return date >= dateRange.start && date <= dateRange.end;
  };

  const filteredSales = useMemo(
    () =>
      (Array.isArray(sales) ? sales : []).filter(
        (sale) => !isCancelled(sale) && isInRange(sale)
      ),
    [sales, dateRange]
  );

  const filteredPurchases = useMemo(
    () =>
      (Array.isArray(purchases) ? purchases : []).filter(
        (purchase) => !isCancelled(purchase) && isInRange(purchase)
      ),
    [purchases, dateRange]
  );

  const filteredExpenses = useMemo(
    () =>
      (Array.isArray(expenses) ? expenses : []).filter(isInRange),
    [expenses, dateRange]
  );

  const totalSales = filteredSales.reduce(
    (sum, sale) => sum + getAmount(sale),
    0
  );

  const totalPurchases = filteredPurchases.reduce(
    (sum, purchase) => sum + getAmount(purchase),
    0
  );

  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + getAmount(expense),
    0
  );

  const averageSale =
    filteredSales.length > 0 ? totalSales / filteredSales.length : 0;

  const lowStockCount = (Array.isArray(products) ? products : []).filter(
    (product) =>
      toNumber(product?.stock ?? product?.quantity) <=
      toNumber(product?.lowStockThreshold ?? product?.minStock ?? 5)
  ).length;

  // Match sale-item costs to the current product catalogue when possible.
  // This is an estimate, not historical accounting.
  const productCosts = new Map(
    (Array.isArray(products) ? products : []).map((product) => [
      String(product.id),
      toNumber(
        product.costPrice ??
          product.purchasePrice ??
          product.cost ??
          0
      ),
    ])
  );

  const estimatedCostOfGoods = filteredSales.reduce((sum, sale) => {
    const items = getSaleItems(sale);

    return (
      sum +
      items.reduce((itemSum, item) => {
        const productId = item.productId ?? item.product?.id ?? item.id;
        const recordedCost = getItemCost(item);
        const currentProductCost = productCosts.get(String(productId)) ?? 0;
        const cost = recordedCost || currentProductCost;

        return itemSum + cost * getItemQuantity(item);
      }, 0)
    );
  }, 0);

  const estimatedGrossProfit = totalSales - estimatedCostOfGoods;
  const estimatedNetResult =
    estimatedGrossProfit - totalExpenses;

  const chartData = useMemo(() => {
    if (!dateRange.valid) return [];

    const dayMap = new Map();
    const current = new Date(dateRange.start);
    const last = new Date(dateRange.end);

    // Limit the daily chart to the latest 90 days for readability.
    const daysDifference = Math.ceil(
      (last.getTime() - current.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (daysDifference > 90) {
      current.setTime(last.getTime() - 89 * 24 * 60 * 60 * 1000);
      current.setHours(0, 0, 0, 0);
    }

    while (current <= last) {
      const key = getLocalDateString(current);

      dayMap.set(key, {
        date: key,
        label: formatShortDate(current),
        sales: 0,
        purchases: 0,
        expenses: 0,
      });

      current.setDate(current.getDate() + 1);
    }

    const addRecords = (records, field) => {
      records.forEach((record) => {
        const date = getRecordDate(record);

        if (!date) return;

        const key = getLocalDateString(date);
        const row = dayMap.get(key);

        if (row) row[field] += getAmount(record);
      });
    };

    addRecords(filteredSales, "sales");
    addRecords(filteredPurchases, "purchases");
    addRecords(filteredExpenses, "expenses");

    return Array.from(dayMap.values());
  }, [
    dateRange,
    filteredSales,
    filteredPurchases,
    filteredExpenses,
  ]);

  const expenseBreakdown = useMemo(() => {
    const categories = new Map();

    filteredExpenses.forEach((expense) => {
      const category = expense.category || "Other";
      categories.set(
        category,
        (categories.get(category) || 0) + getAmount(expense)
      );
    });

    return Array.from(categories, ([name, value]) => ({
      name,
      value,
    })).sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  const purchaseStatusData = useMemo(() => {
    const statuses = new Map();

    filteredPurchases.forEach((purchase) => {
      const status = purchase.status || "Unknown";

      statuses.set(
        status,
        (statuses.get(status) || 0) + getAmount(purchase)
      );
    });

    return Array.from(statuses, ([name, value]) => ({
      name,
      value,
    }));
  }, [filteredPurchases]);

  const handleExport = () => {
    const rows = [
      ["Report Type", "Date", "Reference", "Status", "Amount"],
      ...filteredSales.map((sale) => [
        "Sale",
        getRecordDate(sale)?.toLocaleDateString() || "",
        sale.invoiceNumber || sale.invoiceNo || sale.id || "",
        sale.status || "Completed",
        getAmount(sale),
      ]),
      ...filteredPurchases.map((purchase) => [
        "Purchase",
        getRecordDate(purchase)?.toLocaleDateString() || "",
        purchase.purchaseNumber || purchase.reference || purchase.id || "",
        purchase.status || "",
        getAmount(purchase),
      ]),
      ...filteredExpenses.map((expense) => [
        "Expense",
        getRecordDate(expense)?.toLocaleDateString() || "",
        expense.title || expense.description || expense.id || "",
        expense.category || "",
        getAmount(expense),
      ]),
    ];

    downloadCsv("pasalos-report.csv", rows);
  };

  const handleReset = () => {
    setPeriod("30");
    setCustomStart(
      getLocalDateString(
        new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
      )
    );
    setCustomEnd(getLocalDateString(new Date()));
  };

  const tooltipFormatter = (value) => formatCurrency(value);

  if (!dateRange.valid) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <h2 className="font-semibold">Invalid date range</h2>
        <p className="mt-1 text-sm">
          The start date must be before or equal to the end date.
        </p>
        <button
          onClick={handleReset}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
        >
          Reset dates
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={28} />
            <h1 className="text-2xl font-bold text-gray-900">
              Reports & Analytics
            </h1>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Understand your sales, purchases, expenses, and business performance.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Date filters */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <CalendarDays size={17} />
              Reporting period
            </label>

            <div className="flex flex-wrap gap-2">
              {[
                ["today", "Today"],
                ["7", "Last 7 days"],
                ["30", "Last 30 days"],
                ["all", "All time"],
                ["custom", "Custom range"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setPeriod(value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    period === value
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {period === "custom" && (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Start date
                </label>
                <input
                  type="date"
                  value={customStart}
                  max={customEnd || undefined}
                  onChange={(event) => setCustomStart(event.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  End date
                </label>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart || undefined}
                  max={today}
                  onChange={(event) => setCustomEnd(event.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 self-start text-sm font-medium text-gray-600 hover:text-blue-600 lg:self-auto"
          >
            <RefreshCw size={15} />
            Reset filters
          </button>
        </div>
      </section>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Sales"
          value={formatCurrency(totalSales)}
          subtitle={`${filteredSales.length} transaction(s)`}
          icon={TrendingUp}
          color="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Total Purchases"
          value={formatCurrency(totalPurchases)}
          subtitle={`${filteredPurchases.length} purchase(s)`}
          icon={ShoppingCart}
          color="bg-purple-50 text-purple-600"
        />

        <StatCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          subtitle={`${filteredExpenses.length} expense record(s)`}
          icon={Wallet}
          color="bg-orange-50 text-orange-600"
        />

        <StatCard
          title="Average Sale"
          value={formatCurrency(averageSale)}
          subtitle="Average value per transaction"
          icon={Receipt}
          color="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Financial overview */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Financial Overview
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            A simplified view of sales, estimated product costs, and expenses.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-sm text-blue-700">Sales Revenue</p>
            <p className="mt-2 text-xl font-bold text-blue-900">
              {formatCurrency(totalSales)}
            </p>
          </div>

          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-sm text-amber-700">Estimated Product Costs</p>
            <p className="mt-2 text-xl font-bold text-amber-900">
              {formatCurrency(estimatedCostOfGoods)}
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">
              Estimated Gross Profit
            </p>
            <p
              className={`mt-2 text-xl font-bold ${
                estimatedGrossProfit < 0
                  ? "text-red-700"
                  : "text-emerald-900"
              }`}
            >
              {formatCurrency(estimatedGrossProfit)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-2 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-gray-800">
              Estimated result after recorded expenses
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Gross profit minus recorded expenses; excludes other unrecorded costs.
            </p>
          </div>

          <p
            className={`text-xl font-bold ${
              estimatedNetResult < 0 ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {formatCurrency(estimatedNetResult)}
          </p>
        </div>

        <p className="mt-3 text-xs leading-5 text-gray-500">
          Note: Product costs are estimated using the cost saved on sale items
          or the current product catalogue. If no cost is available, that
          item's cost is treated as zero. Historical profit may therefore
          differ from actual profit.
        </p>
      </section>

      {/* Sales, purchases and expenses chart */}
      <ChartCard
        title="Business Activity"
        subtitle="Daily sales, purchases, and expenses for the selected period"
      >
        {chartData.some(
          (row) => row.sales || row.purchases || row.expenses
        ) ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  minTickGap={20}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `Rs. ${value}`}
                  width={85}
                />
                <Tooltip formatter={tooltipFormatter} />
                <Legend />
                <Bar
                  dataKey="sales"
                  name="Sales"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="purchases"
                  name="Purchases"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="No sales, purchases, or expenses found in this period." />
        )}
      </ChartCard>

      {/* Expense and purchase charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Expenses by Category"
          subtitle="Which categories account for your spending?"
        >
          {expenseBreakdown.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={45}
                    paddingAngle={3}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={tooltipFormatter} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="No expense records found in this period." />
          )}
        </ChartCard>

        <ChartCard
          title="Purchase Status"
          subtitle="Purchase value grouped by its current status"
        >
          {purchaseStatusData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={purchaseStatusData}
                  margin={{ top: 10, right: 10, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `Rs. ${value}`}
                    width={85}
                  />
                  <Tooltip formatter={tooltipFormatter} />
                  <Bar
                    dataKey="value"
                    name="Purchase Value"
                    fill="#8b5cf6"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="No purchase records found in this period." />
          )}
        </ChartCard>
      </div>

      {/* Report details */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-gray-900">
              Report Summary
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Totals for the selected reporting period
            </p>
          </div>

          <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600">
            {filteredSales.length +
              filteredPurchases.length +
              filteredExpenses.length}{" "}
            records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Report</th>
                <th className="px-5 py-4 font-semibold">Records</th>
                <th className="px-5 py-4 font-semibold">Total Amount</th>
                <th className="px-5 py-4 font-semibold">Details</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-5 py-4 font-medium text-gray-800">
                  Sales
                </td>
                <td className="px-5 py-4 text-gray-600">
                  {filteredSales.length}
                </td>
                <td className="px-5 py-4 font-semibold text-blue-600">
                  {formatCurrency(totalSales)}
                </td>
                <td className="px-5 py-4 text-gray-500">
                  Average: {formatCurrency(averageSale)}
                </td>
              </tr>

              <tr>
                <td className="px-5 py-4 font-medium text-gray-800">
                  Purchases
                </td>
                <td className="px-5 py-4 text-gray-600">
                  {filteredPurchases.length}
                </td>
                <td className="px-5 py-4 font-semibold text-purple-600">
                  {formatCurrency(totalPurchases)}
                </td>
                <td className="px-5 py-4 text-gray-500">
                  Includes non-cancelled purchases
                </td>
              </tr>

              <tr>
                <td className="px-5 py-4 font-medium text-gray-800">
                  Expenses
                </td>
                <td className="px-5 py-4 text-gray-600">
                  {filteredExpenses.length}
                </td>
                <td className="px-5 py-4 font-semibold text-orange-600">
                  {formatCurrency(totalExpenses)}
                </td>
                <td className="px-5 py-4 text-gray-500">
                  {expenseBreakdown.length} expense categories
                </td>
              </tr>

              <tr>
                <td className="px-5 py-4 font-medium text-gray-800">
                  Inventory
                </td>
                <td className="px-5 py-4 text-gray-600">
                  {(Array.isArray(products) ? products : []).length} products
                </td>
                <td className="px-5 py-4 font-semibold text-amber-600">
                  {lowStockCount} low-stock products
                </td>
                <td className="px-5 py-4 text-gray-500">
                  Uses each product's low-stock threshold, defaulting to 5
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <Package className="mt-0.5 shrink-0 text-blue-600" size={20} />
        <div>
          <h3 className="text-sm font-semibold text-blue-900">
            Report data is stored locally
          </h3>
          <p className="mt-1 text-sm leading-6 text-blue-800">
            These reports use the data currently saved by your PasalOS
            frontend. Once the Node.js and MySQL backend is connected, the
            reporting module can be upgraded to use centralized business data.
          </p>
        </div>
      </div>
    </div>
  );
}