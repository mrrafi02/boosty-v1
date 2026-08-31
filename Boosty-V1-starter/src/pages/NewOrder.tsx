import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

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
  balance: number | null;
};

const platformIcons: Record<string, string> = {
  Facebook: "f",
  Instagram: "◎",
  TikTok: "♪",
  YouTube: "▶",
  Twitter: "𝕏",
  Spotify: "●",
  Telegram: "✈",
  LinkedIn: "in",
  Discord: "🎮",
  "Website Traffic": "🌐",
  Others: "✦",
};

const platformOrder = [
  "Facebook",
  "Instagram",
  "TikTok",
  "YouTube",
  "Twitter",
  "Spotify",
  "Telegram",
  "LinkedIn",
  "Discord",
  "Website Traffic",
  "Others",
];

function formatBDT(value: number) {
  return `৳ ${value.toFixed(2)}`;
}

export default function NewOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
  const [ordering, setOrdering] = useState(false);
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
    try {
      setLoading(true);
      setError("");

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
            .order("sort_order", { ascending: true }),

          supabase
            .from("services")
            .select(
              `
                id,
                service_id,
                platform,
                category_id,
                name,
                description,
                rate_per_1000,
                min_quantity,
                max_quantity,
                status
              `
            )
            .eq("status", "active")
            .order("service_id", { ascending: true }),

          supabase
            .from("profiles")
            .select("balance")
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

      const profile = profileResult.data as Profile | null;

      if (profile?.balance !== null && profile?.balance !== undefined) {
        setBalance(Number(profile.balance));
      }

      /*
       * If URL contains ?service=UUID
       * automatically select that service.
       */
      const urlService = searchParams.get("service");

      if (urlService && servicesResult.data) {
        const matchingService = servicesResult.data.find(
          (service) =>
            service.id === urlService ||
            service.service_id === urlService
        );

        if (matchingService) {
          setSelectedServiceId(matchingService.id);
          setSelectedPlatform(matchingService.platform);
          setSelectedCategory(matchingService.category_id);
        }
      }
    } catch (err: any) {
      console.error("New Order load error:", err);

      setError(
        err?.message ||
          "Failed to load services. Please refresh the page."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * PLATFORMS
   * ---------------------------------------------------------
   */

  const availablePlatforms = useMemo(() => {
    const dbPlatforms = Array.from(
      new Set(
        categories
          .filter((category) => category.status === "active")
          .map((category) => category.platform)
      )
    );

    const ordered = platformOrder.filter((platform) =>
      dbPlatforms.includes(platform)
    );

    const extra = dbPlatforms.filter(
      (platform) => !platformOrder.includes(platform)
    );

    return [...ordered, ...extra];
  }, [categories]);

  /*
   * ---------------------------------------------------------
   * CATEGORIES
   * ---------------------------------------------------------
   */

  const platformCategories = useMemo(() => {
    if (selectedPlatform === "All") {
      return categories;
    }

    return categories.filter(
      (category) => category.platform === selectedPlatform
    );
  }, [categories, selectedPlatform]);

  /*
   * ---------------------------------------------------------
   * SERVICES
   * ---------------------------------------------------------
   */

  const filteredServices = useMemo(() => {
    let result = services;

    if (selectedPlatform !== "All") {
      result = result.filter(
        (service) => service.platform === selectedPlatform
      );
    }

    if (selectedCategory) {
      result = result.filter(
        (service) => service.category_id === selectedCategory
      );
    }

    const searchText = search.trim().toLowerCase();

    if (searchText) {
      result = result.filter((service) => {
        return (
          service.service_id.toLowerCase().includes(searchText) ||
          service.name.toLowerCase().includes(searchText) ||
          service.platform.toLowerCase().includes(searchText) ||
          (service.description || "")
            .toLowerCase()
            .includes(searchText)
        );
      });
    }

    return result;
  }, [
    services,
    selectedPlatform,
    selectedCategory,
    search,
  ]);

  const selectedService = useMemo(() => {
    return (
      services.find(
        (service) => service.id === selectedServiceId
      ) || null
    );
  }, [services, selectedServiceId]);

  /*
   * ---------------------------------------------------------
   * PRICE
   * ---------------------------------------------------------
   *
   * rate_per_1000 = price for 1000 quantity
   *
   * Example:
   * rate_per_1000 = 40
   * quantity = 2500
   *
   * charge = 40 * (2500 / 1000)
   *        = 100
   */

  const numericQuantity = Number(quantity) || 0;

  const totalCharge = selectedService
    ? (Number(selectedService.rate_per_1000) / 1000) *
      numericQuantity
    : 0;

  const insufficientBalance = totalCharge > balance;

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
    setSuccess("");
    setError("");
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
    setSuccess("");
    setError("");
  }

  /*
   * ---------------------------------------------------------
   * SERVICE CHANGE
   * ---------------------------------------------------------
   */

  function handleServiceChange(serviceId: string) {
    setSelectedServiceId(serviceId);
    setQuantity("");
    setSuccess("");
    setError("");

    const service = services.find(
      (item) => item.id === serviceId
    );

    if (service) {
      setSelectedPlatform(service.platform);
      setSelectedCategory(service.category_id);
    }
  }

  /*
   * ---------------------------------------------------------
   * ORDER SUBMIT
   * ---------------------------------------------------------
   */

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedService) {
      setError("Please select a service.");
      return;
    }

    if (!link.trim()) {
      setError("Please enter your link.");
      return;
    }

    if (!quantity.trim()) {
      setError("Please enter quantity.");
      return;
    }

    const qty = Number(quantity);

    if (!Number.isInteger(qty)) {
      setError("Quantity must be a whole number.");
      return;
    }

    if (qty < selectedService.min_quantity) {
      setError(
        `Minimum quantity is ${selectedService.min_quantity.toLocaleString()}.`
      );
      return;
    }

    if (qty > selectedService.max_quantity) {
      setError(
        `Maximum quantity is ${selectedService.max_quantity.toLocaleString()}.`
      );
      return;
    }

    if (totalCharge <= 0) {
      setError("Invalid order amount.");
      return;
    }

    if (totalCharge > balance) {
      setError(
        `Insufficient balance. You need ${formatBDT(
          totalCharge
        )}, but your balance is ${formatBDT(balance)}.`
      );
      return;
    }

    try {
      setOrdering(true);

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
       * Existing orders table insert.
       *
       * These fields match the normal Boosty order structure:
       * user_id
       * service_id
       * link
       * quantity
       * charge
       * status
       */

      const { error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          service_id: selectedService.service_id,
          link: link.trim(),
          quantity: qty,
          charge: Number(totalCharge.toFixed(2)),
          status: "pending",
        });

      if (orderError) {
        throw orderError;
      }

      /*
       * Refresh balance after successful order.
       */
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", user.id)
        .maybeSingle();

      if (updatedProfile?.balance !== undefined) {
        setBalance(Number(updatedProfile.balance));
      } else {
        setBalance((previous) =>
          Math.max(0, previous - totalCharge)
        );
      }

      setSuccess(
        `Order placed successfully. Total charge: ${formatBDT(
          totalCharge
        )}`
      );

      setLink("");
      setQuantity("");

      /*
       * Optional: go to Orders page after a short delay.
       */
      setTimeout(() => {
        navigate("/orders");
      }, 1200);
    } catch (err: any) {
      console.error("Order submit error:", err);

      setError(
        err?.message ||
          "Failed to place order. Please try again."
      );
    } finally {
      setOrdering(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">
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
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm text-slate-400">
            Order
          </p>

          <h1 className="text-3xl font-bold mt-1">
            New Order
          </h1>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
          {/* LEFT SIDE */}
          <div>
            {/* Search */}
            <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-4 mb-5">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  🔍
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search services..."
                  className="w-full h-12 rounded-xl bg-[#111827] border border-slate-700 pl-11 pr-4 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Platform buttons */}
            <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-4 mb-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">
                  Platforms
                </h2>

                <span className="text-xs text-slate-500">
                  {services.length} services
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* All */}
                <button
                  type="button"
                  onClick={() =>
                    handlePlatformChange("All")
                  }
                  className={`rounded-xl px-4 py-4 transition border ${
                    selectedPlatform === "All"
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-[#111827] border-slate-700 text-slate-300 hover:border-blue-500"
                  }`}
                >
                  <div className="text-xl mb-1">
                    ✦
                  </div>
                  <div className="font-semibold text-sm">
                    Everything
                  </div>
                </button>

                {availablePlatforms.map(
                  (platform) => (
                    <button
                      type="button"
                      key={platform}
                      onClick={() =>
                        handlePlatformChange(platform)
                      }
                      className={`rounded-xl px-4 py-4 transition border ${
                        selectedPlatform === platform
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-[#111827] border-slate-700 text-slate-300 hover:border-blue-500"
                      }`}
                    >
                      <div className="text-xl mb-1">
                        {platformIcons[platform] ||
                          "✦"}
                      </div>

                      <div className="font-semibold text-sm">
                        {platform}
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Category buttons */}
            {platformCategories.length > 0 && (
              <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-4 mb-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">
                    Category
                  </h2>

                  {selectedCategory && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCategory("")
                      }
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {platformCategories.map(
                    (category) => (
                      <button
                        type="button"
                        key={category.id}
                        onClick={() =>
                          handleCategoryChange(
                            category.id
                          )
                        }
                        className={`px-4 py-2.5 rounded-lg text-sm border transition ${
                          selectedCategory ===
                          category.id
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-[#111827] border-slate-700 text-slate-300 hover:border-blue-500"
                        }`}
                      >
                        {category.name}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Service list */}
            <div className="bg-[#0b1120] border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">
                    Services
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Select a service to continue
                  </p>
                </div>

                <span className="text-xs text-slate-500">
                  {filteredServices.length} found
                </span>
              </div>

              {filteredServices.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="text-4xl mb-3">
                    🔎
                  </div>

                  <p className="text-slate-300 font-medium">
                    No services found
                  </p>

                  <p className="text-slate-500 text-sm mt-1">
                    Try another platform or search.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {filteredServices.map(
                    (service) => {
                      const selected =
                        selectedServiceId ===
                        service.id;

                      return (
                        <button
                          type="button"
                          key={service.id}
                          onClick={() =>
                            handleServiceChange(
                              service.id
                            )
                          }
                          className={`w-full text-left p-4 transition ${
                            selected
                              ? "bg-blue-500/10"
                              : "hover:bg-white/[0.03]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold ${
                                selected
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              {platformIcons[
                                service.platform
                              ] || "✦"}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                  <span className="text-xs text-blue-400 font-mono">
                                    ID:{" "}
                                    {
                                      service.service_id
                                    }
                                  </span>

                                  <h3 className="font-semibold text-white mt-0.5">
                                    {service.name}
                                  </h3>
                                </div>

                                <div className="text-left sm:text-right">
                                  <div className="font-bold text-white">
                                    {formatBDT(
                                      Number(
                                        service.rate_per_1000
                                      )
                                    )}
                                  </div>

                                  <div className="text-xs text-slate-500">
                                    per 1K
                                  </div>
                                </div>
                              </div>

                              <p className="text-sm text-slate-400 mt-2">
                                {service.description ||
                                  service.name}
                              </p>

                              <div className="flex flex-wrap gap-2 mt-3">
                                <span className="text-xs px-2 py-1 rounded-md bg-slate-800 text-slate-400">
                                  Min{" "}
                                  {service.min_quantity.toLocaleString()}
                                </span>

                                <span className="text-xs px-2 py-1 rounded-md bg-slate-800 text-slate-400">
                                  Max{" "}
                                  {service.max_quantity.toLocaleString()}
                                </span>

                                <span className="text-xs px-2 py-1 rounded-md bg-slate-800 text-slate-400">
                                  Instant
                                </span>

                                <span className="text-xs px-2 py-1 rounded-md bg-slate-800 text-slate-400">
                                  Active
                                </span>
                              </div>
                            </div>

                            <div className="text-slate-500 pt-2">
                              →
                            </div>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE - ORDER FORM */}
          <div>
            <div className="sticky top-6 bg-[#0b1120] border border-slate-800 rounded-2xl overflow-hidden">
              {/* Selected service header */}
              <div className="p-5 border-b border-slate-800">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  New Order
                </p>

                {selectedService ? (
                  <>
                    <div className="flex items-start gap-3 mt-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-lg">
                        {platformIcons[
                          selectedService.platform
                        ] || "✦"}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-blue-400 font-mono">
                          {
                            selectedService.service_id
                          }
                        </p>

                        <h2 className="font-bold text-white mt-1 leading-snug">
                          {selectedService.name}
                        </h2>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-[#111827]">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">
                          Price
                        </span>

                        <span className="font-semibold text-white">
                          {formatBDT(
                            Number(
                              selectedService.rate_per_1000
                            )
                          )}{" "}
                          / 1K
                        </span>
                      </div>

                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-slate-400">
                          Min
                        </span>

                        <span className="text-white">
                          {selectedService.min_quantity.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-slate-400">
                          Max
                        </span>

                        <span className="text-white">
                          {selectedService.max_quantity.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-3 p-4 rounded-xl bg-[#111827]">
                    <p className="text-slate-400 text-sm">
                      Select a service from the list.
                    </p>
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className="p-5"
              >
                {/* Service dropdown */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Service
                  </label>

                  <select
                    value={selectedServiceId}
                    onChange={(e) =>
                      handleServiceChange(
                        e.target.value
                      )
                    }
                    className="w-full h-12 rounded-xl bg-[#111827] border border-slate-700 px-3 text-white outline-none focus:border-blue-500"
                  >
                    <option value="">
                      Select service
                    </option>

                    {filteredServices.map(
                      (service) => (
                        <option
                          key={service.id}
                          value={service.id}
                        >
                          {service.service_id} -{" "}
                          {service.name} —{" "}
                          {formatBDT(
                            Number(
                              service.rate_per_1000
                            )
                          )}
                          /1K
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Link */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Link
                  </label>

                  <input
                    type="url"
                    value={link}
                    onChange={(e) =>
                      setLink(e.target.value)
                    }
                    placeholder="https://facebook.com/..."
                    className="w-full h-12 rounded-xl bg-[#111827] border border-slate-700 px-3 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Quantity */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min={
                      selectedService?.min_quantity ||
                      1
                    }
                    max={
                      selectedService?.max_quantity ||
                      undefined
                    }
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(e.target.value)
                    }
                    placeholder="1000"
                    className="w-full h-12 rounded-xl bg-[#111827] border border-slate-700 px-3 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                  />

                  {selectedService && (
                    <p className="text-xs text-slate-500 mt-2">
                      Min{" "}
                      {selectedService.min_quantity.toLocaleString()}
                      {" • "}
                      Max{" "}
                      {selectedService.max_quantity.toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Balance / Charge */}
                <div className="rounded-xl bg-[#111827] p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      Your balance
                    </span>

                    <span className="text-sm text-white">
                      {formatBDT(balance)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="font-semibold text-white">
                      Total charge
                    </span>

                    <span
                      className={`text-xl font-bold ${
                        insufficientBalance
                          ? "text-red-400"
                          : "text-white"
                      }`}
                    >
                      {formatBDT(totalCharge)}
                    </span>
                  </div>
                </div>

                {/* Errors */}
                {error && (
                  <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {/* Success */}
                {success && (
                  <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">
                    {success}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={
                    ordering ||
                    !selectedService ||
                    !link.trim() ||
                    !quantity ||
                    insufficientBalance
                  }
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold transition"
                >
                  {ordering
                    ? "Placing Order..."
                    : "Confirm Order"}
                </button>

                {/* Add funds */}
                {insufficientBalance &&
                  totalCharge > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate("/add-funds")
                      }
                      className="w-full mt-3 h-11 rounded-xl border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 transition font-medium"
                    >
                      Add Funds
                    </button>
                  )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
