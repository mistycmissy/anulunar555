from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler
from typing import Any, Dict, Optional, Tuple


SIGNS = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
]


def _json_response(handler: BaseHTTPRequestHandler, status: int, payload: Dict[str, Any]) -> None:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


def _parse_utc_datetime(value: Any) -> Optional[datetime]:
    if not isinstance(value, str) or not value:
        return None

    # Accept "2020-01-01T12:34:56Z" or with offset.
    s = value.strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(s)
    except ValueError:
        return None

    if dt.tzinfo is None:
        # Treat naive as UTC to avoid accidental local-time drift.
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _sign_from_longitude(lon: float) -> Tuple[str, float]:
    lon = lon % 360.0
    idx = int(lon // 30.0) % 12
    return SIGNS[idx], lon % 30.0


def _house_system_code(house_system: Any) -> bytes:
    # Default to Placidus if unspecified.
    hs = str(house_system or "Placidus").strip().lower()
    if hs in ("placidus", "p"):
        return b"P"
    if hs in ("koch", "k"):
        return b"K"
    if hs in ("equal", "e"):
        return b"E"
    if hs in ("whole", "w"):
        return b"W"
    # Fall back to Placidus for compatibility.
    return b"P"


def _normalize_planet_name(name: str) -> str:
    n = name.strip().lower().replace("_", " ").replace("-", " ")
    n = " ".join(n.split())
    if n in ("north node", "mean node", "node", "ascending node"):
        return "North Node"
    if n in ("south node", "descending node"):
        return "South Node"
    return name.strip()


class handler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:
        try:
            try:
                import swisseph as swe  # type: ignore
            except Exception as e:  # pragma: no cover
                _json_response(
                    self,
                    500,
                    {
                        "error": "Swiss Ephemeris (pyswisseph) is not installed in this environment.",
                        "details": str(e),
                    },
                )
                return

            content_length = int(self.headers.get("content-length", "0") or "0")
            raw = self.rfile.read(content_length) if content_length else b"{}"
            try:
                body = json.loads(raw.decode("utf-8") or "{}")
            except Exception:
                _json_response(self, 400, {"error": "Invalid JSON body."})
                return

            utc_dt = _parse_utc_datetime(body.get("utc_datetime"))
            if utc_dt is None:
                _json_response(
                    self,
                    400,
                    {"error": "Missing or invalid `utc_datetime`. Expected ISO string like 1990-05-15T14:30:00Z."},
                )
                return

            # Ephemeris data path: commit your Swiss Ephemeris files here.
            repo_root = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
            ephe_path = os.path.join(repo_root, "lib", "calculations", "swiss_ephemeris")
            ephe_path = os.path.normpath(ephe_path)

            if not os.path.isdir(ephe_path):
                _json_response(
                    self,
                    500,
                    {
                        "error": "Swiss Ephemeris data directory not found.",
                        "expected_path": ephe_path,
                        "hint": "Create this folder and add Swiss Ephemeris data files (e.g. swe_deltat.txt, sepl_*.se1).",
                    },
                )
                return

            # Basic presence check (helps catch 'installed but no data files' issues).
            present = set(os.listdir(ephe_path))
            has_deltat = "swe_deltat.txt" in present
            has_se_files = any(name.endswith(".se1") or name.endswith(".se2") for name in present)
            if not (has_deltat and has_se_files):
                _json_response(
                    self,
                    500,
                    {
                        "error": "Swiss Ephemeris data files are missing or incomplete.",
                        "expected_path": ephe_path,
                        "found_files_sample": sorted(list(present))[:50],
                        "required": ["swe_deltat.txt", "sepl_*.se1 (planet files)"],
                    },
                )
                return

            swe.set_ephe_path(ephe_path)

            # Compute Julian Day (UT).
            hour = (
                utc_dt.hour
                + (utc_dt.minute / 60.0)
                + (utc_dt.second / 3600.0)
                + (utc_dt.microsecond / 3_600_000_000.0)
            )
            jd_ut = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, hour)

            flags = swe.FLG_SWIEPH | swe.FLG_SPEED

            planet_map = {
                "Sun": swe.SUN,
                "Moon": swe.MOON,
                "Mercury": swe.MERCURY,
                "Venus": swe.VENUS,
                "Mars": swe.MARS,
                "Jupiter": swe.JUPITER,
                "Saturn": swe.SATURN,
                "Uranus": swe.URANUS,
                "Neptune": swe.NEPTUNE,
                "Pluto": swe.PLUTO,
                "Chiron": getattr(swe, "CHIRON", None),
                "North Node": swe.MEAN_NODE,
            }

            requested = body.get("requested_planets") or []
            if not isinstance(requested, list) or not requested:
                requested = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]

            planets: Dict[str, Any] = {}
            for raw_name in requested:
                if not isinstance(raw_name, str) or not raw_name.strip():
                    continue
                name = _normalize_planet_name(raw_name)
                code = planet_map.get(name)
                if code is None:
                    continue

                # pyswisseph returns (xx, retflag)
                xx, _ = swe.calc_ut(jd_ut, code, flags)
                lon = float(xx[0] % 360.0)
                sign, deg = _sign_from_longitude(lon)
                planets[name] = {
                    "longitude": lon,
                    "latitude": float(xx[1]),
                    "distance": float(xx[2]),
                    "speed_longitude": float(xx[3]),
                    "sign": sign,
                    "degree": float(deg),
                }

            # South Node is opposite North Node (180°).
            if "North Node" in planets and "South Node" not in planets:
                nn_lon = float(planets["North Node"]["longitude"])
                sn_lon = (nn_lon + 180.0) % 360.0
                sn_sign, sn_deg = _sign_from_longitude(sn_lon)
                planets["South Node"] = {
                    "longitude": sn_lon,
                    "latitude": -float(planets["North Node"]["latitude"]),
                    "distance": float(planets["North Node"]["distance"]),
                    "speed_longitude": float(planets["North Node"]["speed_longitude"]),
                    "sign": sn_sign,
                    "degree": float(sn_deg),
                }

            houses: Dict[str, Any] = {}
            lat = body.get("latitude")
            lon = body.get("longitude")
            if isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
                hsys = _house_system_code(body.get("house_system"))
                cusps, ascmc = swe.houses(jd_ut, float(lat), float(lon), hsys)

                asc_lon = float(ascmc[0] % 360.0)
                mc_lon = float(ascmc[1] % 360.0)
                asc_sign, asc_deg = _sign_from_longitude(asc_lon)
                mc_sign, mc_deg = _sign_from_longitude(mc_lon)

                houses = {
                    "house_system": body.get("house_system") or "Placidus",
                    "ascendant": {"longitude": asc_lon, "sign": asc_sign, "degree": float(asc_deg)},
                    "midheaven": {"longitude": mc_lon, "sign": mc_sign, "degree": float(mc_deg)},
                    # cusps is 1..12 (index 0 unused)
                    "cusps": [float(c) for c in cusps[1:13]],
                }

            _json_response(
                self,
                200,
                {
                    "meta": {
                        "swisseph_version": getattr(swe, "version", None),
                        "jd_ut": float(jd_ut),
                        "utc_datetime": utc_dt.isoformat().replace("+00:00", "Z"),
                        "ephe_path": ephe_path,
                        "zodiac_system": body.get("zodiac_system") or "Tropical",
                    },
                    "planets": planets,
                    "houses": houses,
                },
            )
        except Exception as e:  # pragma: no cover
            _json_response(self, 500, {"error": "Unhandled Swiss Ephemeris error.", "details": str(e)})

    def do_GET(self) -> None:
        # Lightweight health endpoint.
        _json_response(
            self,
            200,
            {
                "ok": True,
                "service": "anulunar-swiss-ephemeris",
                "hint": "POST JSON with utc_datetime, latitude, longitude, requested_planets.",
            },
        )

