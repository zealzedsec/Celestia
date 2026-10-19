#!/usr/bin/env python3
"""Build Celestia's bright-star catalog from the HYG database (v4.1, CC BY-SA 4.0).
Emits every star with mag <= 3.3 plus any star referenced by a constellation figure,
deduped by Bayer-Flamsteed key, brightest instance wins. Figure lines are emitted
using display names (proper name if the star has one, else Bayer-Flamsteed)."""
import csv, json, os, re, sys

# usage: python3 scripts/build-stars.py path/to/hyg_v41.csv [path/to/stars.ts]
_HERE = os.path.dirname(os.path.abspath(__file__))
HYG_CSV = sys.argv[1] if len(sys.argv) > 1 else os.path.join(_HERE, "hyg_v41.csv")
OUT_TS = sys.argv[2] if len(sys.argv) > 2 else os.path.join(_HERE, "..", "src", "lib", "celestial", "stars.ts")

# (abbr, display, polylines) — keys are Bayer 3-letter + IAU constellation abbr
FIGURES = [
    ("UMa", "Ursa Major", [["Alp UMa", "Bet UMa", "Gam UMa", "Del UMa", "Eps UMa", "Zet UMa", "Eta UMa"]]),
    ("UMi", "Ursa Minor", [["Alp UMi", "Bet UMi", "Gam UMi", "Zet UMi", "Eps UMi", "Del UMi", "Gam UMi", "Alp UMi"]]),
    ("Cas", "Cassiopeia", [["Bet Cas", "Alp Cas", "Gam Cas", "Del Cas", "Eps Cas"]]),
    ("Ori", "Orion", [
        ["Alp Ori", "Gam Ori"],
        ["Gam Ori", "Del Ori", "Eps Ori", "Zet Ori", "Kap Ori"],
        ["Bet Ori", "Gam Ori"],
        ["Kap Ori", "Gam Ori"] if False else [],
        ["Zet Ori", "Alp Ori"],
        ["Del Ori", "Bet Ori"],
    ]),
    ("Tau", "Taurus", [
        ["Bet Tau", "Del Tau", "Gam Tau", "Eps Tau", "Alp Tau"],
        ["Del Tau", "Eta Tau"],
    ]),
    ("Aur", "Auriga", [
        ["Alp Aur", "Eps Aur", "Iot Aur", "Bet Tau", "The Aur", "Bet Aur", "Alp Aur"],
    ]),
    ("Gem", "Gemini", [
        ["Alp Gem", "Eps Gem", "Mu Gem"],
        ["Bet Gem", "Del Gem", "Zet Gem"],
        ["Eps Gem", "Del Gem"],
    ]),
    ("CMa", "Canis Major", [
        ["Alp CMa", "Bet CMa"],
        ["Alp CMa", "Eta CMa"],
        ["Eta CMa", "Del CMa"],
        ["Del CMa", "Eps CMa"],
        ["Del CMa", "Bet CMa"],
    ]),
    ("CMi", "Canis Minor", [["Alp CMi", "Bet CMi"]]),
    ("Leo", "Leo", [
        ["Alp Leo", "Eta Leo", "Gam Leo"],
        ["Gam Leo", "Del Leo", "The Leo", "Bet Leo"],
        ["Gam Leo", "Del Leo"],
    ]),
    ("Vir", "Virgo", [
        ["Gam Vir", "Del Vir", "Bet Vir"],
        ["Gam Vir", "Eps Vir"],
        ["Gam Vir", "Alp Vir"],
    ]),
    ("Boo", "Boötes", [
        ["Alp Boo", "Eps Boo", "Del Boo", "Bet Boo", "Gam Boo", "Rho Boo", "Alp Boo"],
    ]),
    ("Sco", "Scorpius", [
        ["Bet Sco", "Nu Sco", "Del Sco", "Alp Sco", "Tau Sco", "Eps Sco"],
        ["Eps Sco", "Mu Sco"],
        ["Eps Sco", "Zet Sco", "Eta Sco", "The Sco", "Iot Sco", "Kap Sco", "Lam Sco"],
    ]),
    ("Sgr", "Sagittarius", [
        ["Gam Sgr", "Del Sgr", "Eps Sgr", "Zet Sgr", "Phi Sgr", "Del Sgr"],
        ["Phi Sgr", "Sig Sgr", "Tau Sgr", "Zet Sgr"],
    ]),
    ("Aql", "Aquila", [
        ["Gam Aql", "Bet Aql"],
        ["Alp Aql", "Bet Aql"],
        ["Alp Aql", "Zet Aql", "The Aql"],
        ["Alp Aql", "Del Aql", "Lam Aql"],
    ]),
    ("Cyg", "Cygnus", [
        ["Alp Cyg", "Gam Cyg", "Bet Cyg"],
        ["Del Cyg", "Gam Cyg", "Eps Cyg"],
    ]),
    ("Lyr", "Lyra", [
        ["Alp Lyr", "Gam Lyr"],
        ["Gam Lyr", "Del Lyr"],
        ["Gam Lyr", "Zet Lyr", "Bet Lyr", "Del Lyr"],
    ]),
    ("CrB", "Corona Borealis", [
        ["Alp CrB", "Bet CrB", "Gam CrB", "Del CrB", "Eps CrB", "The CrB", "Iot CrB"],
    ]),
    ("And", "Andromeda", [
        ["Alp And", "Bet And", "Gam And"],
        ["Bet And", "Del And"],
    ]),
    ("Per", "Perseus", [
        ["Del Per", "Eps Per", "Alp Per", "Gam Per"],
        ["Alp Per", "Bet Per"],
    ]),
    ("Peg", "Pegasus", [
        ["Alp Peg", "Bet Peg", "Alp And", "Gam Peg", "Alp Peg"],
        ["Alp Peg", "Eps Peg", "The Peg", "Eta Peg"],
    ]),
    ("Ari", "Aries", [
        ["Bet Ari", "Gam Ari"],
        ["Bet Ari", "Alp Ari"],
    ]),
    ("Lib", "Libra", [
        ["Alp Lib", "Bet Lib", "Sig Lib"],
        ["Alp Lib", "Gam Lib"],
    ]),
    ("Gru", "Grus", [
        ["Alp Gru", "Bet Gru"],
        ["Alp Gru", "Gam Gru"],
        ["Gam Gru", "Del Gru"],
    ]),
    ("Cru", "Crux", [
        ["Alp Cru", "Gam Cru"],
        ["Bet Cru", "Del Cru"],
    ]),
    ("Car", "Carina", [
        ["Alp Car", "Bet Car"],
        ["Bet Car", "Iot Car"],
        ["Iot Car", "Eps Car"],
    ]),
    ("Vel", "Vela", [
        ["Gam Vel", "Del Vel"],
        ["Del Vel", "Kap Vel"],
        ["Gam Vel", "Mu Vel"],
    ]),
    ("Cen", "Centaurus", [
        ["Alp Cen", "Bet Cen", "Eps Cen", "Gam Cen"],
    ]),
    ("Lup", "Lupus", [
        ["Del Lup", "Alp Lup", "Gam Lup", "Bet Lup"],
    ]),
    ("TrA", "Triangulum Australe", [
        ["Alp TrA", "Bet TrA", "Gam TrA", "Alp TrA"],
    ]),
    ("Crv", "Corvus", [
        ["Alp Crv", "Bet Crv", "Gam Crv", "Del Crv", "Alp Crv"],
        ["Gam Crv", "Eps Crv"],
    ]),
    ("Hya", "Hydra", [
        ["Zet Hya", "Eps Hya", "Alp Hya", "Gam Hya"],
    ]),
    ("Oph", "Ophiuchus", [
        ["Alp Oph", "Bet Oph", "Del Oph", "Eps Oph"],
        ["Del Oph", "Eta Oph"],
        ["Alp Oph", "Kap Oph"],
    ]),
    ("Ser", "Serpens", [
        ["Alp Ser", "Bet Ser"],
    ]),
    ("Her", "Hercules", [
        ["Zet Her", "Eps Her", "Pi Her", "Eta Her", "Zet Her"],
    ]),
    ("Dra", "Draco", [
        ["Bet Dra", "Gam Dra", "Xi Dra", "Nu Dra", "Bet Dra"],
        ["Gam Dra", "Eta Dra", "Zet Dra", "Del Dra", "Eps Dra", "Alp Dra"],
    ]),
    ("Cep", "Cepheus", [
        ["Zet Cep", "Eps Cep", "Alp Cep", "Bet Cep"],
        ["Alp Cep", "Eta Cep"],
        ["Zet Cep", "Del Cep", "Eps Cep"],
    ]),
    ("Del", "Delphinus", [
        ["Alp Del", "Gam Del", "Bet Del"],
        ["Alp Del", "Eps Del", "Del Del"],
    ]),
    ("Lep", "Lepus", [
        ["Bet Lep", "Alp Lep", "Eps Lep", "Mu Lep"],
    ]),
    ("Cnc", "Cancer", [
        ["Bet Cnc", "Del Cnc", "Iot Cnc"],
        ["Del Cnc", "Alp Cnc"],
    ]),
    ("Tri", "Triangulum", [
        ["Alp Tri", "Bet Tri", "Gam Tri", "Alp Tri"],
    ]),
    ("Col", "Columba", [
        ["Del Col", "Alp Col", "Bet Col"],
    ]),
    ("Phe", "Phoenix", [
        ["Alp Phe", "Bet Phe"],
        ["Alp Phe", "Gam Phe"],
    ]),
    ("Ara", "Ara", [
        ["Alp Ara", "Bet Ara"],
    ]),
    ("Cap", "Capricornus", [
        ["Alp Cap", "Bet Cap"],
    ]),
    ("Aqr", "Aquarius", [
        ["Bet Aqr", "Alp Aqr"],
        ["Alp Aqr", "Gam Aqr"],
        ["Zet Aqr", "Eta Aqr", "Del Aqr"],
        ["Del Aqr", "Lam Aqr"],
    ]),
    ("Eri", "Eridanus", [
        ["Bet Eri", "The Eri", "Gam Eri"],
    ]),
    ("Cet", "Cetus", [
        ["Alp Cet", "Gam Cet"],
        ["Zet Cet", "Bet Cet"],
    ]),
    ("CVn", "Canes Venatici", []),
    ("Pav", "Pavo", []),
    ("PsA", "Piscis Austrinus", []),
]

