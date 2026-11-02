
import { useEffect, useState } from "react";

import {
  Store,
  Save,
  RotateCcw,
  Building2,
  Receipt,
  Package,
  Bell,
  CheckCircle2,
  AlertCircle,
  Eye,
  Settings as SettingsIcon,
  UserRound,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

// ==========================================
// SETTINGS CONFIGURATION
// ==========================================

const SETTINGS_STORAGE_KEY = "pasalos-settings";

const defaultSettings = {
  storeName: "My Pasal",
  ownerName: "",
  phone: "",
  email: "",
  address: "",
  currency: "NPR",
  vatEnabled: true,
  vatRate: 13,
  lowStockThreshold: 5,
  invoicePrefix: "PAS",
  invoiceFooter: "Thank you for shopping with us!",
  lowStockNotifications: true,
  outOfStockNotifications: true,
  purchaseNotifications: true,
  expenseNotifications: true,
};

// ==========================================
// LOAD SETTINGS FROM LOCAL STORAGE
// ==========================================

const loadSettings = () => {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!saved) return { ...defaultSettings };

    const parsed = JSON.parse(saved);

    return {
      ...defaultSettings,
      ...(parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {}),
    };
  } catch {
    return { ...defaultSettings };
  }
};

// ==========================================
// SETTINGS SIDEBAR SECTIONS
// ==========================================

const sections = [
  {
    id: "store",
    label: "Store Information",
    icon: Building2,
  },
  {
    id: "account",
    label: "Account",
    icon: UserRound,
  },
  {
    id: "tax",
    label: "Tax & Currency",
    icon: Receipt,
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Package,
  },
  {
    id: "invoice",
    label: "Invoice",
    icon: Receipt,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
  },
];

// ==========================================
// REUSABLE SETTINGS FIELD
// ==========================================

function SettingsField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  min,
  max,
  step,
  help,
  disabled = false,
  autoComplete,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-100"
      />

      {help && (
        <p className="mt-1.5 text-xs text-gray-500">
          {help}
        </p>
      )}
    </div>
  );
}

// ==========================================
// REUSABLE TOGGLE SETTING
// ==========================================

function ToggleSetting({
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <h4 className="text-sm font-medium text-gray-900">
          {title}
        </h4>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
          checked ? "bg-indigo-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

// ==========================================
// FEEDBACK MESSAGE
// ==========================================

function FeedbackMessage({ feedback }) {
  if (!feedback) return null;

  const isSuccess = feedback.type === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 rounded-lg border p-4 ${
        isSuccess
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 size={20} className="shrink-0" />
      ) : (
        <AlertCircle size={20} className="shrink-0" />
      )}

      <p className="text-sm font-medium">
        {feedback.message}
      </p>
    </div>
  );
}

// ==========================================
// MAIN SETTINGS COMPONENT
// ==========================================

