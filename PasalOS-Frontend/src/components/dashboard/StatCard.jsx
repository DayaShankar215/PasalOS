import {
  TrendingUp,
  Package,
  Wallet,
  AlertTriangle,
} from 'lucide-react'
import { formatCurrency } from '../../utils/currency'

const iconMap = {
  sales: Wallet,
  revenue: TrendingUp,
  products: Package,
  stock: AlertTriangle,
}

export default function StatCard({ stat }) {
  const Icon = iconMap[stat.icon]
  const isWarning = stat.icon === 'stock'

  const displayValue =
    stat.icon === 'products' || isWarning
      ? stat.value.toLocaleString('en-NP')
      : formatCurrency(stat.value)

  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <div className={`stat-icon stat-icon-${stat.color}`}>
          <Icon size={22} />
        </div>

        {!isWarning && (
          <span className="stat-change">
            <TrendingUp size={13} />
            {stat.change}
          </span>
        )}
      </div>

      <p className="stat-title">{stat.title}</p>
      <h2 className="stat-value">{displayValue}</h2>

      <p className={`stat-description ${isWarning ? 'warning-text' : ''}`}>
        {isWarning ? stat.change : 'Compared to last week'}
      </p>
    </article>
  )
}