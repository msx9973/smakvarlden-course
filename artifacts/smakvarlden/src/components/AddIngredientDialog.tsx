import { useCreateIngredient, getListIngredientsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { useI18n, INGREDIENT_CATEGORIES } from "@/lib/i18n";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface SpoonIngredient { id: number; name: string; }

function useIngredientSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<SpoonIngredient[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setSuggestions([]); return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`${BASE}/api/spoonacular/ingredients/autocomplete?query=${encodeURIComponent(query)}&number=6`);
        if (r.ok) setSuggestions(await r.json());
      } catch { /* ignore */ }
    }, 400);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query]);

  return suggestions;
}

const schema = z.object({
  name: z.string().min(1, "Ange ett namn"),
  category: z.string().min(1, "Välj kategori"),
  unit: z.string().min(1, "Ange enhet"),
  currentPriceSek: z.coerce.number().min(0),
  supplier: z.string().optional(),
});

const UNITS = ["kg", "g", "liter", "dl", "st", "msk", "tsk", "kruka"];

export function AddIngredientDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [nameInput, setNameInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = useIngredientSuggestions(nameInput);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", category: "", unit: "kg", currentPriceSek: 0, supplier: "" },
  });

  const create = useCreateIngredient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListIngredientsQueryKey() });
        toast({ title: t("Ingrediens tillagd!") });
        onClose();
        form.reset();
        setNameInput("");
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">{t("Ny ingrediens")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => create.mutate({ data }))} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>{t("Namn")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      field.onChange(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    autoComplete="off"
                  />
                </FormControl>
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-lg"
                    style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)" }}>
                    {suggestions.map((s) => (
                      <li key={s.id}
                        className="px-4 py-2.5 text-[13px] cursor-pointer hover:opacity-80 transition-opacity capitalize"
                        style={{ color: "var(--sv-text)" }}
                        onMouseDown={() => {
                          setNameInput(s.name);
                          field.onChange(s.name);
                          setShowSuggestions(false);
                        }}>
                        {s.name}
                      </li>
                    ))}
                  </ul>
                )}
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
                      {INGREDIENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(c)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="unit" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Enhet")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={t("Välj")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="currentPriceSek" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Pris (kr per enhet)")}</FormLabel>
                <FormControl><Input type="number" step="0.01" min={0} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="supplier" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Leverantör (valfritt)")}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>{t("Avbryt")}</Button>
              <Button type="submit" disabled={create.isPending}>{t("Spara")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
