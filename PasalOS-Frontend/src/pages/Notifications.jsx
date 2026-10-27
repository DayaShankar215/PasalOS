import { useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Package,
  PackageX,
  ShoppingCart,
  Receipt,
  Info,
  AlertTriangle,
  Clock,
  Filter,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { usePurchases } from "../hooks/usePurchases";
import { useExpenses } from "../hooks/useExpenses";

const READ_NOTIFICATIONS_KEY = "pasalos-read-notifications";
const DISMISSED_NOTIFICATIONS_KEY = "pasalos-dismissed-notifications";

const readStoredArray = (key) => {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleString();
};

const getPurchaseStatus = (purchase) =>
  String(purchase.status || "").toLowerCase();

const getProductMinimumStock = (product) => {
  const value = Number(
    product.minStock ?? product.minimumStock ?? product.reorderLevel ?? 5,
  );

  return Number.isFinite(value) && value >= 0 ? value : 5;
};

const createNotification = ({
  id,
  type,
  title,
  message,
  date,
  priority = "normal",
}) => ({
  id: String(id),
  type,
  title,
  message,
  date: date || new Date().toISOString(),
  priority,
});

const NotificationIcon = ({ type }) => {
  const iconProps = { size: 20 };

  switch (type) {
    case "out-of-stock":
      return <PackageX {...iconProps} />;
    case "low-stock":
      return <Package {...iconProps} />;
    case "purchase":
      return <ShoppingCart {...iconProps} />;
    case "expense":
      return <Receipt {...iconProps} />;
    default:
      return <Info {...iconProps} />;
  }
};

const getPriorityClasses = (priority) => {
  if (priority === "high") {
    return "bg-red-100 text-red-700";
  }

  if (priority === "medium") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-blue-100 text-blue-700";
};

const getTypeLabel = (type) => {
  switch (type) {
    case "out-of-stock":
      return "Out of stock";
    case "low-stock":
      return "Low stock";
    case "purchase":
      return "Purchase";
    case "expense":
      return "Expense";
    default:
      return "General";
  }
};

export default function Notifications() {
  const [products] = useProducts();
  const [purchases] = usePurchases();
  const [expenses] = useExpenses();

  const [readIds, setReadIds] = useState(() =>
    readStoredArray(READ_NOTIFICATIONS_KEY),
  );

  const [dismissedIds, setDismissedIds] = useState(() =>
    readStoredArray(DISMISSED_NOTIFICATIONS_KEY),
  );

  const [activeFilter, setActiveFilter] = useState("all");

  const allNotifications = useMemo(() => {
    const notifications = [];

    // Out-of-stock and low-stock notifications
    (Array.isArray(products) ? products : []).forEach((product) => {
      const stock = Number(product.stock ?? product.quantity ?? 0);
      const minimumStock = getProductMinimumStock(product);
      const productName = product.name || "Unnamed product";

      if (stock <= 0) {
        notifications.push(
          createNotification({
            id: `out-of-stock-${product.id}`,
            type: "out-of-stock",
            title: "Product out of stock",
            message: `${productName} has no stock remaining.`,
            date: product.updatedAt || product.createdAt,
            priority: "high",
          }),
        );
      } else if (stock <= minimumStock) {
        notifications.push(
          createNotification({
            id: `low-stock-${product.id}`,
            type: "low-stock",
            title: "Low stock alert",
            message: `${productName} has only ${stock} unit(s) remaining.`,
            date: product.updatedAt || product.createdAt,
            priority:
              stock <= Math.max(1, Math.floor(minimumStock / 2))
                ? "high"
                : "medium",
          }),
        );
      }
    });

    // Pending purchases
    (Array.isArray(purchases) ? purchases : []).forEach((purchase) => {
      const status = getPurchaseStatus(purchase);

      if (["pending", "ordered"].includes(status)) {
        notifications.push(
          createNotification({
            id: `pending-purchase-${purchase.id}`,
            type: "purchase",
            title: "Purchase awaiting receipt",
            message: `Purchase ${
              purchase.purchaseNumber || purchase.id
            } is still pending.`,
            date: purchase.date || purchase.createdAt,
            priority: "medium",
          }),
        );
      }
    });

    // Recently recorded expenses
    (Array.isArray(expenses) ? expenses : []).forEach((expense) => {
      const expenseDate = new Date(expense.date || expense.createdAt || 0);

      if (
        !Number.isNaN(expenseDate.getTime()) &&
        Date.now() - expenseDate.getTime() <= 24 * 60 * 60 * 1000 &&
        expenseDate.getTime() <= Date.now()
      ) {
        notifications.push(
          createNotification({
            id: `expense-${expense.id}`,
            type: "expense",
            title: "New expense recorded",
            message: `${expense.title || expense.description || expense.category || "An expense"} was recorded.`,
            date: expense.date || expense.createdAt,
            priority: "normal",
          }),
        );
      }
    });

    return notifications.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [products, purchases, expenses]);

  const visibleNotifications = useMemo(() => {
    return allNotifications.filter(
      (notification) => !dismissedIds.includes(notification.id),
    );
  }, [allNotifications, dismissedIds]);

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "unread") {
      return visibleNotifications.filter(
        (notification) => !readIds.includes(notification.id),
      );
    }

    if (activeFilter === "read") {
      return visibleNotifications.filter((notification) =>
        readIds.includes(notification.id),
      );
    }

    return visibleNotifications;
  }, [visibleNotifications, activeFilter, readIds]);

  const unreadCount = visibleNotifications.filter(
    (notification) => !readIds.includes(notification.id),
  ).length;

  const highPriorityCount = visibleNotifications.filter(
    (notification) => notification.priority === "high",
  ).length;

  const saveReadIds = (updatedIds) => {
    setReadIds(updatedIds);
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(updatedIds));
  };

  const markAsRead = (id) => {
    if (readIds.includes(id)) return;
    saveReadIds([...readIds, id]);
  };

  const markAllAsRead = () => {
    const updatedIds = [
      ...new Set([
        ...readIds,
        ...visibleNotifications.map((notification) => notification.id),
      ]),
    ];

    saveReadIds(updatedIds);
  };

  const dismissNotification = (id) => {
    const updatedIds = [...new Set([...dismissedIds, id])];

    setDismissedIds(updatedIds);
    localStorage.setItem(
      DISMISSED_NOTIFICATIONS_KEY,
      JSON.stringify(updatedIds),
    );
  };

  const clearAllNotifications = () => {
    const updatedIds = [
      ...new Set([
        ...dismissedIds,
        ...visibleNotifications.map((notification) => notification.id),
      ]),
    ];

    setDismissedIds(updatedIds);
    localStorage.setItem(
      DISMISSED_NOTIFICATIONS_KEY,
      JSON.stringify(updatedIds),
    );
  };

  const refreshNotifications = () => {
    // Notifications are derived from the current module data.
    // The next render recalculates them from the existing hooks.
    setActiveFilter((current) => current);
  };

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
              <Bell size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Notifications
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Stay updated with important activity in your store.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refreshNotifications}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck size={16} />
            Mark all as read
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Total notifications
            </p>
            <Bell className="text-indigo-600" size={21} />
          </div>

          <p className="mt-3 text-3xl font-bold text-gray-900">
            {visibleNotifications.length}
          </p>

          <p className="mt-1 text-sm text-gray-500">Current business alerts</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Unread</p>
            <Inbox className="text-blue-600" size={21} />
          </div>

          <p className="mt-3 text-3xl font-bold text-gray-900">{unreadCount}</p>

          <p className="mt-1 text-sm text-gray-500">
            Notifications needing attention
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              High-priority alerts
            </p>
            <AlertTriangle className="text-red-600" size={21} />
          </div>

          <p className="mt-3 text-3xl font-bold text-gray-900">
            {highPriorityCount}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Stock issues requiring attention
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          <Filter size={18} />
          <span className="text-sm font-semibold">Filter notifications</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "All" },
            { value: "unread", label: "Unread" },
            { value: "read", label: "Read" },
          ].map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeFilter === filter.value
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification list */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">
              Recent notifications
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {filteredNotifications.length} notification(s) shown
            </p>
          </div>

          {visibleNotifications.length > 0 && (
            <button
              type="button"
              onClick={clearAllNotifications}
              className="inline-flex items-center gap-2 self-start rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 sm:self-auto"
            >
              <Trash2 size={16} />
              Clear all
            </button>
          )}
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="rounded-full bg-gray-100 p-4 text-gray-400">
              <Inbox size={30} />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              {visibleNotifications.length === 0
                ? "You're all caught up!"
                : "No notifications found"}
            </h3>

            <p className="mt-2 max-w-md text-sm text-gray-500">
              {visibleNotifications.length === 0
                ? "New stock alerts and business updates will appear here when they are available."
                : "Try selecting a different filter to view your notifications."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => {
              const isRead = readIds.includes(notification.id);

              return (
                <div
                  key={notification.id}
                  className={`flex gap-3 p-4 transition hover:bg-gray-50 sm:gap-4 sm:p-5 ${
                    isRead ? "bg-white" : "bg-indigo-50/40"
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      notification.type === "out-of-stock"
                        ? "bg-red-100 text-red-700"
                        : notification.type === "low-stock"
                          ? "bg-amber-100 text-amber-700"
                          : notification.type === "purchase"
                            ? "bg-blue-100 text-blue-700"
                            : notification.type === "expense"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <NotificationIcon type={notification.type} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {notification.title}
                      </h3>

                      {!isRead && (
                        <span className="h-2 w-2 rounded-full bg-indigo-600" />
                      )}
                    </div>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      {notification.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={13} />
                        {formatDate(notification.date)}
                      </span>

                      <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
                        {getTypeLabel(notification.type)}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 font-medium ${getPriorityClasses(
                          notification.priority,
                        )}`}
                      >
                        {notification.priority === "high"
                          ? "High priority"
                          : notification.priority === "medium"
                            ? "Medium priority"
                            : "Normal"}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-center gap-1 sm:flex-row sm:items-start">
                    {!isRead && (
                      <button
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                        aria-label={`Mark ${notification.title} as read`}
                        className="rounded-lg p-2 text-gray-500 hover:bg-green-100 hover:text-green-700"
                      >
                        <Check size={18} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => dismissNotification(notification.id)}
                      title="Dismiss notification"
                      aria-label={`Dismiss ${notification.title}`}
                      className="rounded-lg p-2 text-gray-500 hover:bg-red-100 hover:text-red-700"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs leading-5 text-gray-500">
        Notifications are generated from your current browser data. They are
        stored locally in this browser and will be connected to the backend
        after API integration.
      </p>
    </div>
  );
}
