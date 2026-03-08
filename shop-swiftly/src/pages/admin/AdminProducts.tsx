import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Loader2, ImageIcon, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminProducts = () => {
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",
    stock_quantity: "",
    description: "",
    category_id: "",
    images: [] as string[],
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["adminCategoriesDropdown"],
    queryFn: api.getCategories,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["adminProducts"],
    queryFn: api.getAdminProducts,
  });

  const generateSku = (name: string) => {
    return name.substring(0, 3).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000);
  };

  const createMutation = useMutation({
    mutationFn: api.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      toast.success("Product created successfully!");
      setIsAddOpen(false);
      setFormData({ name: "", sku: "", price: "", stock_quantity: "", description: "", category_id: "", images: [] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create product");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      toast.success("Product updated successfully!");
      setIsEditOpen(false);
      setEditingId(null);
      setFormData({ name: "", sku: "", price: "", stock_quantity: "", description: "", category_id: "", images: [] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update product");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      toast.success("Product deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete product");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      sku: formData.sku || generateSku(formData.name),
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity, 10),
      category_id: formData.category_id || undefined,
      images: formData.images,
      is_active: true
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await api.uploadImage(file);
      setFormData(prev => ({ ...prev, images: [...prev.images, res.url] }));
      toast.success("Image uploaded!");
    } catch (error: any) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const openEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      sku: product.sku || "",
      price: product.price?.toString() || "",
      stock_quantity: product.stock_quantity?.toString() || "0",
      description: product.description || "",
      category_id: product.category_id || "",
      images: product.images || [],
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    updateMutation.mutate({
      id: editingId,
      data: {
        ...formData,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity, 10),
        category_id: formData.category_id || undefined,
        images: formData.images,
      }
    });
  };

  const filtered = products.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif">Products</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription className="sr-only">Add a new product to your store's catalog.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium">SKU (Optional)</label>
                <Input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} placeholder="Auto-generated if empty" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Price (₹)</label>
                  <Input type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Initial Stock</label>
                  <Input type="number" value={formData.stock_quantity} onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={formData.category_id} onValueChange={(val) => setFormData({ ...formData, category_id: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Product Images</label>
                <div className="flex items-center gap-4 mt-2">
                  {formData.images.map((url, i) => (
                    <img key={i} src={url} alt="Uploaded" className="h-16 w-16 object-cover rounded-md border" />
                  ))}
                  <Button type="button" variant="outline" className="relative h-16 w-16 shrink-0" disabled={uploadingImage}>
                    {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={handleImageUpload} accept="image/*" disabled={uploadingImage} />
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || uploadingImage}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Product
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setEditingId(null);
            setFormData({ name: "", sku: "", price: "", stock_quantity: "", description: "", category_id: "", images: [] });
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription className="sr-only">Update product details and stock.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium">SKU</label>
                <Input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Price (₹)</label>
                  <Input type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Stock</label>
                  <Input type="number" value={formData.stock_quantity} onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={formData.category_id} onValueChange={(val) => setFormData({ ...formData, category_id: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Product Images</label>
                <div className="flex items-center flex-wrap gap-4 mt-2">
                  {formData.images.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="Uploaded" className="h-16 w-16 object-cover rounded-md border" />
                      <button type="button" className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setFormData(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}>×</button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" className="relative h-16 w-16 shrink-0" disabled={uploadingImage}>
                    {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={handleImageUpload} accept="image/*" disabled={uploadingImage} />
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={updateMutation.isPending || uploadingImage}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">SKU</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Stock</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Loading products...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No products found. Add one above!</td></tr>
            ) : (
              filtered.map((p: any) => (
                <tr key={p.id} className="hover:bg-secondary/50 cursor-pointer">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{p.sku}</td>
                  <td className="px-4 py-3">₹{Number(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={p.stock_quantity < 5 ? "text-destructive font-medium" : ""}>{p.stock_quantity}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                    {categories.find((c: any) => c.id === p.category_id)?.name || p.category_id || "Uncategorized"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Draft"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this product?")) {
                          deleteMutation.mutate(p.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts;
