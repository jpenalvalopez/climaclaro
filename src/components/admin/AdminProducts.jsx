import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, Wifi, Upload, X, Eye, EyeOff, PlusCircle } from "lucide-react";

const EMPTY_PRODUCT = {
  name: "", model_code: "", product_family: "", category: "", brand: "", price: "", price_with_installation: "",
  power_kw: "", area_min_m2: "", area_max_m2: "", energy_rating: "",
  noise_db: "", has_wifi: false, image_url: "", image_alt: "", image_gallery: [],
  description: "", is_featured: false, is_top_seller: false, stock: 0,
  active: true, sort_order: 100
};

const FAMILY_LABELS = {
  gama_domestica: "Gama Doméstica",
  gama_comercial: "Gama Comercial",
  gama_otros: "Gama Otros",
};

const CATEGORY_LABELS = {
  monosplit: "Monosplit",
  multisplit_2x1: "Multisplit 2x1",
  multisplit_3x1: "Multisplit 3x1",
  multisplit_4x1: "Multisplit 4x1",
  multisplit_5x1: "Multisplit 5x1",
  conductos: "Conductos",
  cassette: "Cassette",
  portatil: "Portátil",
  accesorio: "Accesorio"
};

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterActive, setFilterActive] = useState("all");
  const [editProduct, setEditProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("sort_order", 200)
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        price: parseFloat(data.price) || 0,
        price_with_installation: parseFloat(data.price_with_installation) || undefined,
        power_kw: parseFloat(data.power_kw) || undefined,
        area_min_m2: parseFloat(data.area_min_m2) || undefined,
        area_max_m2: parseFloat(data.area_max_m2) || undefined,
        noise_db: parseFloat(data.noise_db) || undefined,
        stock: parseInt(data.stock) || 0,
        sort_order: parseInt(data.sort_order) || 100,
      };
      return data.id
        ? base44.entities.Product.update(data.id, payload)
        : base44.entities.Product.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowForm(false);
      setEditProduct(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] })
  });

  const toggleActive = (p) => saveMutation.mutate({ ...p, active: !p.active });

  let filtered = products;
  if (filterCat !== "all") filtered = filtered.filter(p => p.category === filterCat);
  if (filterActive === "active") filtered = filtered.filter(p => p.active !== false);
  if (filterActive === "inactive") filtered = filtered.filter(p => p.active === false);
  filtered = filtered.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase()) ||
    p.model_code?.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setEditProduct({ ...EMPTY_PRODUCT }); setShowForm(true); };
  const openEdit = (p) => { setEditProduct({ ...p, image_gallery: p.image_gallery || [] }); setShowForm(true); };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto..." className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="bg-[#00509E] hover:bg-[#003366] text-white gap-2">
          <Plus className="w-4 h-4" /> Nuevo producto
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 font-semibold text-gray-600">Producto</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Gama / Categoría</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Precio</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Orden</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay productos</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className={`border-b hover:bg-gray-50 ${p.active === false ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image_url && <img src={p.image_url} className="w-10 h-10 object-contain rounded-lg border bg-gray-50" alt={p.image_alt || ""} />}
                      <div>
                        <div className="font-medium text-[#003366]">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                   <div className="flex flex-col gap-1">
                     {p.product_family && <Badge className="bg-blue-50 text-blue-700 text-xs w-fit">{FAMILY_LABELS[p.product_family] || p.product_family}</Badge>}
                     <Badge variant="outline">{CATEGORY_LABELS[p.category] || p.category}</Badge>
                   </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{p.price?.toLocaleString("es-ES")}€</td>
                  <td className="px-4 py-3 text-gray-500">{p.sort_order ?? 100}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {p.is_featured && <Badge className="bg-blue-100 text-blue-700 text-xs">Destacado</Badge>}
                      {p.is_top_seller && <Badge className="bg-amber-100 text-amber-700 text-xs">Top</Badge>}
                      {p.has_wifi && <Wifi className="w-4 h-4 text-gray-400" />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleActive(p)} title={p.active !== false ? "Desactivar" : "Activar"}>
                        {p.active !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50"
                        onClick={() => confirm("¿Eliminar producto?") && deleteMutation.mutate(p.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct?.id ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <ProductForm
              product={editProduct}
              onChange={setEditProduct}
              onSave={() => saveMutation.mutate(editProduct)}
              saving={saveMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductForm({ product, onChange, onSave, saving }) {
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const set = (field, value) => onChange({ ...product, [field]: value });

  const handleMainUpload = async (file) => {
    setUploadingMain(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("image_url", file_url);
    setUploadingMain(false);
  };

  const handleGalleryUpload = async (files) => {
    setUploadingGallery(true);
    const urls = await Promise.all(Array.from(files).map(f => base44.integrations.Core.UploadFile({ file: f }).then(r => r.file_url)));
    set("image_gallery", [...(product.image_gallery || []), ...urls]);
    setUploadingGallery(false);
  };

  const removeGallery = (idx) => set("image_gallery", (product.image_gallery || []).filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Nombre *</Label>
          <Input value={product.name} onChange={e => set("name", e.target.value)} placeholder="Nombre completo (ej: MSZ-AP 2.5kW)" />
        </div>
        <div className="col-span-2">
          <Label>Código de modelo <span className="text-gray-400 font-normal text-xs">— identifica la serie (ej: MSZ-AP)</span></Label>
          <Input value={product.model_code || ""} onChange={e => set("model_code", e.target.value)} placeholder="Ej: MSZ-AP, FTXB, AMS09..." />
        </div>
        <div>
          <Label>Gama *</Label>
          <Select value={product.product_family || ""} onValueChange={v => set("product_family", v)}>
            <SelectTrigger><SelectValue placeholder="Selecciona gama..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gama_domestica">Gama Doméstica</SelectItem>
              <SelectItem value="gama_comercial">Gama Comercial</SelectItem>
              <SelectItem value="gama_otros">Gama Otros</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Categoría *</Label>
          <Select value={product.category} onValueChange={v => set("category", v)}>
            <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monosplit">Monosplit</SelectItem>
              <SelectItem value="multisplit_2x1">Multisplit 2x1</SelectItem>
              <SelectItem value="multisplit_3x1">Multisplit 3x1</SelectItem>
              <SelectItem value="multisplit_4x1">Multisplit 4x1</SelectItem>
              <SelectItem value="multisplit_5x1">Multisplit 5x1</SelectItem>
              <SelectItem value="conductos">Conductos</SelectItem>
              <SelectItem value="cassette">Cassette</SelectItem>
              <SelectItem value="portatil">Portátil</SelectItem>
              <SelectItem value="accesorio">Accesorio</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Marca</Label>
          <Input value={product.brand || ""} onChange={e => set("brand", e.target.value)} placeholder="Daikin, Mitsubishi..." />
        </div>
        <div>
          <Label>Precio (€) *</Label>
          <Input type="number" value={product.price} onChange={e => set("price", e.target.value)} />
        </div>
        <div>
          <Label>Precio en oferta (€) <span className="text-gray-400 font-normal text-xs">— deja vacío si no hay oferta</span></Label>
          <Input type="number" value={product.sale_price || ""} onChange={e => set("sale_price", e.target.value === "" ? null : parseFloat(e.target.value))} placeholder="Ej: 329.99" />
        </div>
        <div>
          <Label>Potencia (kW)</Label>
          <Input type="number" value={product.power_kw || ""} onChange={e => set("power_kw", e.target.value)} />
        </div>
        <div>
          <Label>Eficiencia energética</Label>
          <Select value={product.energy_rating || ""} onValueChange={v => set("energy_rating", v)}>
            <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
            <SelectContent>
              {["A+++", "A++", "A+", "A", "B", "C"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Área mín. (m²)</Label>
          <Input type="number" value={product.area_min_m2 || ""} onChange={e => set("area_min_m2", e.target.value)} />
        </div>
        <div>
          <Label>Área máx. (m²)</Label>
          <Input type="number" value={product.area_max_m2 || ""} onChange={e => set("area_max_m2", e.target.value)} />
        </div>
        <div>
          <Label>Ruido (dB)</Label>
          <Input type="number" value={product.noise_db || ""} onChange={e => set("noise_db", e.target.value)} />
        </div>
        <div>
          <Label>Stock</Label>
          <Input type="number" value={product.stock || 0} onChange={e => set("stock", e.target.value)} />
        </div>
        <div>
          <Label>Orden (sort_order)</Label>
          <Input type="number" value={product.sort_order ?? 100} onChange={e => set("sort_order", e.target.value)} />
        </div>
      </div>

      {/* Imagen principal */}
      <div>
        <Label>Imagen principal (portada)</Label>
        <div className="flex items-center gap-3 mt-2">
          {product.image_url && (
            <img src={product.image_url} className="h-16 w-16 object-contain rounded-lg border bg-gray-50" alt="" />
          )}
          <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
            <Upload className="w-4 h-4" />
            {uploadingMain ? "Subiendo..." : "Subir imagen"}
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleMainUpload(e.target.files[0])} />
          </label>
          <Input className="flex-1" value={product.image_url || ""} onChange={e => set("image_url", e.target.value)} placeholder="O pega URL..." />
        </div>
        <div className="mt-2">
          <Label className="text-xs text-gray-500">ALT (SEO)</Label>
          <Input className="mt-1" value={product.image_alt || ""} onChange={e => set("image_alt", e.target.value)} placeholder="Descripción de la imagen..." />
        </div>
      </div>

      {/* Galería */}
      <div>
        <Label>Galería de imágenes</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {(product.image_gallery || []).map((url, i) => (
            <div key={i} className="relative group">
              <img src={url} className="h-16 w-16 object-contain rounded border bg-gray-50" alt="" />
              <button className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeGallery(i)}>✕</button>
            </div>
          ))}
          <label className="h-16 w-16 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-gray-50">
            <Upload className="w-5 h-5 text-gray-400" />
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files?.length && handleGalleryUpload(e.target.files)} />
          </label>
        </div>
        {uploadingGallery && <p className="text-xs text-gray-400 mt-1">Subiendo imágenes...</p>}
      </div>

      <div className="col-span-2">
        <Label>Descripción (pestaña "Descripción")</Label>
        <Textarea value={product.description || ""} onChange={e => set("description", e.target.value)} rows={4} placeholder="Descripción general del producto..." />
      </div>

      {/* Especificaciones técnicas */}
      <div>
        <Label>Especificaciones técnicas (pestaña "Especific.")</Label>
        <div className="mt-2 space-y-2">
          {(product.specs || []).map((spec, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input value={spec.label} onChange={e => {
                const s = [...(product.specs || [])];
                s[i] = { ...s[i], label: e.target.value };
                set("specs", s);
              }} placeholder="Etiqueta (ej: Potencia)" className="w-40" />
              <Input value={spec.value} onChange={e => {
                const s = [...(product.specs || [])];
                s[i] = { ...s[i], value: e.target.value };
                set("specs", s);
              }} placeholder="Valor (ej: 2.5 kW)" className="flex-1" />
              <button onClick={() => set("specs", (product.specs || []).filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => set("specs", [...(product.specs || []), { label: "", value: "" }])}>
            <PlusCircle className="w-4 h-4 mr-1" /> Añadir especificación
          </Button>
        </div>
      </div>

      {/* Instalación */}
      <div>
        <Label>Detalles de instalación (pestaña "Instalación")</Label>
        <Textarea value={product.installation_details || ""} onChange={e => set("installation_details", e.target.value)} rows={4} placeholder="Describe qué incluye la instalación estándar..." className="mt-1" />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="featured" checked={product.is_featured} onChange={e => set("is_featured", e.target.checked)} />
          <Label htmlFor="featured">Destacado</Label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="topseller" checked={product.is_top_seller} onChange={e => set("is_top_seller", e.target.checked)} />
          <Label htmlFor="topseller">Top seller</Label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="wifi" checked={product.has_wifi} onChange={e => set("has_wifi", e.target.checked)} />
          <Label htmlFor="wifi">WiFi</Label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="installation_included" checked={product.installation_included === true} onChange={e => set("installation_included", e.target.checked)} />
          <Label htmlFor="installation_included">Instalación incluida</Label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="active" checked={product.active !== false} onChange={e => set("active", e.target.checked)} />
          <Label htmlFor="active">Activo</Label>
        </div>
      </div>

      <Button onClick={onSave} disabled={saving || !product.name || !product.category || product.price === "" || product.price === undefined || product.price === null}
        className="w-full bg-[#00509E] hover:bg-[#003366] text-white">
        {saving ? "Guardando..." : "Guardar producto"}
      </Button>
    </div>
  );
}