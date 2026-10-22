"""Run buck_loop.cir per output voltage / FB network / lag-network variant and write results/*.csv.

Run: python boards/bench-psu/sim/export_loop.py   (needs ngspice on PATH; ~1 min)
Writes results/bode.csv, loadstep.csv, loopsummary.csv, lagsweep.csv (plot.py draws them).
"""

from __future__ import annotations

import csv
import subprocess
import tempfile
from pathlib import Path

HERE = Path(__file__).parent
RES = HERE / "results"
VOUTS = ["1.6", "3.3", "5", "12", "16"]
BOARD = ("6.8k", "220n")
VARIANTS = [("10k", "10n"), ("6.8k", "10n"), ("6.8k", "47n"), BOARD, ("4.7k", "22n"), ("3.3k", "33n")]
NETS = {"0": "divider only", "1": "with lag network"}
BASE_PARAM = ".param rs={lag > 0.5 ? 6.8k : 1e12} cs=220n"


def deck(vout: str, lag: str, rs: str, cs: str, tmp: Path) -> str:
    src = (HERE / "buck_loop.cir").read_text()
    base = src[: src.index("\n.control") + 1]
    if BASE_PARAM not in base:
        msg = f"buck_loop.cir no longer has '{BASE_PARAM}'"
        raise ValueError(msg)
    base = base.replace(".param vout=5 lag=1", f".param vout={vout} lag={lag}")
    base = base.replace(BASE_PARAM, f".param rs={{lag > 0.5 ? {rs} : 1e12}} cs={cs}")
    return base + f""".control
  set wr_singlescale
  set wr_vecnames
  ac dec 40 10 2meg
  let t = -v(out) / v(fbtop)
  let tmag = db(t)
  let tph = 180 / 3.14159 * cph(t)
  let tph180 = tph + 180
  meas ac fc when tmag=0 fall=last
  meas ac phc find tph180 at=fc
  meas ac phmin min tph180 from=10 to=fc
  let fck = fc / 1000
  set a1 = "$&fck"
  set a2 = "$&phc"
  set a3 = "$&phmin"
  wrdata {tmp}/bode.txt tmag tph
  tran 0.5u 3m
  meas tran v0 find v(out) at=0.199m
  meas tran vmin min v(out) from=0.2m to=0.6m
  meas tran vmax max v(out) from=0.6m to=1m
  meas tran v1 find v(out) at=0.59m
  let us = (v0 - vmin) * 1000
  let os = (vmax - v0) * 1000
  let e1 = (v1 - v0) * 1000
  let dv = (v(out) - v0) * 1000
  wrdata {tmp}/step.txt dv
  echo "RES $a1 $a2 $a3 $&us $&os $&e1"
.endc
.end
"""


def table(path: Path) -> list[list[float]]:
    lines = path.read_text().split("\n")[1:]
    return [[float(v) for v in ln.split()] for ln in lines if ln.strip()]


def run(vout: str, lag: str, rs: str, cs: str) -> dict[str, object]:
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)
        (tmp / "x.cir").write_text(deck(vout, lag, rs, cs, tmp))
        out = subprocess.run(["ngspice", "-b", str(tmp / "x.cir")], capture_output=True, text=True, check=False).stdout
        res = next((ln.split()[1:] for ln in out.splitlines() if ln.startswith("RES ")), None)
        if res is None or len(res) != 6:
            msg = f"ngspice run failed for {vout} V, lag={lag}, {rs}/{cs}"
            raise RuntimeError(msg)
        return {"res": [float(v) for v in res], "bode": table(tmp / "bode.txt"), "step": table(tmp / "step.txt")}


def main() -> None:
    RES.mkdir(exist_ok=True)
    with (RES / "bode.csv").open("w", newline="") as fb, (RES / "loadstep.csv").open("w", newline="") as fs, \
            (RES / "loopsummary.csv").open("w", newline="") as fl:
        wb, ws, wl = csv.writer(fb), csv.writer(fs), csv.writer(fl)
        wb.writerow(["vout", "fb_network", "freq_hz", "gain_db", "phase_deg"])
        ws.writerow(["vout", "fb_network", "t_us", "dev_mv"])
        wl.writerow(["vout", "fb_network", "crossover_khz", "phase_margin_deg", "min_phase_below_fc_deg",
                     "undershoot_mv", "overshoot_mv", "tail_after_390us_mv", "stable"])
        for v in VOUTS:
            for lag in ("0", "1"):
                r = run(v, lag, *BOARD)
                fc, pm, pmin, us, os_, tail = r["res"]  # type: ignore[misc]
                stable = pm > 0
                wl.writerow([v, NETS[lag], round(fc, 1), round(pm, 1), round(pmin, 1),
                             round(us, 1) if stable else "", round(os_, 1) if stable else "",
                             round(tail, 1) if stable else "", "yes" if stable else "no"])
                for f, mag, ph in r["bode"]:  # type: ignore[attr-defined]
                    if f >= 100:
                        wb.writerow([v, NETS[lag], f"{f:.4g}", round(mag, 2), round(ph, 1)])
                last = -1.0
                for t, dv in r["step"]:  # type: ignore[attr-defined]
                    if 150e-6 <= t <= 1000e-6 and t - last >= 0.99e-6:
                        last = t
                        ws.writerow([v, NETS[lag], round(t * 1e6, 2), round(dv, 2)])
    with (RES / "lagsweep.csv").open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["lag_network", "vout", "phase_margin_deg", "min_phase_below_fc_deg", "undershoot_mv", "tail_after_390us_mv"])
        for v in VOUTS:
            fc, pm, pmin, *_ = run(v, "0", *BOARD)["res"]  # type: ignore[misc]
            w.writerow(["none", v, round(pm, 1), "", "", ""])
        for rs, cs in VARIANTS:
            name = f"{rs} / {cs[:-1]} nF" + (" (board)" if (rs, cs) == BOARD else "")
            for v in VOUTS:
                fc, pm, pmin, us, _os, tail = run(v, "1", rs, cs)["res"]  # type: ignore[misc]
                w.writerow([name, v, round(pm, 1), round(pmin, 1), round(us, 1), round(tail, 1)])


if __name__ == "__main__":
    main()