export default function Settings() {
  // Authentication context
  const {
    user,
    updateProfile,
    changePassword,
  } = useAuth();

  // Store settings
  const [settings, setSettings] = useState(loadSettings);

  // Navigation
  const [activeSection, setActiveSection] = useState("store");

  // General feedback
  const [feedback, setFeedback] = useState(null);

  // Invoice preview
  const [showPreview, setShowPreview] = useState(false);

  // Account profile
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Independent loading states
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // ========================================
  // SYNC PROFILE WITH AUTH CONTEXT
  // ========================================

  useEffect(() => {
    setProfileForm({
      full_name: user?.full_name || "",
      email: user?.email || "",
    });
  }, [user]);

  // ========================================
  // CLEAR FEEDBACK AUTOMATICALLY
  // ========================================

  useEffect(() => {
    if (!feedback) return undefined;

    const timer = setTimeout(() => {
      setFeedback(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [feedback]);

  // ========================================
  // STORE SETTINGS HANDLERS
  // ========================================

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setSettings((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? value === ""
              ? ""
              : Number(value)
            : value,
    }));
  };

  const updateSetting = (name, value) => {
    setSettings((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ========================================
  // SAVE STORE SETTINGS
  // ========================================

  const saveSettings = (event) => {
    event.preventDefault();

    if (!settings.storeName.trim()) {
      setFeedback({
        type: "error",
        message: "Please enter a store name.",
      });

      setActiveSection("store");
      return;
    }

    if (
      settings.vatRate === "" ||
      !Number.isFinite(Number(settings.vatRate)) ||
      Number(settings.vatRate) < 0 ||
      Number(settings.vatRate) > 100
    ) {
      setFeedback({
        type: "error",
        message: "VAT must be between 0 and 100.",
      });

      setActiveSection("tax");
      return;
    }

    if (
      settings.lowStockThreshold === "" ||
      !Number.isFinite(Number(settings.lowStockThreshold)) ||
      Number(settings.lowStockThreshold) < 0
    ) {
      setFeedback({
        type: "error",
        message: "The low-stock threshold cannot be negative or empty.",
      });

      setActiveSection("inventory");
      return;
    }

    if (!settings.invoicePrefix.trim()) {
      setFeedback({
        type: "error",
        message: "Please enter an invoice prefix.",
      });

      setActiveSection("invoice");
      return;
    }

    try {
      const updatedSettings = {
        ...settings,
        storeName: settings.storeName.trim(),
        invoicePrefix: settings.invoicePrefix.trim(),
        vatRate: Number(settings.vatRate),
        lowStockThreshold: Number(settings.lowStockThreshold),
      };

      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(updatedSettings)
      );

      setSettings(updatedSettings);

      setFeedback({
        type: "success",
        message: "Settings saved successfully!",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Unable to save settings in this browser.",
      });
    }
  };

  // ========================================
  // RESET STORE SETTINGS
  // ========================================

  const resetSettings = () => {
    const confirmed = window.confirm(
      "Reset all store preferences to their default values? Your saved preferences will be replaced. Account information will not be changed."
    );

    if (!confirmed) return;

    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(defaultSettings)
      );

      setSettings({ ...defaultSettings });
      setShowPreview(false);

      setFeedback({
        type: "success",
        message: "Store settings have been reset to defaults.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Unable to reset settings in this browser.",
      });
    }
  };

  // ========================================
  // PROFILE FORM HANDLERS
  // ========================================

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfileForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    const fullName = profileForm.full_name.trim();
    const email = profileForm.email.trim().toLowerCase();

    if (!fullName || !email) {
      setFeedback({
        type: "error",
        message: "Please enter your full name and email address.",
      });
      return;
    }

    if (fullName.length > 150) {
      setFeedback({
        type: "error",
        message: "Your name cannot exceed 150 characters.",
      });
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setFeedback({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setProfileLoading(true);

    try {
      await updateProfile({
        full_name: fullName,
        email,
      });

      setFeedback({
        type: "success",
        message: "Your profile has been updated successfully!",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to update your profile. Please try again.",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // ========================================
  // PASSWORD FORM HANDLERS
  // ========================================

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    const {
      current_password,
      new_password,
      confirm_password,
    } = passwordForm;

    if (!current_password || !new_password || !confirm_password) {
      setFeedback({
        type: "error",
        message: "Please fill in all password fields.",
      });
      return;
    }

    if (new_password.length < 8) {
      setFeedback({
        type: "error",
        message: "New password must contain at least 8 characters.",
      });
      return;
    }

    if (new_password.length > 72) {
      setFeedback({
        type: "error",
        message: "New password cannot exceed 72 characters.",
      });
      return;
    }

    if (new_password !== confirm_password) {
      setFeedback({
        type: "error",
        message: "New password and confirmation do not match.",
      });
      return;
    }

    if (new_password === current_password) {
      setFeedback({
        type: "error",
        message: "Your new password must be different from your current password.",
      });
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await changePassword({
        current_password,
        new_password,
        confirm_password,
      });

      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      setFeedback({
        type: "success",
        message:
          response?.message || "Password changed successfully.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to change password. Please check your current password.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // ========================================
  // CURRENCY FORMATTER
  // ========================================

  const money = (amount) => {
    try {
      return new Intl.NumberFormat("en-NP", {
        style: "currency",
        currency: settings.currency || "NPR",
        maximumFractionDigits: 2,
      }).format(Number(amount) || 0);
    } catch {
      return `NPR ${(Number(amount) || 0).toFixed(2)}`;
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* ================================== */}
      {/* PAGE HEADING */}
      {/* ================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
            <SettingsIcon size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Settings
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage your account, store preferences, and business configuration.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={resetSettings}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <RotateCcw size={16} />
            Reset defaults
          </button>

          <button
            type="submit"
            form="pasalos-settings-form"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <Save size={16} />
            Save settings
          </button>

        </div>
      </div>

      {/* ================================== */}
      {/* FEEDBACK */}
      {/* ================================== */}

      <FeedbackMessage feedback={feedback} />

      {/* ================================== */}
      {/* SETTINGS FORM */}
      {/* ================================== */}

      <form
        id="pasalos-settings-form"
        onSubmit={saveSettings}
      >
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">

          {/* ================================== */}
          {/* SIDEBAR */}
          {/* ================================== */}

          <aside className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">

            <p className="px-3 pb-3 pt-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Settings Menu
            </p>

            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={19} />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ================================== */}
          {/* MAIN CONTENT */}
          {/* ================================== */}

          <div className="space-y-6 lg:col-span-3">

            {/* ================================== */}
            {/* ACCOUNT SECTION */}
            {/* ================================== */}

            {activeSection === "account" && (
              <div className="space-y-6">

                {/* PROFILE INFORMATION */}

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                  <div className="flex items-center gap-3 border-b border-gray-200 p-5">

                    <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
                      <UserRound size={21} />
                    </div>

                    <div>
                      <h2 className="font-semibold text-gray-900">
                        Profile Information
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Manage your personal account information.
                      </p>
                    </div>

                  </div>

                  <div className="space-y-5 p-5">

                    <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white">
                        {(user?.full_name || "U")
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-gray-900">
                          {user?.full_name || "User"}
                        </h3>

                        <p className="truncate text-sm text-gray-500">
                          {user?.email || "No email available"}
                        </p>

                        <span className="mt-1 inline-flex rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium capitalize text-indigo-700">
                          {user?.role || "User"}
                        </span>
                      </div>

                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                      <SettingsField
                        label="Full name"
                        name="full_name"
                        value={profileForm.full_name}
                        onChange={handleProfileChange}
                        placeholder="Enter your full name"
                        required
                        autoComplete="name"
                      />

                      <SettingsField
                        label="Email address"
                        name="email"
                        type="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        placeholder="Enter your email"
                        required
                        autoComplete="email"
                      />

                    </div>

                    <div className="rounded-lg bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                      Your account information is saved to the PasalOS backend.
                      Updating your profile also synchronizes the information
                      displayed in your Topbar.
                    </div>

                    <div className="flex justify-end">

                      <button
                        type="button"
                        onClick={handleProfileSubmit}
                        disabled={profileLoading || passwordLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Save size={16} />

                        {profileLoading
                          ? "Updating profile..."
                          : "Update Profile"}
                      </button>

                    </div>

                  </div>
                </section>

                {/* CHANGE PASSWORD */}

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                  <div className="flex items-center gap-3 border-b border-gray-200 p-5">

                    <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                      <LockKeyhole size={21} />
                    </div>

                    <div>
                      <h2 className="font-semibold text-gray-900">
                        Change Password
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Update your account password securely.
                      </p>
                    </div>

                  </div>

                  <div className="space-y-5 p-5">

                    <SettingsField
                      label="Current password"
                      name="current_password"
                      type="password"
                      value={passwordForm.current_password}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      required
                      autoComplete="current-password"
                    />

                    <SettingsField
                      label="New password"
                      name="new_password"
                      type="password"
                      value={passwordForm.new_password}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      required
                      min="8"
                      max="72"
                      autoComplete="new-password"
                      help="Use at least 8 characters. Maximum 72 characters."
                    />

                    <SettingsField
                      label="Confirm new password"
                      name="confirm_password"
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={handlePasswordChange}
                      placeholder="Confirm your new password"
                      required
                      autoComplete="new-password"
                    />

                    <div className="rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                      <div className="flex items-start gap-2">
                        <ShieldCheck size={19} className="mt-0.5 shrink-0" />

                        <p>
                          Never share your password with anyone. Choose a
                          strong password that you do not use on other websites.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">

                      <button
                        type="button"
                        onClick={handlePasswordSubmit}
                        disabled={passwordLoading || profileLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <LockKeyhole size={16} />

                        {passwordLoading
                          ? "Changing password..."
                          : "Change Password"}
                      </button>

                    </div>

                  </div>
                </section>

              </div>
            )}

            {/* ================================== */}
            {/* STORE INFORMATION */}
            {/* ================================== */}

            {activeSection === "store" && (
              <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="flex items-center gap-3 border-b border-gray-200 p-5">

                  <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                    <Store size={21} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Store Information
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Basic details about your business.
                    </p>
                  </div>

                </div>

                <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">

                  <SettingsField
                    label="Store name"
                    name="storeName"
                    value={settings.storeName}
                    onChange={handleChange}
                    placeholder="e.g. Kathmandu General Store"
                    required
                  />

                  <SettingsField
                    label="Owner name"
                    name="ownerName"
                    value={settings.ownerName}
                    onChange={handleChange}
                    placeholder="Enter owner's name"
                  />

                  <SettingsField
                    label="Phone number"
                    name="phone"
                    type="tel"
                    value={settings.phone}
                    onChange={handleChange}
                    placeholder="98XXXXXXXX"
                  />

                  <SettingsField
                    label="Email address"
                    name="email"
                    type="email"
                    value={settings.email}
                    onChange={handleChange}
                    placeholder="store@example.com"
                  />

                  <div className="sm:col-span-2">

                    <label
                      htmlFor="address"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Store address
                    </label>

                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      value={settings.address}
                      onChange={handleChange}
                      placeholder="Enter your store address"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />

                  </div>

                </div>
              </section>
            )}

            {/* ================================== */}
            {/* TAX AND CURRENCY */}
            {/* ================================== */}

            {activeSection === "tax" && (
              <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 p-5">

                  <h2 className="font-semibold text-gray-900">
                    Tax & Currency
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Configure how monetary values are displayed and how VAT
                    preferences are stored.
                  </p>

                </div>

                <div className="space-y-5 p-5">

                  <div>

                    <label
                      htmlFor="currency"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Currency
                    </label>

                    <select
                      id="currency"
                      name="currency"
                      value={settings.currency}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="NPR">
                        Nepalese Rupee (NPR)
                      </option>

                      <option value="INR">
                        Indian Rupee (INR)
                      </option>

                      <option value="USD">
                        US Dollar (USD)
                      </option>
                    </select>

                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">

                    <ToggleSetting
                      title="Enable VAT"
                      description="Store whether VAT should be enabled for your business."
                      checked={settings.vatEnabled}
                      onChange={(value) =>
                        updateSetting("vatEnabled", value)
                      }
                    />

                    <div className="border-t border-gray-100 pt-4">

                      <SettingsField
                        label="VAT percentage"
                        name="vatRate"
                        type="number"
                        value={settings.vatRate}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        step="0.1"
                        help="Default is 13%. This setting does not yet change POS calculations."
                      />

                    </div>

                  </div>

                  <div className="rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-800">

                    <strong>Important:</strong> These are application
                    preferences, not tax or accounting advice. Confirm the
                    applicable tax treatment for your business. VAT settings
                    will need to be connected to the POS and invoice logic
                    separately.

                  </div>

                </div>
              </section>
            )}

            {/* ================================== */}
            {/* INVENTORY SETTINGS */}
            {/* ================================== */}

            {activeSection === "inventory" && (
              <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="flex items-center gap-3 border-b border-gray-200 p-5">

                  <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                    <Package size={21} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Inventory Settings
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Configure the default stock alert threshold.
                    </p>
                  </div>

                </div>

                <div className="space-y-5 p-5">

                  <SettingsField
                    label="Default low-stock threshold"
                    name="lowStockThreshold"
                    type="number"
                    value={settings.lowStockThreshold}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    help="Products at or below this quantity should be reviewed."
                  />

                  <div className="rounded-lg bg-blue-50 p-4 text-sm leading-6 text-blue-800">

                    <strong>Current preference:</strong> Alert when stock is at
                    or below {settings.lowStockThreshold || 0} units.

                    <p className="mt-1">
                      This preference is saved here. Your existing inventory
                      and notification modules still use their current
                      thresholds until we connect them to this setting.
                    </p>

                  </div>

                </div>
              </section>
            )}

            {/* ================================== */}
            {/* INVOICE SETTINGS */}
            {/* ================================== */}

            {activeSection === "invoice" && (
              <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="flex items-center gap-3 border-b border-gray-200 p-5">

                  <div className="rounded-lg bg-green-100 p-2 text-green-700">
                    <Receipt size={21} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Invoice Settings
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Customize basic receipt information.
                    </p>
                  </div>

                </div>

                <div className="space-y-5 p-5">

                  <SettingsField
                    label="Invoice prefix"
                    name="invoicePrefix"
                    value={settings.invoicePrefix}
                    onChange={handleChange}
                    placeholder="PAS"
                    required
                    help="Example: PAS-1001. Existing invoice numbers will not change automatically."
                  />

                  <div>

                    <label
                      htmlFor="invoiceFooter"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Invoice footer message
                    </label>

                    <textarea
                      id="invoiceFooter"
                      name="invoiceFooter"
                      rows={3}
                      value={settings.invoiceFooter}
                      onChange={handleChange}
                      placeholder="Thank you for shopping with us!"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowPreview((previous) => !previous)
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-4 py-2.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
                  >
                    <Eye size={17} />

                    {showPreview
                      ? "Hide preview"
                      : "Preview invoice details"}
                  </button>

                  {showPreview && (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">

                      <div className="text-center">

                        <h3 className="text-xl font-bold text-gray-900">
                          {settings.storeName || "My Pasal"}
                        </h3>

                        {settings.address && (
                          <p className="mt-1 text-sm text-gray-600">
                            {settings.address}
                          </p>
                        )}

                        {settings.phone && (
                          <p className="mt-1 text-sm text-gray-600">
                            Phone: {settings.phone}
                          </p>
                        )}

                        {settings.email && (
                          <p className="mt-1 text-sm text-gray-600">
                            Email: {settings.email}
                          </p>
                        )}

                        <div className="my-4 border-t border-dashed border-gray-300" />

                        <p className="text-sm font-semibold text-gray-800">
                          Invoice: {settings.invoicePrefix || "PAS"}-1001
                        </p>

                        <p className="mt-3 text-sm text-gray-500">
                          Sample total: {money(1000)}
                        </p>

                        <p className="mt-2 text-xs text-gray-500">
                          {settings.vatEnabled
                            ? `VAT preference: ${settings.vatRate}%`
                            : "VAT preference: Disabled"}
                        </p>

                        <p className="mt-4 text-sm text-gray-700">
                          {settings.invoiceFooter ||
                            "Thank you for shopping with us!"}
                        </p>

                      </div>
                    </div>
                  )}

                </div>
              </section>
            )}

            {/* ================================== */}
            {/* NOTIFICATION SETTINGS */}
            {/* ================================== */}

            {activeSection === "notifications" && (
              <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="flex items-center gap-3 border-b border-gray-200 p-5">

                  <div className="rounded-lg bg-purple-100 p-2 text-purple-700">
                    <Bell size={21} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Notification Preferences
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Choose which notification types you prefer to receive.
                    </p>
                  </div>

                </div>

                <div className="divide-y divide-gray-100 px-5">

                  <ToggleSetting
                    title="Low-stock alerts"
                    description="Receive alerts when products are running low."
                    checked={settings.lowStockNotifications}
                    onChange={(value) =>
                      updateSetting("lowStockNotifications", value)
                    }
                  />

                  <ToggleSetting
                    title="Out-of-stock alerts"
                    description="Highlight products that have no stock remaining."
                    checked={settings.outOfStockNotifications}
                    onChange={(value) =>
                      updateSetting("outOfStockNotifications", value)
                    }
                  />

                  <ToggleSetting
                    title="Purchase reminders"
                    description="Show reminders for purchases awaiting receipt."
                    checked={settings.purchaseNotifications}
                    onChange={(value) =>
                      updateSetting("purchaseNotifications", value)
                    }
                  />

                  <ToggleSetting
                    title="Expense updates"
                    description="Show notifications for recently recorded expenses."
                    checked={settings.expenseNotifications}
                    onChange={(value) =>
                      updateSetting("expenseNotifications", value)
                    }
                  />

                </div>

                <div className="border-t border-gray-200 p-5">

                  <p className="text-xs leading-5 text-gray-500">
                    These preferences are saved locally. They will affect the
                    actual notification list after we connect the notification
                    module to these settings.
                  </p>

                </div>
              </section>
            )}

            {/* ================================== */}
            {/* FOOTER ACTIONS */}
            {/* ================================== */}

            {activeSection !== "account" && (
              <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-sm text-gray-500">
                  Remember to save your changes before leaving this page.
                </p>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  <Save size={16} />
                  Save settings
                </button>

              </div>
            )}

          </div>
        </div>
      </form>

      {/* ================================== */}
      {/* PAGE FOOTER */}
      {/* ================================== */}

      <p className="text-xs leading-5 text-gray-500">
        Account profile and password changes are managed through the backend.
        Store preferences, tax, inventory, invoice, and notification settings
        are currently stored in this browser using localStorage.
      </p>

    </div>
  );
}
