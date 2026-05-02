"use client";

import { motion } from "framer-motion";
import { BookOpen, Sparkles, Tag, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { API_URL, formatRelativeTime } from "@/lib/utils";

interface Recipe {
  hash: string;
  title: string;
  framework: string | null;
  category: string | null;
  confidence: number;
  uses: number;
  last_used: string | null;
}

interface CookbookData {
  overview: { totalRecipes: number; categories: number };
  recipes: Recipe[];
  categories: { category: string; count: string }[];
}

export default function CookbookPage() {
  const [data, setData] = useState<CookbookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch(`${API_URL}/api/intelligence/cookbook`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const overview = data?.overview || { totalRecipes: 0, categories: 0 };
  const recipes = data?.recipes || [];
  const categories = data?.categories || [];

  const filtered = filter === "all" ? recipes : recipes.filter(r => r.category === filter);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Repair Cookbook</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Proven repair patterns learned from fingerprints. High-confidence recipes that can be applied deterministically.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "Recipes", value: overview.totalRecipes.toString(), icon: BookOpen, color: "text-indigo-600" },
          { label: "Categories", value: overview.categories.toString(), icon: Tag, color: "text-amber-600" },
        ].map((card) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-[var(--border-default)] p-4">
            <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
            <div className="text-xl font-bold text-[var(--text-primary)]">{card.value}</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button onClick={() => setFilter("all")} className={`px-3 py-1 text-[12px] rounded-md ${filter === "all" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)]"}`}>
            All
          </button>
          {categories.map((c) => (
            <button key={c.category} onClick={() => setFilter(c.category)} className={`px-3 py-1 text-[12px] rounded-md ${filter === c.category ? "bg-indigo-50 text-indigo-700 font-medium" : "text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)]"}`}>
              {c.category} ({c.count})
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-tertiary)] text-[13px]">
          No recipes yet. Recipes are generated from high-confidence fingerprints as CI failures are processed.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map((recipe, i) => (
            <motion.div key={recipe.hash} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-xl border border-[var(--border-default)] p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate max-w-[280px]">
                    {recipe.title}
                  </span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  recipe.confidence >= 90 ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}>
                  {recipe.confidence}%
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
                <span className="font-mono bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">{recipe.hash}</span>
                {recipe.framework && <span>{recipe.framework}</span>}
                {recipe.category && <span>{recipe.category}</span>}
                <span>{recipe.uses.toLocaleString()} uses</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
