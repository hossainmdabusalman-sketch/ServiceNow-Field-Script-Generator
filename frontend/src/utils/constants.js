// Application constants
export const SCRIPT_MODES = [
  { value: "bg", label: "Background Script" },
  { value: "update_set", label: "Update Set Script" },
];

export const SAMPLE_ROWS = [
  { label: "年月", english_label: "Year Month", field_name: "YEAR_MONTH", data_type: "*YYYYMM" },
  { label: "府県コード", english_label: "Area Code", field_name: "AREA_CD", data_type: "*AREA_CODE" },
  { label: "資金種類コード", english_label: "Fund Type Code", field_name: "FUND_TYPE_CD", data_type: "CHAR(6)" },
  { label: "資金種類名", english_label: "Fund Type Name", field_name: "FUND_TYPE_NAME", data_type: "VARCHAR2(90)" },
  { label: "長期月末残高", english_label: "Long-term Month End Balance", field_name: "TYOUKI_GETSUMATSU_YEN_TH", data_type: "*YEN_TH" },
  { label: "長期月末金利", english_label: "Long-term Month End Interest", field_name: "TYOUKI_GETSUMATSU_RATE", data_type: "*RATE_RATIO_S" },
  { label: "最終更新日時", english_label: "Last Update Date", field_name: "LAST_UPDATE", data_type: "*UPDATE_DATE" },
];

export const DEFAULT_TABLE_NAME = "x_custom_table";
export const DEFAULT_SCRIPT_MODE = "bg";
