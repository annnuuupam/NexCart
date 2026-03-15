import React, { useMemo, useState, useEffect } from "react";

import { ProductList } from "../../components/product/ProductList";
import { ProductCardSkeleton } from "../../components/ui/Skeletons";
import { Footer } from "../../components/layout/Footer";
import { Header } from "../../components/layout/Header";
import { useToast } from "../../components/ui/ToastContext";

import "../../styles/styles.css";
import API_BASE_URL from '../../config/api';

const PAGE_SIZE = 12;

const sortProducts = (items, sortBy) => {
  const cloned = [...items];

  switch (sortBy) {
    case "price-low":
      return cloned.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    case "price-high":
      return cloned.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    case "name":
      return cloned.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    default:
      return cloned;
  }
};

const getProductRating = (product) => {
  const seeded = Number(product.product_id || product.productId || 0) % 20;
  return Number((3 + seeded / 10).toFixed(1));
};

const getStockValue = (product) => Number(product.stock ?? product.stock_quantity ?? 0);

export default function CustomerHomePage() {
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [username, setUsername] = useState("");
  const [cartError, setCartError] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceBand, setSelectedPriceBand] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [serverPage, setServerPage] = useState(0);
  const [pagination, setPagination] = useState({
    page: 0,
    size: PAGE_SIZE,
    totalPages: 1,
    totalElements: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [highlights, setHighlights] = useState({
    deliveryEstimate: "2-4 days",
    activeOfferCount: 0,
    paymentMethods: ["UPI", "Cards", "Net Banking"],
  });

  const toast = useToast();

  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name", label: "Name: A to Z" },
  ];

  const [categories, setCategories] = useState(["all"]);

  const syncCategoriesFromProducts = (items = []) => {
    const unique = new Set();
    items.forEach((product) => {
      const categoryName = String(product.categoryName || product.category?.categoryName || "").trim();
      if (categoryName) unique.add(categoryName);
    });
    const list = Array.from(unique).sort((a, b) => a.localeCompare(b));
    setCategories(["all", ...list]);
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();
      const items = Array.isArray(data?.categories) ? data.categories : Array.isArray(data) ? data : [];
      const list = items
        .map((item) => String(item.categoryName || item.category_name || "").trim())
        .filter(Boolean);

      if (list.length) {
        const unique = Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
        setCategories(["all", ...unique]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "all") count += 1;
    if (selectedPriceBand !== "all") count += 1;
    if (minRating > 0) count += 1;
    if (inStockOnly) count += 1;
    return count;
  }, [selectedCategory, selectedPriceBand, minRating, inStockOnly]);

  const appliedFilters = useMemo(() => {
    const chips = [];
    if (selectedCategory !== "all") {
      chips.push({
        key: "category",
        label: `Category: ${selectedCategory}`,
        onRemove: () => {
          setSelectedCategory("all");
          setServerPage(0);
        },
      });
    }

    if (selectedPriceBand !== "all") {
      const priceMap = {
        "under-500": "Price: Under Rs. 500",
        "500-1000": "Price: Rs. 500 - Rs. 1000",
        "1000-2000": "Price: Rs. 1000 - Rs. 2000",
        "above-2000": "Price: Above Rs. 2000",
      };
      chips.push({
        key: "price",
        label: priceMap[selectedPriceBand] || "Price",
        onRemove: () => setSelectedPriceBand("all"),
      });
    }

    if (minRating > 0) {
      chips.push({
        key: "rating",
        label: `Rating: ${minRating}+`,
        onRemove: () => setMinRating(0),
      });
    }

    if (inStockOnly) {
      chips.push({
        key: "stock",
        label: "In stock only",
        onRemove: () => setInStockOnly(false),
      });
    }

    return chips;
  }, [selectedCategory, selectedPriceBand, minRating, inStockOnly]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 980) {
        setIsMobileFiltersOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchCartCount();
    fetchHighlights();
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(serverPage);
    }, 220);

    return () => clearTimeout(timer);
  }, [serverPage, selectedCategory, searchQuery]);

  const fetchProducts = async (pageToLoad) => {
    setIsLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(pageToLoad));
      params.set("size", String(PAGE_SIZE));
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const response = await fetch(`${API_BASE_URL}/api/products?${params.toString()}`, { credentials: "include" });

      if (response.status === 401 || response.status === 403) {
        window.location.href = "/";
        return;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        setProducts([]);
        return;
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.products)) {
        setProducts([]);
        return;
      }

      setUsername(data.user?.username || data.user?.name || data.username || "Guest");
      setProducts(data.products);
      if (categories.length <= 1) {
        syncCategoriesFromProducts(data.products);
      }
      setPagination(data.pagination || {
        page: pageToLoad,
        size: PAGE_SIZE,
        totalPages: 1,
        totalElements: data.products.length,
        hasNext: false,
        hasPrevious: pageToLoad > 0,
      });
      setIsLoadingProducts(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Unable to load products. Please try again.");
      setProducts([]);
      setIsLoadingProducts(false);
    }
  };

  const fetchHighlights = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/store/highlights`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();
      setHighlights({
        deliveryEstimate: data?.deliveryEstimate || "2-4 days",
        activeOfferCount: Number(data?.activeOfferCount || 0),
        paymentMethods: Array.isArray(data?.paymentMethods) && data.paymentMethods.length
          ? data.paymentMethods
          : ["UPI", "Cards", "Net Banking"],
      });
      setIsLoadingProducts(false);
    } catch (error) {
      console.error("Error fetching store highlights:", error);
    }
  };

  const fetchCartCount = async () => {
    setIsCartLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/items`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setCartCount(0);
        setCartError(true);
        return;
      }

      const cartData = await response.json();
      const total = (cartData?.cart?.products || []).reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      );
      setCartCount(total);
      setCartError(false);
    } catch (error) {
      console.error("Error fetching cart count:", error);
      setCartCount(0);
      setCartError(true);
    } finally {
      setIsCartLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!productId) {
      toast.error("This product is not available.");
      return;
    }

    try {
      const payload = {
        productId,
        product_id: productId,
        quantity: 1,
        ...(username && username !== "Guest" ? { username } : {}),
      };

      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        credentials: "include",
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        fetchCartCount();
        toast.success("Item added to cart successfully.");
      } else if (response.status === 409) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.error || "Only a few items left in stock.";
        toast.warning(message);
      } else {
        const errorText = await response.text();
        if (errorText?.includes("User not")) {
          toast.error("Session expired. Please log in again.");
        } else {
          toast.error("Unable to add item to cart. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error adding product to cart:", error);
      toast.error("Network error while adding item to cart. Please try again.");
    }
  };

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const matched = products.filter((product) => {
      const name = String(product.name || "").toLowerCase();
      const description = String(product.description || "").toLowerCase();
      const categoryName = String(product.categoryName || product.category?.categoryName || "").toLowerCase();

      const searchPass = !normalizedQuery
        ? true
        : searchScope === "name"
          ? name.includes(normalizedQuery)
          : searchScope === "description"
            ? description.includes(normalizedQuery)
            : searchScope === "category"
              ? categoryName.includes(normalizedQuery)
              : name.includes(normalizedQuery) || description.includes(normalizedQuery) || categoryName.includes(normalizedQuery);

      if (!searchPass) return false;

      const price = Number(product.price || 0);
      if (selectedPriceBand === "under-500" && price >= 500) return false;
      if (selectedPriceBand === "500-1000" && (price < 500 || price > 1000)) return false;
      if (selectedPriceBand === "1000-2000" && (price < 1000 || price > 2000)) return false;
      if (selectedPriceBand === "above-2000" && price <= 2000) return false;

      if (inStockOnly && getStockValue(product) <= 0) return false;

      const rating = getProductRating(product);
      if (minRating > 0 && rating < minRating) return false;

      return true;
    });

    return sortProducts(matched, sortBy);
  }, [products, searchQuery, searchScope, sortBy, selectedPriceBand, minRating, inStockOnly]);

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedPriceBand("all");
    setMinRating(0);
    setInStockOnly(false);
    setServerPage(0);
  };

  return (
    <div className="customer-homepage">
      <Header
        cartCount={isCartLoading ? "..." : cartError ? "0" : cartCount}
        username={username}
        searchQuery={searchQuery}
        searchScope={searchScope}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setServerPage(0);
        }}
        onSearchScopeChange={setSearchScope}
        onClearSearch={() => {
          setSearchQuery("");
          setServerPage(0);
        }}
        onSearchSubmit={(event) => event.preventDefault()}
      />

      <main className="main-content">
        <section className="market-highlights">
          <article className="market-highlight-item">
            <p className="market-highlight-title">Fast Delivery</p>
            <p className="market-highlight-sub">Estimated arrival: {highlights.deliveryEstimate}</p>
          </article>
          <article className="market-highlight-item">
            <p className="market-highlight-title">Live Offers</p>
            <p className="market-highlight-sub">{highlights.activeOfferCount} active coupons available right now</p>
          </article>
          <article className="market-highlight-item">
            <p className="market-highlight-title">Secure Payments</p>
            <p className="market-highlight-sub">{highlights.paymentMethods.slice(0, 3).join(" | ")}</p>
          </article>
        </section>

        <section className="market-toolbar">
          <p className="market-results">{pagination.totalElements || filteredProducts.length} results</p>
          <div className="market-sort">
            <button
              type="button"
              className="mobile-filters-toggle"
              onClick={() => setIsMobileFiltersOpen(true)}
            >
              Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
            </button>
            <label htmlFor="market-sort-select">Sort by</label>
            <div className="market-sort-menu">
              <select
                id="market-sort-select"
                className="market-sort-select"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort products"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {appliedFilters.length ? (
          <section className="active-filters-bar">
            {appliedFilters.map((filter) => (
              <button key={filter.key} type="button" className="active-filter-chip" onClick={filter.onRemove}>
                <span>{filter.label}</span>
                <span className="active-filter-x">x</span>
              </button>
            ))}
            <button type="button" className="active-filter-clear" onClick={clearFilters}>Clear all</button>
          </section>
        ) : null}

        {isMobileFiltersOpen ? <button type="button" className="filters-backdrop" onClick={() => setIsMobileFiltersOpen(false)} /> : null}

        <div className="market-layout">
          <aside className={`filters-sidebar ${isMobileFiltersOpen ? "open" : ""}`}>
            <div className="filters-header">
              <h3>Filters</h3>
              <div className="filters-header-actions">
                <button type="button" onClick={clearFilters}>Clear all</button>
                <button type="button" className="filters-close-mobile" onClick={() => setIsMobileFiltersOpen(false)}>Close</button>
              </div>
            </div>

            <div className="filter-group">
              <h4>Category</h4>
              <div className="filter-options">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`filter-chip ${selectedCategory === category ? "active" : ""}`}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(category === "all" ? "all" : category);
                      setServerPage(0);
                      setIsMobileFiltersOpen(false);
                    }}
                  >
                    {category === "all" ? "All" : category}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Price</h4>
              <div className="filter-list">
                {[
                  { value: "all", label: "All prices" },
                  { value: "under-500", label: "Under Rs. 500" },
                  { value: "500-1000", label: "Rs. 500 - Rs. 1000" },
                  { value: "1000-2000", label: "Rs. 1000 - Rs. 2000" },
                  { value: "above-2000", label: "Above Rs. 2000" },
                ].map((item) => (
                  <label key={item.value} className="filter-radio-row">
                    <input
                      type="radio"
                      name="price-band"
                      checked={selectedPriceBand === item.value}
                      onChange={() => setSelectedPriceBand(item.value)}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Customer Rating</h4>
              <div className="filter-list">
                {[4.5, 4, 3.5].map((rating) => (
                  <label key={rating} className="filter-radio-row">
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === rating}
                      onChange={() => setMinRating(rating)}
                    />
                    <span>{rating} stars & above</span>
                  </label>
                ))}
                <label className="filter-radio-row">
                  <input type="radio" name="rating" checked={minRating === 0} onChange={() => setMinRating(0)} />
                  <span>All ratings</span>
                </label>
              </div>
            </div>

            <div className="filter-group">
              <h4>Availability</h4>
              <label className="filter-checkbox-row">
                <input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} />
                <span>In stock only</span>
              </label>
            </div>
          </aside>

          <section className="market-products">
            <ProductList
              products={filteredProducts}
              onAddToCart={handleAddToCart}
              onNotify={(message, type = "success") => {
                if (type === "success") toast.success(message);
                else if (type === "error") toast.error(message);
                else if (type === "warning") toast.warning(message);
                else toast.info(message);
              }}
            />

            <div className="market-pager" role="navigation" aria-label="Product pagination">
              <p>
                Page {Number(pagination.page || 0) + 1} of {Math.max(Number(pagination.totalPages || 1), 1)}
              </p>
              <div className="market-pager-actions">
                <button
                  type="button"
                  className="market-pager-btn"
                  disabled={!pagination.hasPrevious}
                  onClick={() => setServerPage((prev) => Math.max(prev - 1, 0))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="market-pager-btn"
                  disabled={!pagination.hasNext}
                  onClick={() => setServerPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}










