"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

interface Commune {
  code: string;
  nom: string;
  zone: number;
}

const ZONE_LABELS: Record<number, string> = {
  1: "Tres sous-dotee",
  2: "Sous-dotee",
  3: "Intermediaire",
  4: "Tres dotee",
  5: "Sur-dotee",
  0: "Non disponible",
};

const ZONE_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "bg-red-800", text: "text-white", border: "border-red-900" },
  2: { bg: "bg-orange-500", text: "text-white", border: "border-orange-600" },
  3: { bg: "bg-yellow-400", text: "text-gray-900", border: "border-yellow-500" },
  4: { bg: "bg-green-400", text: "text-gray-900", border: "border-green-500" },
  5: { bg: "bg-green-800", text: "text-white", border: "border-green-900" },
  0: { bg: "bg-gray-400", text: "text-white", border: "border-gray-500" },
};

const ZONE_DESCRIPTIONS: Record<number, string> = {
  1: "Votre commune est classee en zone tres sous-dotee. C'est une zone prioritaire ou l'offre de soins infirmiers est tres insuffisante par rapport aux besoins de la population. Des aides significatives sont disponibles pour encourager l'installation.",
  2: "Votre commune est classee en zone sous-dotee. L'offre de soins infirmiers y est insuffisante. Des aides a l'installation sont disponibles pour les infirmieres souhaitant s'y installer.",
  3: "Votre commune est classee en zone intermediaire. L'offre de soins infirmiers y est equilibree. L'installation est libre, sans aide ni restriction particuliere.",
  4: "Votre commune est classee en zone tres dotee. L'offre de soins infirmiers y est superieure a la moyenne. L'installation reste libre mais aucune incitation n'est proposee.",
  5: "Votre commune est classee en zone sur-dotee. L'offre de soins infirmiers y est excedentaire. Le conventionnement est conditionne au depart prealable d'un confrere (regle \"1 pour 1\").",
  0: "Les donnees de zonage ne sont pas disponibles pour cette commune.",
};

const ZONE_AIDES: Record<number, string[]> = {
  1: [
    "Contrat incitatif ARS",
    "Aide a l'installation (jusqu'a 37 500 EUR)",
    "Exoneration ZRR",
    "Accompagnement CPAM",
  ],
  2: [
    "Contrat d'aide a l'installation",
    "Accompagnement CPAM",
  ],
  3: ["Pas d'aide specifique, installation libre"],
  4: ["Installation libre mais pas d'incitations"],
  5: ["Conventionnement conditionne au depart d'un confrere (regle \"1 pour 1\")"],
  0: [],
};

function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function searchCommunes(communes: Commune[], query: string): Commune[] {
  if (!query || query.length < 2) return [];
  const normalized = normalize(query);
  const startsWithResults: Commune[] = [];
  const containsResults: Commune[] = [];

  for (const c of communes) {
    if (startsWithResults.length + containsResults.length >= 8) break;
    const nomNorm = normalize(c.nom);
    if (nomNorm.startsWith(normalized)) {
      startsWithResults.push(c);
    } else if (
      nomNorm.includes(normalized) ||
      c.code.startsWith(normalized)
    ) {
      containsResults.push(c);
    }
  }

  return [...startsWithResults, ...containsResults].slice(0, 8);
}

