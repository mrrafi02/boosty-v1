import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Category = {
  id: string;
  platform: string;
  name: string;
  description: string | null;
  status: string;
  sort_order: number | null;
};

type Service = {
  id: string;
  service_id: string;
  platform: string;
  category_id: string;
  name: string;
  description: string | null;
  rate_per_1000: number;
  min_quantity: number;
  max_quantity: number;
  status: string;
};

type Profile = {
  id: string;
  balance: number | null;
};

const PLATFORM_ORDER = [
  "All",
  "Instagram",
  "Facebook",
  "TikTok",
  "YouTube",
  "Twitter",
  "Telegram",
  "LinkedIn",
  "Discord",
  "Spotify",
  "Website",
  "Others",
];

const platformIcons: Record<string, string> = {
  All: "✦",
  Instagram: "◎",
  Facebook: "f",
  TikTok: "♪",
  YouTube: "▶",
  Twitter: "♥",
  Telegram: "➤",
  LinkedIn: "in",
  Discord: "◈",
  Spotify: "●",
  Website: "◉",
  Others: "✧",
};

function formatBDT(value: number) {
  return new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function normalizePlatform(platform: string) {
  const value = platform.trim().toLowerCase();

  if (value === "youtube") return "YouTube";
  if (value === "tiktok") return "TikTok";
  if (value === "instagram") return "Instagram";
  if (value === "facebook") return "Facebook";
  if (value === "twitter" || value === "x") return "Twitter";
  if (value === "telegram") return "Telegram";
  if (value === "linkedin") return "LinkedIn";
  if (value === "discord") return "Discord";
  if (value === "spotify") return "Spotify";
  if (value === "website") return "Website";

  return platform;
}

export default function NewOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const serviceFromUrl = searchParams.get("service");

  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [selectedPlatform, setSelectedPlatform] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");

  const [search, setSearch] = useState("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");

  const [balance, setBalance] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * ---------------------------------------------------------
   * LOAD DATA
   * ---------------------------------------------------------
   */
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        navigate("/login");
        return;
      }

      const [categoriesResult, servicesResult, profileResult] =
        await Promise.all([
          supabase
            .from("categories")
            .select(
              "id, platform, name, description, status, sort_order"
            )
            .eq("status", "active")
            .order("sort_order", {
              ascending: true,
              nullsFirst: false,
            }),

          supabase
            .from("services")
            .select(
              "id, service_id, platform, category_id, name, description, rate_per_1000, min_quantity, max_quantity, status"
            )
            .eq("status", "active")
            .order("service_id", {
              ascending: true,
            }),

          supabase
            .from("profiles")
            .select("id, balance")
            .eq("id", user.id)
            .maybeSingle(),
        ]);

      if (categoriesResult.error) {
        throw categoriesResult.error;
      }

      if (servicesResult.error) {
        throw servicesResult.error;
      }

      setCategories(categoriesResult.data || []);
      setServices(servicesResult.data || []);

      if (profileResult.error) {
        console.warn(
          "Profile balance could not be loaded:",
          profileResult.error.message
        );
      }

      if (profileResult.data) {
        setBalance(Number(profileResult.data.balance || 0));
      }

      /*
       * If URL contains:
       * /new-order?service=UUID
       *
       * automatically select that service.
       */
      if (serviceFromUrl && servicesResult.data) {
        const urlService = servicesResult.data.find(
          (service) =>
            service.id === serviceFromUrl ||
            service.service_id === serviceFromUrl
        );

        if (urlService) {
          setSelectedServiceId(urlService.id);

          const normalized = normalizePlatform(urlService.platform);

          if (
            PLATFORM_ORDER.includes(normalized) &&
            normalized !== "All"
          ) {
            setSelectedPlatform(normalized);
          }

          setSelectedCategory(urlService.category_id);
        }
      }
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to load services. Please refresh the page."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * SELECTED SERVICE
   * ---------------------------------------------------------
   */
  const selectedService = useMemo(() => {
    return (
      services.find((service) => service.id === selectedServiceId) ||
      null
    );
  }, [services, selectedServiceId]);

  /*
   * ---------------------------------------------------------
   * AVAILABLE PLATFORMS
   * ---------------------------------------------------------
   */
  const availablePlatforms = useMemo(() => {
    const found = new Set<string>();

    services.forEach((service) => {
      const platform = normalizePlatform(service.platform);

      if (platform) {
        found.add(platform);
      }
    });

    return PLATFORM_ORDER.filter(
      (platform) =>
        platform === "All" || found.has(platform)
    );
  }, [services]);

  /*
   * ---------------------------------------------------------
   * CATEGORY FILTER
   * ---------------------------------------------------------
   */
  const platformCategories = useMemo(() => {
    return categories.filter((category) => {
      if (selectedPlatform === "All") {
        return true;
      }

      return (
        normalizePlatform(category.platform) ===
        selectedPlatform
      );
    });
  }, [categories, selectedPlatform]);

  /*
   * ---------------------------------------------------------
   * FILTER SERVICES
   * ---------------------------------------------------------
   */
  const filteredServices = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return services.filter((service) => {
      const platformMatch =
        selectedPlatform === "All" ||
        normalizePlatform(service.platform) ===
          selectedPlatform;

      const categoryMatch =
        !selectedCategory ||
        service.category_id === selectedCategory;

      const searchMatch =
        !keyword ||
        service.name.toLowerCase().includes(keyword) ||
        service.service_id.toLowerCase().includes(keyword) ||
        service.platform.toLowerCase().includes(keyword) ||
        (service.description || "")
          .toLowerCase()
          .includes(keyword);

      return (
        platformMatch &&
        categoryMatch &&
        searchMatch
      );
    });
  }, [
    services,
    selectedPlatform,
    selectedCategory,
    search,
  ]);

  /*
   * ---------------------------------------------------------
   * SELECTED SERVICE CHANGE
   * ---------------------------------------------------------
   */
  function handleServiceChange(serviceId: string) {
    setSelectedServiceId(serviceId);
    setError("");
    setSuccess("");

    const service = services.find(
      (item) => item.id === serviceId
    );

    if (!service) {
      return;
    }

    setSelectedCategory(service.category_id);

    const platform = normalizePlatform(service.platform);

    if (
      PLATFORM_ORDER.includes(platform) &&
      platform !== "All"
    ) {
      setSelectedPlatform(platform);
    }

    /*
     * Reset quantity when changing service.
     */
    setQuantity("");
  }

  /*
   * ---------------------------------------------------------
   * PLATFORM CHANGE
   * ---------------------------------------------------------
   */
  function handlePlatformChange(platform: string) {
    setSelectedPlatform(platform);
    setSelectedCategory("");
    setSelectedServiceId("");
    setQuantity("");
    setSearch("");
    setError("");
    setSuccess("");
  }

  /*
   * ---------------------------------------------------------
   * CATEGORY CHANGE
   * ---------------------------------------------------------
   */
  function handleCategoryChange(categoryId: string) {
    setSelectedCategory(categoryId);
    setSelectedServiceId("");
    setQuantity("");
    setError("");
    setSuccess("");
  }

  /*
   * ---------------------------------------------------------
   * QUANTITY
   * ---------------------------------------------------------
   */
  const numericQuantity = Number(quantity || 0);

  const totalCharge = selectedService
    ? (numericQuantity / 1000) *
      Number(selectedService.rate_per_1000 || 0)
    : 0;

  const quantityTooLow =
    selectedService &&
    numericQuantity > 0 &&
    numericQuantity < Number(selectedService.min_quantity);

  const quantityTooHigh =
    selectedService &&
    numericQuantity > Number(selectedService.max_quantity);

  const insufficientBalance =
    totalCharge > balance;

  /*
   * ---------------------------------------------------------
   * CONFIRM ORDER
   * ---------------------------------------------------------
   */
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedService) {
      setError("Please select a service.");
      return;
    }

    if (!link.trim()) {
      setError("Please enter your target link.");
      return;
    }

    if (!quantity) {
      setError("Please enter quantity.");
      return;
    }

    if (!Number.isInteger(numericQuantity)) {
      setError("Quantity must be a whole number.");
      return;
    }

    if (
      numericQuantity <
      Number(selectedService.min_quantity)
    ) {
      setError(
        `Minimum quantity is ${Number(
          selectedService.min_quantity
        ).toLocaleString()}.`
      );
      return;
    }

    if (
      numericQuantity >
      Number(selectedService.max_quantity)
    ) {
      setError(
        `Maximum quantity is ${Number(
          selectedService.max_quantity
        ).toLocaleString()}.`
      );
      return;
    }

    if (totalCharge <= 0) {
      setError("Order charge must be greater than ৳0.00.");
      return;
    }

    if (insufficientBalance) {
      setError(
        `Insufficient balance. You need ৳${formatBDT(
          totalCharge
        )}, but your balance is ৳${formatBDT(balance)}.`
      );
      return;
    }

    /*
     * Basic URL validation.
     */
    try {
      new URL(link.trim());
    } catch {
      setError(
        "Please enter a valid URL, for example https://facebook.com/..."
      );
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        navigate("/login");
        return;
      }

      /*
       * Insert order.
       *
       * Important:
       * service_id in orders references services.id (UUID).
       * rate is read from services.rate_per_1000.
       */
      const { data: order, error: orderError } =
        await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            service_id: selectedService.id,
            link: link.trim(),
            quantity: numericQuantity,
            charge: Number(totalCharge.toFixed(2)),
            status: "pending",
          })
          .select()
          .single();

      if (orderError) {
        throw orderError;
      }

      /*
       * Show success.
       */
      setSuccess(
        `Order placed successfully${
          order?.id ? ` • Order ID: ${order.id}` : ""
        }`
      );

      /*
       * Update displayed balance locally.
       *
       * This does NOT directly update the database balance.
       * The database/RPC/trigger should handle the actual
       * wallet deduction if your project already has that logic.
       */
      setBalance((current) =>
        Math.max(
          0,
          Number(
            (current - totalCharge).toFixed(2)
          )
        )
      );

      setLink("");
      setQuantity("");

      /*
       * Go to orders after a short delay.
       */
      setTimeout(() => {
        navigate("/orders");
      }, 1200);
    } catch (err: any) {
      console.error("Order creation error:", err);

      setError(
        err?.message ||
          "Failed to create order. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */
  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

          <p className="text-sm text-slate-400">
            Loading services...
          </p>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */
  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm text-blue-400">
            Order
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            New Order
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Choose a platform and service, then place your
            order.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-5 py-3">
          <p className="text-xs text-slate-500">
            Available Balance
          </p>

          <p className="mt-1 text-lg font-bold text-white">
            ৳ {formatBDT(balance)}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {/* Main */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-xl sm:p-7">
        {/* Platform buttons */}
        <div className="mb-7">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-200">
              Platform
            </label>

            <span className="text-xs text-slate-500">
              {services.length} services
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {availablePlatforms.map((platform) => {
              const active =
                selectedPlatform === platform;

              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() =>
                    handlePlatformChange(platform)
                  }
                  className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-xs">
                    {platformIcons[platform] || "•"}
                  </span>

                  {platform}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Search
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              🔍
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by service ID, name or description..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-11 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Category */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Category
            </label>

            <select
              value={selectedCategory}
              onChange={(event) =>
                handleCategoryChange(event.target.value)
              }
              className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            >
              <option value="">
                All categories
              </option>

              {platformCategories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Service */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Service
            </label>

            <select
              value={selectedServiceId}
              onChange={(event) =>
                handleServiceChange(event.target.value)
              }
              className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            >
              <option value="">
                Select a service
              </option>

              {filteredServices.map((service) => (
                <option
                  key={service.id}
                  value={service.id}
                >
                  {service.service_id} — {service.name} — ৳
                  {formatBDT(
                    Number(service.rate_per_1000)
                  )}
                  /1K
                </option>
              ))}
            </select>

            {filteredServices.length === 0 && (
              <p className="mt-2 text-xs text-amber-400">
                No services found for the selected filters.
              </p>
            )}
          </div>

          {/* Service details */}
          {selectedService && (
            <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-blue-600 px-2 py-1 text-xs font-bold text-white">
                      {selectedService.service_id}
                    </span>

                    <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">
                      {normalizePlatform(
                        selectedService.platform
                      )}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-white">
                    {selectedService.name}
                  </h2>

                  {selectedService.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {selectedService.description}
                    </p>
                  )}
                </div>

                <div className="shrink-0 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-left sm:text-right">
                  <p className="text-xs text-slate-500">
                    Rate
                  </p>

                  <p className="mt-1 text-lg font-bold text-white">
                    ৳{" "}
                    {formatBDT(
                      Number(
                        selectedService.rate_per_1000
                      )
                    )}
                    <span className="text-xs font-normal text-slate-500">
                      {" "}
                      / 1K
                    </span>
                  </p>
                </div>
              </div>

              {/* Service limits */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-slate-900/80 p-3">
                  <p className="text-xs text-slate-500">
                    Min
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    {Number(
                      selectedService.min_quantity
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-900/80 p-3">
                  <p className="text-xs text-slate-500">
                    Max
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    {Number(
                      selectedService.max_quantity
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-900/80 p-3">
                  <p className="text-xs text-slate-500">
                    Rate
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    ৳
                    {formatBDT(
                      Number(
                        selectedService.rate_per_1000
                      )
                    )}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-900/80 p-3">
                  <p className="text-xs text-slate-500">
                    Status
                  </p>

                  <p className="mt-1 text-sm font-semibold text-emerald-400">
                    {selectedService.status}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Link */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Link
            </label>

            <input
              type="url"
              value={link}
              onChange={(event) =>
                setLink(event.target.value)
              }
              placeholder={
                selectedService
                  ? `https://${selectedService.platform.toLowerCase()}.com/...`
                  : "https://..."
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />

            <p className="mt-2 text-xs text-slate-500">
              Enter the profile, page, post, video or target
              URL required by the selected service.
            </p>
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-200">
                Quantity
              </label>

              {selectedService && (
                <span className="text-xs text-slate-500">
                  {Number(
                    selectedService.min_quantity
                  ).toLocaleString()}{" "}
                  –{" "}
                  {Number(
                    selectedService.max_quantity
                  ).toLocaleString()}
                </span>
              )}
            </div>

            <input
              type="number"
              min={
                selectedService?.min_quantity || 1
              }
              max={
                selectedService?.max_quantity ||
                undefined
              }
              step="1"
              value={quantity}
              onChange={(event) =>
                setQuantity(event.target.value)
              }
              placeholder="Enter quantity"
              disabled={!selectedService}
              className={`w-full rounded-xl border bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 ${
                quantityTooLow || quantityTooHigh
                  ? "border-red-500"
                  : "border-slate-800"
              }`}
            />

            {quantityTooLow && (
              <p className="mt-2 text-xs text-red-400">
                Minimum quantity is{" "}
                {Number(
                  selectedService?.min_quantity
                ).toLocaleString()}
                .
              </p>
            )}

            {quantityTooHigh && (
              <p className="mt-2 text-xs text-red-400">
                Maximum quantity is{" "}
                {Number(
                  selectedService?.max_quantity
                ).toLocaleString()}
                .
              </p>
            )}
          </div>

          {/* Price summary */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
            <div className="border-b border-slate-800 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">
                    Your balance
                  </p>

                  <p className="mt-1 text-base font-semibold text-white">
                    ৳ {formatBDT(balance)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    Rate
                  </p>

                  <p className="mt-1 text-base font-semibold text-white">
                    ৳{" "}
                    {selectedService
                      ? formatBDT(
                          Number(
                            selectedService.rate_per_1000
                          )
                        )
                      : "0.00"}
                    <span className="text-xs font-normal text-slate-500">
                      {" "}
                      / 1K
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">
                  Total charge
                </span>

                <span className="text-2xl font-bold text-white">
                  ৳ {formatBDT(totalCharge)}
                </span>
              </div>

              {numericQuantity > 0 &&
                selectedService && (
                  <p className="mt-2 text-right text-xs text-slate-500">
                    {numericQuantity.toLocaleString()} × ৳
                    {formatBDT(
                      Number(
                        selectedService.rate_per_1000
                      )
                    )}{" "}
                    / 1,000
                  </p>
                )}

              {insufficientBalance &&
                totalCharge > 0 && (
                  <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    Insufficient balance for this order.
                  </div>
                )}
            </div>
          </div>

          {/* Confirm */}
          <button
            type="submit"
            disabled={
              submitting ||
              !selectedService ||
              !link.trim() ||
              !quantity ||
              numericQuantity <= 0 ||
              !!quantityTooLow ||
              !!quantityTooHigh ||
              insufficientBalance
            }
            className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processing Order...
              </>
            ) : (
              "Confirm Order"
            )}
          </button>

          <p className="mt-3 text-center text-xs text-slate-600">
            By confirming, your order will be submitted for
            processing.
          </p>
        </form>
      </div>
    </div>
  );
}
