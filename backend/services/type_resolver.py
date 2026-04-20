"""Type resolution service for converting Oracle types to ServiceNow types"""
import re
from utils.constants import DOMAIN_MAP, SN_TYPE_MAP


def convert_oracle_type(raw: str) -> dict:
    """Convert Oracle SQL type to ServiceNow type"""
    r = raw.strip().upper()
    
    if r == "DATE":
        return {"type": "Date"}
    
    if r.startswith("VARCHAR2") or r.startswith("CHAR"):
        m = re.search(r"\((\d+)", r)
        return {"type": "String", "max_len": int(m.group(1)) if m else None}
    
    if r.startswith("NUMBER"):
        m = re.search(r"\((\d+)(?:,(\d+))?\)", r)
        if not m:
            return {"type": "Integer"}
        
        prec = int(m.group(1))
        scale = int(m.group(2)) if m.group(2) else 0
        
        if scale > 0:
            return {"type": "Decimal", "max_len": prec, "scale": scale}
        if prec <= 8:
            return {"type": "Integer"}
        if prec <= 19:
            return {"type": "Long", "max_len": prec}
        return {"type": "String"}
    
    return {"type": "String"}


def resolve_type(data_type: str) -> dict:
    """
    Resolve a data type to ServiceNow equivalent.
    Supports domain names (prefixed with *) and Oracle types.
    """
    if not data_type:
        return {"type": "String"}
    
    dt = data_type.strip()
    
    # Domain name resolution
    if dt.startswith("*"):
        key = dt[1:]
        if key in DOMAIN_MAP:
            return DOMAIN_MAP[key]
        return {"type": "String", "note": f"Unknown domain: {key}"}
    
    # Oracle type conversion
    return convert_oracle_type(dt)


def get_sn_internal_type(resolved_type: dict) -> str:
    """Get ServiceNow internal type from resolved type"""
    return SN_TYPE_MAP.get(resolved_type.get("type", "String"), "string")


def resolve_with_sn_type(data_type: str) -> dict:
    """Resolve type and include ServiceNow internal type"""
    resolved = resolve_type(data_type)
    sn_type = get_sn_internal_type(resolved)
    return {**resolved, "sn_internal_type": sn_type}
