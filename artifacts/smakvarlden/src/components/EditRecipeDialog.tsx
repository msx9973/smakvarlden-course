import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n, RECIPE_CATEGORIES } from "@/lib/i18n";
import { apiFetch } from "@/lib/auth";

type EditableRecipe = {
  id: number;
  name: string;
  description?: string;
  category: string;
  servings: number;
  sellingPriceSek: number;
  isShared: boolean;
};

type EditRecipeDialogProps = {
  open: boolean;
  recipe: EditableRecipe | null;
  onClose: () => void;
};

export function EditRecipeDialog({ open, recipe, onClose }: EditRecipeDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    servings: 4,
    sellingPriceSek: 0,
    isShared: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!recipe) return;
    setForm({
      name: recipe.name,
      description: recipe.description ?? "",
      category: recipe.category,
      servings: recipe.servings,
      sellingPriceSek: recipe.sellingPriceSek,
      isShared: recipe.isShared,
    });
  }, [recipe]);

  async function save() {
    if (!recipe) return;
    setSaving(true);
    try {
      await apiFetch(`/recipes/${recipe.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          servings: Number(form.servings) || 1,
          sellingPriceSek: Number(form.sellingPriceSek) || 0,
        }),
      });
      toast({ title: t("Recept uppdaterat") });
      onClose();
    } catch (error) {
      toast({
        title: t("Fel uppstod."),
        description: error instanceof Error ? error.message : t("Något gick fel."),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">{t("Redigera recept")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("Receptnamn")}</label>
            <Input value={form.name} onChange={(e) => setForm((next) => ({ ...next, name: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("Beskrivning")}</label>
            <Textarea value={form.description} onChange={(e) => setForm((next) => ({ ...next, description: e.target.value }))} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("Kategori")}</label>
              <Select value={form.category} onValueChange={(category) => setForm((next) => ({ ...next, category }))}>
                <SelectTrigger><SelectValue placeholder={t("Välj kategori")} /></SelectTrigger>
                <SelectContent>
                  {RECIPE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>{t(category)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("Portioner")}</label>
              <Input type="number" min={1} value={form.servings} onChange={(e) => setForm((next) => ({ ...next, servings: Number(e.target.value) }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("Försäljningspris (kr)")}</label>
            <Input type="number" min={0} step="0.01" value={form.sellingPriceSek} onChange={(e) => setForm((next) => ({ ...next, sellingPriceSek: Number(e.target.value) }))} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isShared} onChange={(e) => setForm((next) => ({ ...next, isShared: e.target.checked }))} />
            {t("Dela recept i community")}
          </label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>{t("Avbryt")}</Button>
          <Button type="button" onClick={save} disabled={saving || !recipe}>{saving ? t("Sparar...") : t("Spara")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
