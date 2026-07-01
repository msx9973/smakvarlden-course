import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/auth";
import { ALLERGY_CATEGORIES, DIET_CATEGORIES, RECIPE_CATEGORIES, useI18n } from "@/lib/i18n";

const schema = z.object({
  name: z.string().min(1, "Ange ett namn"),
  description: z.string().optional(),
  category: z.string().min(1, "Välj kategori"),
  servings: z.coerce.number().int().min(1),
  sellingPriceSek: z.coerce.number().min(0),
  isShared: z.boolean().optional(),
});

type RecipeForm = z.infer<typeof schema>;

type EditableRecipe = {
  id: number;
  name: string;
  description?: string;
  category: string;
  servings: number;
  sellingPriceSek: number;
  isShared: boolean;
};

export function EditRecipeDialog({
  open,
  recipe,
  onClose,
}: {
  open: boolean;
  recipe: EditableRecipe | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const form = useForm<RecipeForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      servings: 4,
      sellingPriceSek: 0,
      isShared: false,
    },
  });

  useEffect(() => {
    if (!recipe) return;
    form.reset({
      name: recipe.name,
      description: recipe.description ?? "",
      category: recipe.category,
      servings: recipe.servings,
      sellingPriceSek: recipe.sellingPriceSek,
      isShared: recipe.isShared,
    });
  }, [form, recipe]);

  async function onSubmit(data: RecipeForm) {
    if (!recipe) return;
    await apiFetch(`/recipes/${recipe.id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    toast({ title: t("Recept uppdaterat!") });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">{t("Redigera recept")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Receptnamn")}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Beskrivning (valfritt)")}</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Kategori")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={t("Välj")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>{t("Recepttyp")}</SelectLabel>
                        {RECIPE_CATEGORIES.map((category) => <SelectItem key={category} value={category}>{t(category)}</SelectItem>)}
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>{t("Kost")}</SelectLabel>
                        {DIET_CATEGORIES.map((category) => <SelectItem key={category} value={category}>{t(category)}</SelectItem>)}
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>{t("Allergi")}</SelectLabel>
                        {ALLERGY_CATEGORIES.map((category) => <SelectItem key={category} value={category}>{t(category)}</SelectItem>)}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="servings" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Portioner")}</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="sellingPriceSek" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Försäljningspris (kr)")}</FormLabel>
                <FormControl><Input type="number" step="0.01" min={0} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="isShared" render={({ field }) => (
              <FormItem className="flex items-center gap-2 rounded-lg border p-3">
                <FormControl>
                  <Checkbox checked={field.value ?? false} onCheckedChange={(checked) => field.onChange(checked === true)} />
                </FormControl>
                <FormLabel className="m-0">{t("Dela i communityt")}</FormLabel>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>{t("Avbryt")}</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>{t("Spara")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
