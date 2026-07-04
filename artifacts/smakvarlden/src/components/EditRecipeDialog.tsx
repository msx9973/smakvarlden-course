import { useEffect } from "react";
import { useUpdateRecipe, getListRecipesQueryKey, type Recipe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useI18n, RECIPE_CATEGORIES, DIET_CATEGORIES, ALLERGY_CATEGORIES } from "@/lib/i18n";

const schema = z.object({
  name: z.string().min(1, "Ange ett namn"),
  description: z.string().optional(),
  category: z.string().min(1, "Välj kategori"),
  servings: z.coerce.number().int().min(1),
  sellingPriceSek: z.coerce.number().min(0),
  isShared: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;
type EditableRecipe = Pick<Recipe, "id" | "name" | "description" | "category" | "servings" | "sellingPriceSek" | "isShared">;

function recipeDefaults(recipe: EditableRecipe): FormValues {
  return {
    name: recipe.name,
    description: recipe.description ?? "",
    category: recipe.category,
    servings: recipe.servings,
    sellingPriceSek: recipe.sellingPriceSek,
    isShared: recipe.isShared,
  };
}

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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: recipe
      ? recipeDefaults(recipe)
      : { name: "", description: "", category: "", servings: 4, sellingPriceSek: 0, isShared: false },
  });

  useEffect(() => {
    if (recipe) form.reset(recipeDefaults(recipe));
  }, [form, recipe]);

  const update = useUpdateRecipe({
    mutation: {
      onSuccess: (_updated, variables) => {
        queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["getRecipe", variables.id] });
        toast({ title: t("Recept uppdaterat!") });
        onClose();
      },
    },
  });

  if (!recipe) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">{t("Redigera recept")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => update.mutate({ id: recipe.id, data }))} className="space-y-4">
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
                        {RECIPE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(c)}</SelectItem>)}
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>{t("Kost")}</SelectLabel>
                        {DIET_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(c)}</SelectItem>)}
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>{t("Allergi")}</SelectLabel>
                        {ALLERGY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(c)}</SelectItem>)}
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>{t("Avbryt")}</Button>
              <Button type="submit" disabled={update.isPending}>{t("Spara")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
