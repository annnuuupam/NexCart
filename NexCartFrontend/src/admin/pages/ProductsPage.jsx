import React, { useEffect, useMemo, useState, useRef } from "react";
import { Plus, Pencil, Trash2, Search, Image as ImageIcon, PackagePlus, RefreshCw } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import DataTable from "../components/DataTable";
import AdminSelect from "../components/AdminSelect";
import { adminApi } from "../services/adminApi";
import { formatCurrency, formatNumber } from "../utils/format";
import { useToast } from "../../components/ui/ToastContext";
import { TableRowSkeleton } from "../../components/ui/Skeletons";

const emptyForm = {
  name: "",
  description: "",
  categoryId: "",
  price: "",
  stock: "",
  imageUrlsText: "",
  clearImages: false,
};

const parseImageUrls = (text) =>
  String(text || "")
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean);

const ProductsPage = () => {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [focusedProductId, setFocusedProductId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [restockingIds, setRestockingIds] = useState([]);
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const imageInputRef = useRef(null);
  const previewUrls = useMemo(() => parseImageUrls(form.imageUrlsText), [form.imageUrlsText]);

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const updateSearchParams = ({ q, stock, focus }) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (stock) next.set("stock", stock);
    if (focus) next.set("focus", String(focus));
    setSearchParams(next, { replace: true });
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [overview, categoriesPayload] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getCategories(),
      ]);

      const items = Array.isArray(overview?.products) ? overview.products : [];
      setProducts(items);

      const categoriesData = Array.isArray(categoriesPayload) ? categoriesPayload : [];
      setCategories(categoriesData.map((cat) => ({
        id: cat.categoryId,
        name: cat.categoryName,
      })));
    } catch (error) {
      console.error("Failed to load products", error);
      toast.error(error.message || "Unable to load products. Please try again.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    const stock = searchParams.get("stock") || "";
    const focusRaw = searchParams.get("focus");
    const focusNumber = focusRaw ? Number(focusRaw) : null;

    setSearchTerm(q);
    setLowStockOnly(stock === "low");
    if (stock === "low") {
      setCategoryFilter("All");
    }
    setFocusedProductId(Number.isFinite(focusNumber) ? focusNumber : null);
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const name = String(item.name || "").toLowerCase();
      const description = String(item.description || "").toLowerCase();
      const categoryName = String(item.category || item.categoryName || "");
      const matchesSearch =
        !searchTerm ||
        name.includes(searchTerm.toLowerCase()) ||
        description.includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "All" || categoryName === categoryFilter;
      const stockValue = Number(item.remainingStock ?? item.stock ?? 0);
      const matchesStock = !lowStockOnly || stockValue <= 10;
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, lowStockOnly]);

  const displayProducts = useMemo(() => {
    if (!focusedProductId) return filteredProducts;

    const focused = filteredProducts.find((product) => Number(product.productId) === focusedProductId);
    if (focused) return [focused];

    return filteredProducts;
  }, [filteredProducts, focusedProductId]);

  const categoryOptions = useMemo(() => ["All", ...categories.map((category) => category.name)], [categories]);

  const openAddModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const openEditModal = async (product) => {
    setEditingProduct(product);
    const urls = Array.isArray(product.imageUrls)
      ? product.imageUrls
      : Array.isArray(product.images)
        ? product.images
        : product.imageUrl
          ? [product.imageUrl]
          : [];

    if ((!urls || urls.length === 0) && product?.productId) {
      try {
        const details = await adminApi.getProductDetails(product.productId);
        if (Array.isArray(details?.images) && details.images.length) {
          urls.push(...details.images);
        }
      } catch (error) {
        console.error("Failed to load product details", error);
      }
    }

    setForm({
      name: product.name || "",
      description: product.description || "",
      categoryId: product.categoryId || "",
      price: String(product.price || ""),
      stock: String(product.remainingStock ?? product.stock ?? ""),
      imageUrlsText: urls.join("\n"),
      clearImages: false,
    });
    setFormError("");
    setShowForm(true);
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Product name is required.");
      return;
    }

    if (!form.categoryId) {
      setFormError("Please select a category.");
      return;
    }

    const imageUrls = parseImageUrls(form.imageUrlsText);

    if (!editingProduct && imageUrls.length === 0) {
      setFormError("At least one image URL is required for new products.");
      return;
    }

    if (editingProduct && imageUrls.length === 0 && !form.clearImages) {
      toast.warning("Existing images will be preserved. Use 'Remove all existing images' to clear them.");
    }

    const imagePayload = imageUrls.length ? { imageUrls } : form.clearImages ? { clearImages: true, imageUrls: [] } : {};

    const payload = {
      productId: editingProduct?.productId,
      name: form.name.trim(),
      description: form.description.trim(),
      categoryId: Number(form.categoryId),
      price: Number(form.price),
      stock: Number(form.stock),
      ...imagePayload,
    };

    try {
      setFormSaving(true);
      if (editingProduct) {
        await adminApi.updateProduct(payload);
        toast.success("Product updated successfully.");
      } else {
        await adminApi.addProduct(payload);
        toast.success("Product added successfully.");
      }
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error("Failed to save product", error);
      toast.error(error.message || "Failed to save product.");
    } finally {
      setFormSaving(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!productId) return;

    try {
      await adminApi.deleteProduct(productId);
      toast.success("Product deleted successfully.");
      await loadData();
    } catch (error) {
      toast.error(error.message || "Unable to delete product.");
    }
  };

  const handleQuickRestock = async (row) => {
    const productId = Number(row.productId);
    if (!Number.isFinite(productId)) return;

    const currentStock = Number(row.remainingStock || 0);
    const newStock = currentStock + 10;

    try {
      setRestockingIds((prev) => [...prev, productId]);
      await adminApi.updateProduct({
        productId,
        stock: newStock,
      });
      toast.success(`${row.name} restocked to ${newStock}.`);
      await loadData();
    } catch (error) {
      toast.error(error.message || "Failed to restock product.");
    } finally {
      setRestockingIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  const columns = [
    {
      key: "product",
      label: "Product",
      render: (row) => {
        const primaryImage = row.imageUrl || (Array.isArray(row.imageUrls) && row.imageUrls[0]);
        return (
          <div className="flex items-center gap-3">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={row.name}
                className="h-12 w-12 rounded-lg object-cover"
                onError={(event) => {
                  event.currentTarget.src = "https://placehold.co/80x80?text=No+Image";
                }}
              />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-slate-400">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-900">{row.name}</p>
              <p className="text-xs text-slate-500">{row.category || row.categoryName || "Uncategorized"}</p>
            </div>
          </div>
        );
      },
    },
    { key: "price", label: "Price", render: (row) => formatCurrency(row.price) },
    { key: "remainingStock", label: "Stock" },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const stock = Number(row.remainingStock ?? row.stock ?? 0);
        if (stock <= 0) return <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Out of Stock</span>;
        if (stock <= 10) return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Low Stock</span>;
        return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Healthy</span>;
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
            onClick={() => handleQuickRestock(row)}
            disabled={restockingIds.includes(Number(row.productId))}
            title="Quick Restock +10"
          >
            <PackagePlus className="h-4 w-4" />
          </button>
          <button
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
            onClick={() => openEditModal(row)}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
            onClick={() => deleteProduct(row.productId)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Product Inventory</h2>
          <p className="text-sm text-slate-500">Track, update, and maintain your catalog stock levels.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {lowStockOnly ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Low-stock mode is active. Showing products with stock less than or equal to 10.
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:w-auto">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => {
              const value = event.target.value;
              setSearchTerm(value);
              updateSearchParams({ q: value.trim(), stock: lowStockOnly ? "low" : "", focus: focusedProductId });
            }}
            placeholder="Search products..."
            className="w-full bg-transparent text-sm outline-none sm:w-56"
          />
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <AdminSelect
            value={categoryFilter}
            onChange={(value) => {
              setCategoryFilter(value);
              setFocusedProductId(null);
            }}
            options={categoryOptions.map((option) => ({ value: option, label: option }))}
            className="w-full sm:w-48"
          />
          <button
            type="button"
            onClick={() => {
              const next = !lowStockOnly;
              setLowStockOnly(next);
              updateSearchParams({ q: searchTerm.trim(), stock: next ? "low" : "", focus: focusedProductId });
            }}
            className={`w-full sm:w-auto rounded-xl px-3 py-2 text-sm font-semibold border ${lowStockOnly ? "border-amber-300 bg-amber-100 text-amber-700" : "border-slate-200 bg-white text-slate-700"}`}
          >
            {lowStockOnly ? "Low Stock: ON" : "Low Stock: OFF"}
          </button>
          {(lowStockOnly || searchTerm || focusedProductId) ? (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setLowStockOnly(false);
                setFocusedProductId(null);
                setCategoryFilter("All");
                setSearchParams(new URLSearchParams(), { replace: true });
              }}
              className="w-full sm:w-auto rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="grid gap-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <TableRowSkeleton key={`product-row-skeleton-${idx}`} />
            ))}
          </div>
        </div>
      ) : (
        <DataTable columns={columns} data={displayProducts} emptyText="No products found." />
      )}

      {showForm ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4">
          <form onSubmit={saveProduct} className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900">{editingProduct ? "Edit Product" : "Add Product"}</h3>
            <p className="text-sm text-slate-500">Provide product details and manage inventory visibility.</p>

            {formError ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
                {formError}
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                className="rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Product name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
              <input
                className="rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                required
              />
              <AdminSelect
                value={form.categoryId}
                onChange={(value) => setForm((p) => ({ ...p, categoryId: value }))}
                options={categories.map((category) => ({ value: category.id, label: category.name }))}
                className="md:col-span-2"
              />
              <input
                type="number"
                className="rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                required
              />
              <input
                type="number"
                className="rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Stock"
                value={form.stock}
                onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                required
              />
              <textarea
                className="rounded-lg border border-slate-200 px-3 py-2 md:col-span-2"
                placeholder="Image URLs (one per line or comma separated)"
                value={form.imageUrlsText}
                onChange={(e) => setForm((p) => ({ ...p, imageUrlsText: e.target.value }))}
                rows={4}
                ref={imageInputRef}
                disabled={editingProduct && form.clearImages}
                required={!editingProduct && !form.clearImages}
              />

              <div className="grid gap-2 md:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-600">Image Preview</p>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, imageUrlsText: "", clearImages: false }));
                      imageInputRef.current?.focus();
                    }}
                  >
                    Replace Images
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(previewUrls.length ? previewUrls : ["https://placehold.co/100x100?text=No+Image"]).map((url, index) => (
                    <img key={`${url}-${index}`} src={url} alt="Preview" className="h-20 w-full rounded-lg object-cover" />
                  ))}
                </div>
              </div>

              {editingProduct ? (
                <label className="flex items-center gap-2 text-xs text-slate-600 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.clearImages}
                    onChange={(e) => setForm((p) => ({ ...p, clearImages: e.target.checked }))}
                  />
                  Remove all existing images (cannot be undone)
                </label>
              ) : null}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2 font-semibold"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                disabled={formSaving}
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white"
              >
                {formSaving ? "Saving..." : editingProduct ? "Update Product" : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
};

export default ProductsPage;
