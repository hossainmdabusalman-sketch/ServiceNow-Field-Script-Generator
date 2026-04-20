from pydantic import BaseModel
from typing import Optional


class FieldRow(BaseModel):
    """Model for a single field definition"""
    label: str = ""
    english_label: str = ""
    field_name: str
    data_type: str = ""
    default_value: str = ""
    not_null: bool = False


class GenerateRequest(BaseModel):
    """Request model for script generation"""
    table_name: str
    fields: list[FieldRow]
    script_mode: str = "bg"  # "bg" or "update_set"


class ResolveRequest(BaseModel):
    """Request model for type resolution"""
    data_type: str


class ParsePasteRequest(BaseModel):
    """Request model for parsing pasted data"""
    text: str


class TypeResolution(BaseModel):
    """Response model for type resolution"""
    type: str
    max_len: Optional[int] = None
    scale: Optional[int] = None
    note: Optional[str] = None
    sn_internal_type: str
