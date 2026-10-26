import {
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
} from 'lucide-react'

import { stats, recentTransactions } from '../data/mockData'
import { formatCurrency } from '../utils/currency'
import StatCard from '../components/dashboard/StatCard'
import SalesChart from '../components/dashboard/SalesChart'
import LowStockList from '../components/dashboard/LowStockList'

export default function Dashboard() {
  return (
    <div className="dashboard">
      <section className="welcome-section">
        <div>
          <p className="welcome-eyebrow">YOUR BUSINESS AT A GLANCE</p>
          <h2>Welcome back, Admin! 👋</h2>
          <p>Here's what's happening with your store today.</p>
        </div>

        <div className="date-chip">
          <CalendarDays size={17} />
          {new Date().toLocaleDateString('en-NP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </section>

      <section className="dashboard-middle">
        <SalesChart />
        <LowStockList />
      </section>

      <section className="panel transactions-panel">
        <div className="panel-heading">
          <div>
            <h3>Recent Transactions</h3>
            <p>A quick look at your latest sales</p>
          </div>

          <a href="/sales" className="panel-link">
            View all <ArrowUpRight size={16} />
          </a>
        </div>

        <div className="table-wrapper">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {recentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>
                    <div className="invoice-cell">
                      <div className="invoice-icon">
                        <ShoppingBag size={17} />
                      </div>
                      <strong>{transaction.id}</strong>
                    </div>
                  </td>

                  <td>{transaction.customer}</td>

                  <td>
                    {new Date(
                      `${transaction.date}T12:00:00`,
                    ).toLocaleDateString('en-NP', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>

                  <td className="amount-cell">
                    {formatCurrency(transaction.amount)}
                  </td>

                  <td>
                    <span
                      className={`status-badge ${
                        transaction.status === 'Completed'
                          ? 'status-completed'
                          : 'status-pending'
                      }`}
                    >
                      {transaction.status === 'Completed' ? (
                        <ArrowUpRight size={13} />
                      ) : (
                        <ArrowDownRight size={13} />
                      )}
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}