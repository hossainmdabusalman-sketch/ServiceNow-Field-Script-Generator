"""API routes for the ServiceNow Script Generator"""
from fastapi import APIRouter
from models import GenerateRequest, ResolveRequest, ParsePasteRequest
from services.type_resolver import resolve_with_sn_type
from services.script_generator import ScriptGenerator
from utils.constants import DOMAIN_MAP

router = APIRouter(prefix="/api", tags=["api"])
script_gen = ScriptGenerator()


@router.get("/domains")
def get_domains():
    """Get list of available domain names and their mappings"""
    return DOMAIN_MAP


@router.post("/resolve-type")
def resolve_type_endpoint(req: ResolveRequest):
    """Resolve a data type to ServiceNow equivalent"""
    return resolve_with_sn_type(req.data_type)


@router.post("/parse-paste")
def parse_paste(req: ParsePasteRequest):
    """Parse tab-separated data from Excel/spreadsheet"""
    rows = []
    for line in req.text.strip().splitlines():
        if not line.strip():
            continue
        
        parts = line.split("\t")
        label = parts[1].strip() if len(parts) > 1 else ""
        field_name = parts[2].strip() if len(parts) > 2 else ""
        data_type = parts[3].strip() if len(parts) > 3 else ""
        not_null = parts[4].strip().lower() in ("yes", "true", "1") if len(parts) > 4 else False
        default_value = parts[5].strip() if len(parts) > 5 else ""
        
        if field_name or label:
            resolved = resolve_with_sn_type(data_type)
            rows.append({
                "label": label,
                "english_label": "",
                "field_name": field_name,
                "data_type": data_type,
                "not_null": not_null,
                "default_value": default_value,
                "resolved": resolved,
            })
    
    return {"fields": rows}


@router.post("/generate")
def generate_script(req: GenerateRequest):
    """Generate ServiceNow script for field configuration"""
    if req.script_mode == "bg":
        script = script_gen.generate_background_script(req.table_name, req.fields)
    elif req.script_mode == "update_set":
        script = script_gen.generate_update_set_script(req.table_name, req.fields)
    else:
        script = script_gen.generate_background_script(req.table_name, req.fields)
    
    return {"script": script}


@router.get("/health")
def health():
    """Health check endpoint"""
    return {"status": "ok"}
