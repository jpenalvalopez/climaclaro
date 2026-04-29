import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Star, Eye, EyeOff, Bookmark } from "lucide-react";

const EMPTY_REVIEW = { author: "", rating: 5, text: "", city: "", verified: true, active: true, featured: false };

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editReview, setEditReview] = useState(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews"],
    queryFn: () => base44.entities.Review.list("-created_date", 100)
  });

  const saveMutation = useMutation({
    mutationFn: (data) => data.id
      ? base44.entities.Review.update(data.id, data)
      : base44.entities.Review.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setShowForm(false);
      setEditReview(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Review.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews"] })
  });

  const toggleField = (review, field) => saveMutation.mutate({ ...review, [field]: !review[field] });

  const openNew = () => { setEditReview({ ...EMPTY_REVIEW }); setShowForm(true); };
  const openEdit = (r) => { setEditReview({ ...r }); setShowForm(true); };

  return (
    <div>
      <div className="flex justify-end mb-5">
        <Button onClick={openNew} className="bg-[#00509E] hover:bg-[#003366] text-white gap-2">
          <Plus className="w-4 h-4" /> Nueva reseña
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {isLoading ? (
          <p className="text-gray-400 text-sm col-span-2">Cargando...</p>
        ) : reviews.length === 0 ? (
          <p className="text-gray-400 text-sm col-span-2">No hay reseñas</p>
        ) : reviews.map(review => (
          <div key={review.id} className={`bg-white rounded-xl p-5 shadow-sm border ${!review.active ? "opacity-50" : ""}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-semibold text-[#003366]">{review.author}</div>
                <div className="text-xs text-gray-500">{review.city}</div>
                <div className="flex gap-1 mt-1">
                  {review.featured && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Destacada</span>}
                  {!review.active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactiva</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" title={review.active ? "Desactivar" : "Activar"}
                  onClick={() => toggleField(review, "active")}>
                  {review.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </Button>
                <Button size="sm" variant="outline" title={review.featured ? "Quitar destacado" : "Destacar"}
                  className={review.featured ? "text-amber-500 border-amber-200" : ""}
                  onClick={() => toggleField(review, "featured")}>
                  <Bookmark className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(review)}>Editar</Button>
                <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50"
                  onClick={() => confirm("¿Eliminar reseña?") && deleteMutation.mutate(review.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="flex gap-0.5 mb-2">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
              ))}
            </div>
            <p className="text-sm text-gray-600 line-clamp-3">{review.text}</p>
          </div>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editReview?.id ? "Editar reseña" : "Nueva reseña"}</DialogTitle>
          </DialogHeader>
          {editReview && (
            <div className="space-y-4">
              <div>
                <Label>Autor *</Label>
                <Input value={editReview.author} onChange={e => setEditReview({...editReview, author: e.target.value})} />
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input value={editReview.city || ""} onChange={e => setEditReview({...editReview, city: e.target.value})} />
              </div>
              <div>
                <Label>Valoración</Label>
                <div className="flex gap-2 mt-1">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onClick={() => setEditReview({...editReview, rating: s})}>
                      <Star className={`w-6 h-6 ${s <= editReview.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Texto *</Label>
                <Textarea value={editReview.text} onChange={e => setEditReview({...editReview, text: e.target.value})} rows={4} />
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="rev-verified" checked={editReview.verified} onChange={e => setEditReview({...editReview, verified: e.target.checked})} />
                  <Label htmlFor="rev-verified">Verificada</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="rev-active" checked={editReview.active !== false} onChange={e => setEditReview({...editReview, active: e.target.checked})} />
                  <Label htmlFor="rev-active">Activa</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="rev-featured" checked={editReview.featured} onChange={e => setEditReview({...editReview, featured: e.target.checked})} />
                  <Label htmlFor="rev-featured">Destacada</Label>
                </div>
              </div>
              <Button onClick={() => saveMutation.mutate(editReview)}
                disabled={saveMutation.isPending || !editReview.author || !editReview.text}
                className="w-full bg-[#00509E] hover:bg-[#003366] text-white">
                {saveMutation.isPending ? "Guardando..." : "Guardar reseña"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}