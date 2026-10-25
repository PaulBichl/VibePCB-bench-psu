"""Plot the bench-psu control-loop results (results/*.csv from export_loop.py) into plots/*.png.

Run: python boards/bench-psu/sim/plot.py   (needs matplotlib; not part of the hatch env)
The CSVs come from ngspice runs of buck_loop.cir (export_loop.py).
"""

from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path

import matplotlib as mpl

mpl.use("Agg")
import matplotlib.pyplot as plt

HERE = Path(__file__).parent
RES = HERE / "results"
OUT = HERE / "plots"
VOUTS = ["1.6", "3.3", "5", "12", "16"]
COL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6"]
CRIT = "#d03b3b"
REF = "#898781"
ISC_MIN = 3.85  # high-side (peak) current limit, datasheet minimum
ILIMIT_MIN = 2.9  # low-side (valley) current limit, datasheet minimum


def rows(name: str) -> list[dict[str, str]]:
    with (RES / f"{name}.csv").open() as f:
        return list(csv.DictReader(f))


def style() -> None:
    mpl.rcParams.update({
        "figure.dpi": 130, "font.size": 9, "axes.spines.top": False, "axes.spines.right": False,
        "axes.grid": True, "grid.color": "#e1e0d9", "grid.linewidth": 0.8, "axes.edgecolor": "#c3c2b7",
        "axes.titlesize": 10, "axes.titleweight": "bold", "legend.frameon": False, "lines.linewidth": 2,
        "lines.solid_capstyle": "round",
    })


def loop() -> None:
    b = rows("bode")
    curves: dict[tuple[str, str], list[tuple[float, float, float]]] = defaultdict(list)
    for x in b:
        curves[(x["vout"], x["fb_network"])].append((float(x["freq_hz"]), float(x["gain_db"]), float(x["phase_deg"])))
    s = rows("loopsummary")
    summ = {(x["vout"], x["fb_network"]): x for x in s}
    fig, ax = plt.subplots(2, 2, figsize=(11, 7), sharex=True, height_ratios=[1.4, 1])
    for c, net in enumerate(["divider only", "with lag network"]):
        for i, v in enumerate(VOUTS):
            pts = sorted(curves[(v, net)])
            sm = summ[(v, net)]
            lab = f"{v} V: fc {float(sm['crossover_khz']):.0f} kHz, PM {float(sm['phase_margin_deg']):.0f} deg"
            ax[0, c].semilogx([p[0] for p in pts], [p[1] for p in pts], color=COL[i], label=lab)
            ax[1, c].semilogx([p[0] for p in pts], [p[2] + 180 for p in pts], color=COL[i])
        ax[0, c].axhline(0, color=REF, ls="--", lw=1)
        ax[1, c].axhline(0, color=CRIT, ls="--", lw=1)
        ax[1, c].axhline(45, color=REF, ls="--", lw=1)
        ax[1, c].text(2e6, 47, "45 deg", ha="right", color=REF)
        title = "Divider only (as first drawn): unstable" if c == 0 else "With 6.8k / 220 nF lag network (board)"
        ax[0, c].set(title=title, ylabel="loop gain (dB)", ylim=(-60, 90))
        ax[1, c].set(xlabel="frequency (Hz)", ylabel="phase + 180 (deg)", ylim=(-150, 120), xlim=(100, 2e6))
        ax[0, c].legend(loc="lower left", fontsize=8)
    fig.suptitle("Control loop (averaged peak-current-mode model, indicative)", fontweight="bold")
    fig.tight_layout()
    fig.savefig(OUT / "loop_bode.png")
    plt.close(fig)

    st = rows("loadstep")
    wave: dict[tuple[str, str], list[tuple[float, float]]] = defaultdict(list)
    for x in st:
        wave[(x["vout"], x["fb_network"])].append((float(x["t_us"]), float(x["dev_mv"])))
    fig, ax = plt.subplots(1, 2, figsize=(11, 4.2))
    for c, net in enumerate(["with lag network", "divider only"]):
        for i, v in enumerate(VOUTS):
            pts = sorted(wave[(v, net)])
            ax[c].plot([p[0] for p in pts], [p[1] for p in pts], color=COL[i], lw=1.5, label=f"{v} V")
        ax[c].axvspan(200, 600, color="#f0efec", zorder=0)
        ax[c].text(400, 0.97, "3 A", transform=ax[c].get_xaxis_transform(), ha="center", va="top", color=REF)
        ax[c].set(xlabel="t (us)", ylabel="Vout deviation (mV)", xlim=(150, 1000))
        ax[c].legend(title="Vout", ncol=5, fontsize=8, loc="lower right")
    ax[0].set_title("Load step 1 A -> 3 A -> 1 A, with 6.8k / 220 nF lag network (board)")
    ax[1].set_title("Same step, divider only: oscillates")
    fig.tight_layout()
    fig.savefig(OUT / "loop_loadstep.png")
    plt.close(fig)

    lg = rows("lagsweep")
    nets = list(dict.fromkeys(x["lag_network"] for x in lg))
    fig, ax = plt.subplots(1, 3, figsize=(15, 4.4))
    k = 1
    for n in nets:
        pts = [x for x in lg if x["lag_network"] == n]
        board = "(board)" in n
        if n == "none":
            color = CRIT
        elif board:
            color = COL[0]
        else:
            color = COL[k]
            k += 1
        xs = [VOUTS.index(x["vout"]) for x in pts]
        name = "no lag network" if n == "none" else n
        ax[0].plot(xs, [float(x["phase_margin_deg"]) for x in pts], "o-", color=color, lw=3 if board else 1.5, label=name)
        if n != "none":
            ax[1].plot(xs, [float(x["min_phase_below_fc_deg"]) for x in pts], "o-", color=color, lw=3 if board else 1.5, label=name)
            ax[2].plot(xs, [float(x["undershoot_mv"]) for x in pts], "o-", color=color, lw=3 if board else 1.5, label=name)
    ax[0].axhline(45, color=REF, ls="--", lw=1)
    ax[0].axhline(0, color=CRIT, ls="--", lw=1)
    ax[0].set(title="Phase margin by lag network\n(Rs / Cs, FB to GND)", ylabel="deg")
    ax[1].axhline(0, color=CRIT, ls="--", lw=1)
    ax[1].set(title="Lowest phase + 180 below crossover\n(below 0: conditionally stable)", ylabel="deg")
    ax[2].set(title="Undershoot for a 2 A load step", ylabel="mV")
    for a in ax:
        a.set(xticks=range(len(VOUTS)), xticklabels=[f"{v} V" for v in VOUTS], xlabel="Vout")
        a.legend(fontsize=8)
    fig.tight_layout()
    fig.savefig(OUT / "loop_lagsweep.png")
    plt.close(fig)


if __name__ == "__main__":
    style()
    OUT.mkdir(exist_ok=True)
    loop()