export default function ZonagePage() {
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Commune[]>([]);
  const [selected, setSelected] = useState<Commune | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/data/zonage.json")
      .then((r) => r.json())
      .then((data: Commune[]) => {
        setCommunes(data);
        setLoading(false);
      });
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      setSelected(null);
      setHighlightIndex(-1);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const results = searchCommunes(communes, value);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      }, 200);
    },
    [communes]
  );

  const selectCommune = useCallback((commune: Commune) => {
    setSelected(commune);
    setQuery(`${commune.nom} (${commune.code})`);
    setShowSuggestions(false);
    setSuggestions([]);
    setHighlightIndex(-1);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && highlightIndex >= 0) {
        e.preventDefault();
        selectCommune(suggestions[highlightIndex]);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    [showSuggestions, suggestions, highlightIndex, selectCommune]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const stats = useMemo(() => {
    if (communes.length === 0) return null;
    const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const c of communes) {
      counts[c.zone] = (counts[c.zone] || 0) + 1;
    }
    return counts;
  }, [communes]);

  const zoneColor = selected ? ZONE_COLORS[selected.zone] : null;

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#1E40AF] to-[#2563EB] text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Zonage Conventionnel Infirmier
          </h1>
          <p className="text-blue-100 text-lg mb-10">
            Decouvrez la classification de votre commune en un clic
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder={
                loading
                  ? "Chargement des donnees..."
                  : "Rechercher une commune (nom ou code INSEE)..."
              }
              disabled={loading}
              className="w-full px-5 py-4 rounded-xl text-gray-900 text-lg placeholder-gray-400 shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-60"
              aria-label="Rechercher une commune"
              autoComplete="off"
            />
            <svg
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            {/* Suggestions dropdown */}
            {showSuggestions && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
              >
                {suggestions.map((commune, index) => (
                  <button
                    key={commune.code}
                    onClick={() => selectCommune(commune)}
                    className={`w-full text-left px-5 py-3 flex items-center justify-between hover:bg-blue-50 transition-colors cursor-pointer ${
                      index === highlightIndex ? "bg-blue-50" : ""
                    }`}
                  >
                    <span className="text-gray-900 font-medium">
                      {commune.nom}
                    </span>
                    <span className="text-gray-400 text-sm ml-2">
                      {commune.code}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Result */}
      {selected && zoneColor && (
        <section className="px-4 -mt-6">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selected.nom}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    Code INSEE : {selected.code}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${zoneColor.bg} ${zoneColor.text} border ${zoneColor.border}`}
                >
                  {ZONE_LABELS[selected.zone]}
                </span>
              </div>

              <p className="text-gray-700 leading-relaxed mb-6">
                {ZONE_DESCRIPTIONS[selected.zone]}
              </p>

              {/* Aides */}
              {ZONE_AIDES[selected.zone] &&
                ZONE_AIDES[selected.zone].length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      {selected.zone <= 2
                        ? "Aides disponibles"
                        : "Conditions d'installation"}
                    </h3>
                    <ul className="space-y-2">
                      {ZONE_AIDES[selected.zone].map((aide) => (
                        <li key={aide} className="flex items-start gap-2">
                          <span className="text-[#1E40AF] mt-1 flex-shrink-0">
                            {selected.zone <= 2 ? (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </span>
                          <span className="text-gray-700">{aide}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        </section>
      )}

      {/* Comprendre le zonage */}
      <section className="px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Comprendre le zonage
          </h2>
          <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
            Le zonage conventionnel infirmier classe chaque commune selon le
            niveau d&apos;offre de soins infirmiers par rapport aux besoins de
            la population. Il determine les conditions d&apos;installation et
            les aides accessibles.
          </p>

          {/* Zone cards */}
          <div className="grid gap-4">
            {[1, 2, 3, 4, 5].map((zone) => {
              const color = ZONE_COLORS[zone];
              return (
                <div
                  key={zone}
                  className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow"
                >
                  <span
                    className={`inline-flex items-center justify-center w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${color.bg}`}
                  />
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <h3 className="font-semibold text-gray-900">
                        {ZONE_LABELS[zone]}
                      </h3>
                      {stats && (
                        <span className="text-sm text-gray-400">
                          {stats[zone]?.toLocaleString("fr-FR")} communes
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mt-1">
                      {zone === 1 &&
                        "Zone prioritaire ou l'offre est tres insuffisante. Aides significatives a l'installation."}
                      {zone === 2 &&
                        "Zone fragile avec une offre insuffisante. Aides a l'installation disponibles."}
                      {zone === 3 &&
                        "Offre equilibree. Installation libre, sans aide ni restriction."}
                      {zone === 4 &&
                        "Offre superieure a la moyenne. Installation libre, sans incitation."}
                      {zone === 5 &&
                        "Offre excedentaire. Conventionnement conditionne (regle \"1 pour 1\")."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tableau recapitulatif */}
          <div className="mt-12 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Zone
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Installation
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Aides
                  </th>
                  {stats && (
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">
                      Communes
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((zone) => {
                  const color = ZONE_COLORS[zone];
                  return (
                    <tr key={zone} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${color.bg}`}
                          />
                          <span className="font-medium text-gray-900">
                            {ZONE_LABELS[zone]}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {zone <= 2 && "Libre + aides"}
                        {zone === 3 && "Libre"}
                        {zone === 4 && "Libre"}
                        {zone === 5 && "Conditionnee"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {zone === 1 && "Contrat ARS, aide installation, ZRR"}
                        {zone === 2 && "Contrat installation, CPAM"}
                        {zone === 3 && "Aucune"}
                        {zone === 4 && "Aucune"}
                        {zone === 5 && "Aucune"}
                      </td>
                      {stats && (
                        <td className="py-3 px-4 text-right text-gray-600">
                          {stats[zone]?.toLocaleString("fr-FR")}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-center text-gray-400 text-sm mt-8">
            Source : Donnees CartoSante - ARS, 2024
          </p>
        </div>
      </section>

      {/* Stats rapides */}
      {stats && (
        <section className="px-4 pb-16">
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((zone) => {
                const color = ZONE_COLORS[zone];
                return (
                  <div
                    key={zone}
                    className="text-center p-4 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <span
                      className={`inline-block w-3 h-3 rounded-full mb-2 ${color.bg}`}
                    />
                    <div className="text-2xl font-bold text-gray-900">
                      {stats[zone]?.toLocaleString("fr-FR")}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {ZONE_LABELS[zone]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
