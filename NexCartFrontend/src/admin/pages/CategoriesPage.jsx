import React, { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Image as ImageIcon } from "lucide-react";
import DataTable from "../components/DataTable";
import AdminSelect from "../components/AdminSelect";
import { adminApi } from "../services/adminApi";
import { useToast } from "../../components/ui/ToastContext";

const normalizeCategory = (row) => ({
  categoryId: row?.categoryId ?? row?.category_id ?? "",
  categoryName: row?.categoryName ?? row?.category_name ?? "Unnamed",
  imageUrl: row?.imageUrl ?? row?.image_url ?? "",
  productCount: Number(row?.productCount ?? row?.product_count ?? 0),
});

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ categoryId: "", categoryName: "", imageUrl: "" });
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCategories();
      const normalized = Array.isArray(data) ? data.map(normalizeCategory) : [];
      setCategories(normalized);
    } catch (error) {
      console.error("Unable to load categories.", error);
      toast.error(error.message || "Unable to load categories. Please try again.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ categoryId: "", categoryName: "", imageUrl: "" });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      imageUrl: row.imageUrl || "",
    });
    setOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.categoryName.trim()) {
      toast.warning("Please enter a category name.");
      return;
    }

    try {
      if (editing) {
        await adminApi.updateCategory({
          categoryId: Number(form.categoryId),
          categoryName: form.categoryName.trim(),
          imageUrl: form.imageUrl?.trim() || "",
        });
        toast.success("Category updated successfully.");
      } else {
        await adminApi.addCategory({
          categoryName: form.categoryName.trim(),
          imageUrl: form.imageUrl?.trim() || "",
        });
        toast.success("Category created successfully.");
      }
      setOpen(false);
      await loadCategories();
    } catch (error) {
      toast.error(error.message || "Unable to save category. Please try again.");
    }
  };

  const removeCategory = async (categoryId) => {
    try {
      await adminApi.deleteCategory(Number(categoryId));
      toast.success("Category deleted successfully.");
      setPendingDelete(null);
      await loadCategories();
    } catch (error) {
      toast.error(error.message || "Unable to delete category. Please try again.");
    }
  };

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = categories.filter((item) => {
      if (!q) return true;
      return (
        String(item.categoryName || "").toLowerCase().includes(q) ||
        String(item.categoryId || "").toLowerCase().includes(q)
      );
    });

    rows.sort((a, b) => {
      if (sortBy === "products_desc") return b.productCount - a.productCount;
      if (sortBy === "products_asc") return a.productCount - b.productCount;
      if (sortBy === "name_desc") return String(b.categoryName).localeCompare(String(a.categoryName));
      return String(a.categoryName).localeCompare(String(b.categoryName));
    });

    return rows;
  }, [categories, search, sortBy]);

  const stats = useMemo(() => {
    const total = categories.length;
    const totalProductsMapped = categories.reduce((sum, item) => sum + Number(item.productCount || 0), 0);
    const activeCategories = categories.filter((item) => Number(item.productCount || 0) > 0).length;
    const emptyCategories = total - activeCategories;
    return { total, totalProductsMapped, activeCategories, emptyCategories };
  }, [categories]);

  const columns = [
    {
      key: "category",
      label: "Category",
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.imageUrl ? (
            <img src={row.imageUrl} alt={row.categoryName} className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-slate-500">
              <ImageIcon className="h-4 w-4" />
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-900">{row.categoryName}</p>
            <p className="text-xs text-slate-500">ID: {row.categoryId || "-"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "productCount",
      label: "Products",
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            row.productCount > 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {row.productCount}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEdit(row)}
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
            aria-label={`Edit ${row.categoryName}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPendingDelete(row)}
            className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
            aria-label={`Delete ${row.categoryName}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Categories Management</h2>
            <p className="text-sm text-slate-600">Organize catalog structure, track coverage, and maintain category quality.</p>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Category
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Categories</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active Categories</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.activeCategories}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Empty Categories</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{stats.emptyCategories}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Products Mapped</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">{stats.totalProductsMapped}</p>
        </article>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by category name or ID"
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-sm"
          />
        </label>

        <AdminSelect
          value={sortBy}
          onChange={(next) => setSortBy(next)}
          options={[
            { value: "name_asc", label: "Name: A to Z" },
            { value: "name_desc", label: "Name: Z to A" },
            { value: "products_desc", label: "Products: High to Low" },
            { value: "products_asc", label: "Products: Low to High" },
          ]}
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading categories...</div>
      ) : (
        <DataTable columns={columns} data={filteredCategories} emptyText="No categories found. Create your first category to start organizing products." />
      )}

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4">
          <form onSubmit={save} className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-xl font-bold text-slate-900">{editing ? "Edit Category" : "Create Category"}</h3>
            <p className="mb-4 text-sm text-slate-600">Set a clean category name for storefront navigation.</p>

            <div className="grid gap-3">
              <label className="text-sm font-semibold text-slate-700">
                Category Name
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.categoryName}
                  onChange={(event) => setForm((prev) => ({ ...prev, categoryName: event.target.value }))}
                  placeholder="Example: Home Appliances"
                  required
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Category Image URL (optional)
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.imageUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                  placeholder="https://..."
                />
              </label>

              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
                <div className="flex items-center gap-3">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="Preview" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-slate-500">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">{form.categoryName || "Category name preview"}</p>
                    <p className="text-xs text-slate-500">Visible in admin and storefront filters</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 font-semibold" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white">
                {editing ? "Save Changes" : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Delete category?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This will remove <b>{pendingDelete.categoryName}</b>. If products are mapped to this category, deletion may fail.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2 font-semibold"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white"
                onClick={() => removeCategory(pendingDelete.categoryId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default CategoriesPage;