FIGURES = [(a, n, [ln for ln in ls if len(ln) >= 2]) for a, n, ls in FIGURES]


def norm_bf(bf):
    """'Gam2Vel' -> 'Gam Vel', 'Alp01 Cru' -> 'Alp Cru', 'Tau Tau' stays."""
    b = (bf or "").strip()
    if not b:
        return ""
    b = re.sub(r"(\d+)", " ", b)           # strip component digits
    b = re.sub(r"\s+", " ", b).strip()
    return b


def main():
    with open(HYG_CSV, newline="", encoding="utf-8") as f:
        rows = [r for r in csv.DictReader(f)]

    # drop Sol
    rows = [r for r in rows if r["proper"].strip() != "Sol"]

    def display(r):
        p = r["proper"].strip()
        if p:
            p = p.replace("RigilKentaurus", "Rigil Kentaurus").replace("Tau Ceti", "Tau Ceti")
            return p
        return norm_bf(r["bf"])

    # index by bf key AND proper name; keep brightest
    def put(m, k, r):
        if not k:
            return
        if k not in m or float(r["mag"]) < float(m[k]["mag"]):
            m[k] = r

    by_key = {}
    by_proper = {}
    for r in rows:
        put(by_key, norm_bf(r["bf"]), r)
        p = r["proper"].strip()
        if p:
            put(by_proper, p.replace("RigilKentaurus", "Rigil Kentaurus"), r)

    def resolve(name):
        return by_key.get(name) or by_proper.get(name)

    # pool: all stars mag <= 3.3 keyed by display name (brightest wins)
    pool = {}
    for r in rows:
        try:
            mag = float(r["mag"])
        except ValueError:
            continue
        if mag > 3.3:
            continue
        d = display(r)
        if d not in pool or mag < float(pool[d]["mag"]):
            pool[d] = r

    # resolve figures -> display names; add missing figure stars to pool
    resolved, still_missing = {}, []
    for abbr, name, lines in FIGURES:
        out_lines = []
        for ln in lines:
            out = []
            for n in ln:
                r = resolve(n)
                if r is None:
                    still_missing.append(f"{abbr}:{n}")
                    out = []
                    break
                out.append(display(r))
                # ensure figure stars are in the pool even if fainter than 3.3
                d = display(r)
                if d not in pool or float(r["mag"]) < float(pool[d]["mag"]):
                    pool[d] = r
            if out:
                out_lines.append(out)
        resolved[abbr] = (name, out_lines)

    print("UNRESOLVED:", json.dumps(sorted(set(still_missing)), ensure_ascii=False))

    # for figures that didn't resolve, drop them
    figures = [
        (abbr, nm, ls)
        for abbr, (nm, ls) in resolved.items()
        if ls
    ]

    catalog = []
    for d, r in pool.items():
        mag = float(r["mag"])
        spect = (r["spect"] or "").strip()
        cls = spect[:1] if spect and spect[0] in "OBAFGKMW" else "A"
        dist = 0.0
        try:
            dist = round(float(r["dist"]), 1)
        except (ValueError, TypeError):
            pass
        catalog.append({
            "name": d,
            "con": r["con"].strip(),
            "ra": round(float(r["ra"]) * 15.0, 3),  # HYG RA is hours -> degrees
            "dec": round(float(r["dec"]), 3),
            "mag": round(mag, 2),
            "cls": cls,
            "dist": dist,
        })
    catalog.sort(key=lambda s: s["mag"])

    # figure stars must never be cut by the brightness cap
    fig_names = set()
    for _, _, lines in figures:
        for ln in lines:
            fig_names.update(ln)
    catalog = [s for s in catalog if s["name"] in fig_names][:512] + \
              [s for s in catalog if s["name"] not in fig_names][:240]

    emitted = {s["name"] for s in catalog}
    # every figure star must be in the emitted catalog
    for _, _, lines in figures:
        for ln in lines:
            for n in ln:
                assert n in emitted, f"figure star not emitted: {n}"

    print(f"EMITTING {len(catalog)} stars; mags {catalog[-1]['mag']}..{catalog[0]['mag']}; {len(figures)} figures")
    with open(OUT_TS, "w", encoding="utf-8") as f:
        f.write("// Celestia — bright-star firmament & constellation figures\n")
        f.write("// Source: HYG Database v4.1 (astronexus.com, CC BY-SA 4.0) — itself compiled from\n")
        f.write("// the Hipparcos, Yale Bright Star and Gliese catalogs. RA/Dec are J2000 degrees.\n\n")
        f.write("export interface StarEntry {\n  name: string\n  con: string // IAU 3-letter constellation abbreviation\n  ra: number\n  dec: number\n  mag: number\n  cls: string // spectral class (O B A F G K M W)\n  dist: number // distance in light-years\n}\n\n")
        f.write("export interface ConstellationFigure {\n  abbr: string\n  name: string\n  lines: string[][] // polylines of star names (must exist in STARS)\n}\n\n")
        f.write("export const STARS: StarEntry[] = [\n")
        for s in catalog:
            f.write(f"  {{ name: {json.dumps(s['name'])}, con: {json.dumps(s['con'])}, ra: {s['ra']}, dec: {s['dec']}, mag: {s['mag']}, cls: '{s['cls']}', dist: {s['dist']} }},\n")
        f.write("]\n\n")
        f.write("export const CONSTELLATIONS: ConstellationFigure[] = [\n")
        for abbr, name, lines in figures:
            f.write(f"  {{ abbr: '{abbr}', name: {json.dumps(name)}, lines: {json.dumps(lines)} }},\n")
        f.write("]\n\n")
        f.write("export const STAR_BY_NAME = new Map(STARS.map((s) => [s.name, s]))\n")
    print("WROTE src/lib/celestial/stars.ts")


if __name__ == "__main__":
    main()
