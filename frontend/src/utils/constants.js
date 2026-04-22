// Application constants
export const SCRIPT_MODES = [
  { value: "bg", label: "Background Script" },
  { value: "update_set", label: "Update Set Script" },
];

export const SAMPLE_ROWS = [
  { label: "年月",  field_name: "YEAR_MONTH", data_type: "*YYYYMM" },
  { label: "府県コード",  field_name: "AREA_CD", data_type: "*AREA_CODE" },
  { label: "資金種類コード",  field_name: "FUND_TYPE_CD", data_type: "CHAR(6)" },
  { label: "資金種類名",  field_name: "FUND_TYPE_NAME", data_type: "VARCHAR2(90)" },
  { label: "長期月末残高",  field_name: "TYOUKI_GETSUMATSU_YEN_TH", data_type: "*YEN_TH" },
  { label: "長期月末金利",  field_name: "TYOUKI_GETSUMATSU_RATE", data_type: "*RATE_RATIO_S" },
  { label: "最終更新日時",  field_name: "LAST_UPDATE", data_type: "*UPDATE_DATE" },
];

export const DEFAULT_TABLE_NAME = "x_custom_table";
export const DEFAULT_SCRIPT_MODE = "bg";
