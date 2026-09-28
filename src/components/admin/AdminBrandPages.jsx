import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, ExternalLink, Package } from "lucide-react";
import { Link } from "react-router-dom";

const BRAND_EMPTY = {
  name: "", slug: "", logo_url: "", hero_image_url: "",
  hero_title: "", hero_subtitle: "", intro_title: "", intro_text: "",
  configurator_title: "", configurator_subtitle: "", configurator_hint1: "", configurator_hint2: "",
  cta_title: "", cta_text: "", seo_title: "", seo_description: "",
  active: true, sort_order: 100
};

function storageSlug(value, fallback = "general") {
  return String(value || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || fallback;
}

const CATEGORY_LABELS = {
  monosplit: "Monosplit", multisplit: "Multisplit", conductos: "Conductos",
  cassette: "Cassette", portatil: "Portátil", accesorio: "Accesorio"
};

export default function AdminBrandPages() {
  const queryClient = useQueryClient();
  const [editBrand, setEditBrand] = useState(null);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [editProduct, setEditProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);

  // Brands
  const { data: brands = [], isLoading: loadingBrands } = useQuery({
    queryKey: ["brand_pages"],
    queryFn: () => base44.entities.BrandPage.list("sort_order", 100),
  });

  const saveBrandMutation = useMutation({
    mutationFn: (data) => data.id
      ? base44.entities.BrandPage.update(data.id, data)
      : base44.entities.BrandPage.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["brand_pages"] }); setShowBrandForm(false); }
  });

  const deleteBrandMutation = useMutation({
    mutationFn: (id) => base44.entities.BrandPage.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brand_pages"] })
  });

  const toggleBrand = (b) => saveBrandMutation.mutate({ ...b, active: !b.active });

  // Products
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("sort_order", 300),
  });

  const saveProductMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.update(data.id, {
      category: data.category,
      price: parseFloat(data.price) || 0,
      sale_price: data.sale_price ? parseFloat(data.sale_price) : null,
      price_with_installation: data.price_with_installation ? parseFloat(data.price_with_installation) : null,
      image_url: data.image_url,
      active: data.active,
      sort_order: parseInt(data.sort_order) || 100,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products"] }); setShowProductForm(false); }
  });

  const toggleProduct = (p) => saveProductMutation.mutate({ ...p, active: !p.active });

  // Filter products
  const brandNames = [...new Set(brands.map(b => b.name))].sort();
  const filteredProducts = products.filter(p => {
    const brandMatch = filterBrand === "all" || p.brand === filterBrand;
    const catMatch = filterCat === "all" || p.category === filterCat;
    return brandMatch && catMatch;
  });

  return (
    <div>
      <Tabs defaultValue="brands">
        <TabsList className="mb-6 bg-white shadow-sm rounded-xl p-1">
          <TabsTrigger value="brands" className="rounded-lg">Páginas de marca</TabsTrigger>
          <TabsTrigger value="products" className="rounded-lg">Productos por marca</TabsTrigger>
        </TabsList>

        {/* TAB MARCAS */}
        <TabsContent value="brands">
          <div className="flex justify-between items-center mb-5">
            <p className="text-sm text-gray-500">{brands.length} marcas configuradas</p>
            <Button onClick={() => { setEditBrand({ ...BRAND_EMPTY }); setShowBrandForm(true); }} className="bg-[#00509E] hover:bg-[#003366] text-white gap-2">
              <Plus className="w-4 h-4" /> Nueva marca
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600">Marca</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">URL</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Hero</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Productos</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Estado</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingBrands ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Cargando...</td></tr>
                ) : brands.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay marcas configuradas</td></tr>
                ) : brands.map(b => {
                  const productCount = products.filter(p => p.brand === b.name).length;
                  return (
                    <tr key={b.id} className={`border-b hover:bg-gray-50 ${!b.active ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {b.logo_url && <img src={b.logo_url} alt={b.name} className="h-8 w-16 object-contain rounded border bg-gray-50 p-1" />}
                          <span className="font-medium text-[#003366]">{b.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">/marca/{b.slug}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{b.hero_title || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium flex items-center gap-1 w-fit">
                          <Package className="w-3 h-3" /> {productCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${b.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {b.active ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link to={`/marca/${b.slug}`} target="_blank">
                            <Button size="sm" variant="outline" title="Ver página"><ExternalLink className="w-3 h-3" /></Button>
                          </Link>
                          <Button size="sm" variant="outline" onClick={() => toggleBrand(b)} title={b.active ? "Desactivar" : "Activar"}>
                            {b.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setEditBrand({ ...b }); setShowBrandForm(true); }}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50"
                            onClick={() => confirm("¿Eliminar esta marca?") && deleteBrandMutation.mutate(b.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* TAB PRODUCTOS */}
        <TabsContent value="products">
          {/* Filtros */}
          <div className="flex flex-wrap gap-3 mb-5">
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger className="w-44 bg-white"><SelectValue placeholder="Todas las marcas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las marcas</SelectItem>
                {brandNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-44 bg-white"><SelectValue placeholder="Todas las categorías" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 self-center">{filteredProducts.length} productos</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b text-left">
                    <th className="px-4 py-3 font-semibold text-gray-600">Producto</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Marca</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Categoría</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Precio</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Con instalación</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Orden</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Estado</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Editar</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingProducts ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">Cargando...</td></tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">No hay productos</td></tr>
                  ) : filteredProducts.map(p => (
                    <tr key={p.id} className={`border-b hover:bg-gray-50 ${p.active === false ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {p.image_url && <img src={p.image_url} className="w-9 h-9 object-contain rounded border bg-gray-50" alt="" />}
                          <span className="font-medium text-[#003366] text-xs max-w-[200px] truncate">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{p.brand || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[p.category] || p.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold">{p.price?.toFixed(2)} €</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{p.price_with_installation ? `${p.price_with_installation.toFixed(2)} €` : "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{p.sort_order ?? 100}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleProduct(p)} className={`text-xs px-2 py-1 rounded-full font-medium ${p.active !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {p.active !== false ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" onClick={() => { setEditProduct({ ...p }); setShowProductForm(true); }}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog editar marca */}
      <Dialog open={showBrandForm} onOpenChange={setShowBrandForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editBrand?.id ? "Editar marca" : "Nueva marca"}</DialogTitle>
          </DialogHeader>
          {editBrand && (
            <BrandForm
              brand={editBrand}
              onChange={setEditBrand}
              onSave={() => saveBrandMutation.mutate(editBrand)}
              saving={saveBrandMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog editar producto */}
      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <ProductQuickForm
              product={editProduct}
              onChange={setEditProduct}
              onSave={() => saveProductMutation.mutate(editProduct)}
              saving={saveProductMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BrandForm({ brand, onChange, onSave, saving }) {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const set = (field, value) => onChange({ ...brand, [field]: value });

  const uploadLogo = async (file) => {
    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({
      file,
      type: "public_brand_asset",
      brandSlug: storageSlug(brand.slug || brand.name),
      kind: "logo",
      entityId: brand.id,
    });
    set("logo_url", file_url);
    setUploadingLogo(false);
  };

  const uploadHero = async (file) => {
    setUploadingHero(true);
    const { file_url } = await base44.integrations.Core.UploadFile({
      file,
      type: "public_brand_asset",
      brandSlug: storageSlug(brand.slug || brand.name),
      kind: "hero",
      entityId: brand.id,
    });
    set("hero_image_url", file_url);
    setUploadingHero(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nombre *</Label>
          <Input value={brand.name} onChange={e => set("name", e.target.value)} placeholder="Daikin" />
        </div>
        <div>
          <Label>Slug *</Label>
          <Input value={brand.slug} onChange={e => set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="daikin" />
        </div>
      </div>

      <div>
        <Label>Logo</Label>
        <div className="flex items-center gap-3 mt-1">
          {brand.logo_url && <img src={brand.logo_url} alt="" className="h-10 w-24 object-contain rounded border bg-gray-50 p-1" />}
          <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 shrink-0">
            <Upload className="w-4 h-4" /> {uploadingLogo ? "Subiendo..." : "Subir"}
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadLogo(e.target.files[0])} />
          </label>
          <Input value={brand.logo_url || ""} onChange={e => set("logo_url", e.target.value)} placeholder="O pega URL..." className="flex-1" />
        </div>
      </div>

      <div>
        <Label>Imagen de fondo (hero)</Label>
        <div className="flex items-center gap-3 mt-1">
          {brand.hero_image_url && <img src={brand.hero_image_url} alt="" className="h-10 w-16 object-cover rounded border shrink-0" />}
          <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 shrink-0">
            <Upload className="w-4 h-4" /> {uploadingHero ? "Subiendo..." : "Subir"}
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadHero(e.target.files[0])} />
          </label>
          <Input value={brand.hero_image_url || ""} onChange={e => set("hero_image_url", e.target.value)} placeholder="O pega URL..." className="flex-1" />
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hero</p>
        <div>
          <Label>Título</Label>
          <Input value={brand.hero_title || ""} onChange={e => set("hero_title", e.target.value)} />
        </div>
        <div>
          <Label>Subtítulo</Label>
          <Input value={brand.hero_subtitle || ""} onChange={e => set("hero_subtitle", e.target.value)} />
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Intro</p>
        <div>
          <Label>Título</Label>
          <Input value={brand.intro_title || ""} onChange={e => set("intro_title", e.target.value)} />
        </div>
        <div>
          <Label>Texto</Label>
          <Textarea value={brand.intro_text || ""} onChange={e => set("intro_text", e.target.value)} rows={3} />
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Configurador de producto</p>
        <div>
          <Label>Título</Label>
          <Input value={brand.configurator_title || ""} onChange={e => set("configurator_title", e.target.value)} placeholder="Introduce la información y calcula el producto adecuado para ti." />
        </div>
        <div>
          <Label>Subtítulo / descripción</Label>
          <Textarea value={brand.configurator_subtitle || ""} onChange={e => set("configurator_subtitle", e.target.value)} rows={2} placeholder="Te ayudamos a elegir el mejor producto según tus necesidades..." />
        </div>
        <div>
          <Label>Pista 1</Label>
          <Input value={brand.configurator_hint1 || ""} onChange={e => set("configurator_hint1", e.target.value)} placeholder="· Orientación del espacio a acondicionar" />
        </div>
        <div>
          <Label>Pista 2</Label>
          <Input value={brand.configurator_hint2 || ""} onChange={e => set("configurator_hint2", e.target.value)} placeholder="· Superficie total del espacio y, de ser posible, de las diferentes estancias." />
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">CTA Final</p>
        <div>
          <Label>Título</Label>
          <Input value={brand.cta_title || ""} onChange={e => set("cta_title", e.target.value)} />
        </div>
        <div>
          <Label>Texto</Label>
          <Textarea value={brand.cta_text || ""} onChange={e => set("cta_text", e.target.value)} rows={2} />
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SEO</p>
        <div>
          <Label>Meta title</Label>
          <Input value={brand.seo_title || ""} onChange={e => set("seo_title", e.target.value)} />
        </div>
        <div>
          <Label>Meta descripción</Label>
          <Textarea value={brand.seo_description || ""} onChange={e => set("seo_description", e.target.value)} rows={2} />
        </div>
      </div>

      <div className="flex items-center gap-6 border-t pt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={brand.active !== false} onChange={e => set("active", e.target.checked)} />
          <span className="text-sm">Activa</span>
        </label>
        <div className="flex items-center gap-2">
          <Label className="shrink-0">Orden</Label>
          <Input type="number" value={brand.sort_order ?? 100} onChange={e => set("sort_order", parseInt(e.target.value) || 100)} className="w-20" />
        </div>
      </div>

      <Button onClick={onSave} disabled={saving || !brand.name || !brand.slug} className="w-full bg-[#00509E] hover:bg-[#003366] text-white">
        {saving ? "Guardando..." : "Guardar marca"}
      </Button>
    </div>
  );
}

function ProductQuickForm({ product, onChange, onSave, saving }) {
  const [uploadingImg, setUploadingImg] = useState(false);
  const set = (field, value) => onChange({ ...product, [field]: value });

  const uploadImg = async (file) => {
    setUploadingImg(true);
    const { file_url } = await base44.integrations.Core.UploadFile({
      file,
      type: "public_product_image",
      kind: "main",
      brandSlug: storageSlug(product.brand),
      productSlug: storageSlug(product.slug || product.model_code || product.name),
      entityId: product.id,
    });
    set("image_url", file_url);
    setUploadingImg(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="font-semibold text-[#003366] text-sm mb-1">{product.name}</p>
        <p className="text-xs text-gray-400">{product.brand}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Categoría</Label>
          <Select value={product.category} onValueChange={v => set("category", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Orden</Label>
          <Input type="number" value={product.sort_order ?? 100} onChange={e => set("sort_order", e.target.value)} />
        </div>
        <div>
          <Label>Precio (€)</Label>
          <Input type="number" value={product.price || ""} onChange={e => set("price", e.target.value)} />
        </div>
        <div>
          <Label>Precio oferta (€)</Label>
          <Input type="number" value={product.sale_price || ""} onChange={e => set("sale_price", e.target.value)} placeholder="Vacío = sin oferta" />
        </div>
        <div className="col-span-2">
          <Label>Precio con instalación (€)</Label>
          <Input type="number" value={product.price_with_installation || ""} onChange={e => set("price_with_installation", e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Imagen</Label>
        <div className="flex items-center gap-3 mt-1">
          {product.image_url && <img src={product.image_url} alt="" className="h-12 w-12 object-contain rounded border bg-gray-50" />}
          <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 shrink-0">
            <Upload className="w-4 h-4" /> {uploadingImg ? "Subiendo..." : "Subir"}
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImg(e.target.files[0])} />
          </label>
          <Input value={product.image_url || ""} onChange={e => set("image_url", e.target.value)} placeholder="O pega URL..." className="flex-1" />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={product.active !== false} onChange={e => set("active", e.target.checked)} />
        <span className="text-sm">Producto activo</span>
      </label>

      <Button onClick={onSave} disabled={saving} className="w-full bg-[#00509E] hover:bg-[#003366] text-white">
        {saving ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  );
}
