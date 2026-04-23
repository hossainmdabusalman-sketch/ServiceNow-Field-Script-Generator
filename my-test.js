# ServiceNow Implementation: Shinren Fund Input Sub-Flow

## Overview

This document covers the full ServiceNow implementation of the **Shinren Fund Input Sub-Flow**
based on the flowchart (Steps 1–12), using:

- **Flow Designer** (main orchestration)
- **Script Includes** (reusable business logic)
- **Business Rules** (table-level triggers, optional)
- **GlideRecord** (all DB operations)

---

## Table Mapping

| Flow Concept                        | ServiceNow Table (suggested)             |
|-------------------------------------|------------------------------------------|
| Work Status Management Table        | `u_work_status_management`               |
| Shinren Fund Table (Shinren)        | `u_shinren_fund`                         |
| System Usage Rate (Shinren)         | `u_system_usage_rate_shinren`            |
| Shinren Fund (Integrated Pref.)     | `u_shinren_fund_integrated`              |
| System Usage Rate (Integrated)      | `u_system_usage_rate_integrated`         |
| Inheritance Master Table            | `u_inheritance_master`                   |

---

## Step 1 – Script Include: `ShinrenFundInputHelper`

Create a **Script Include** (`sys_script_include`) named `ShinrenFundInputHelper`.  
This encapsulates all reusable logic called from the Flow.

```javascript
var ShinrenFundInputHelper = Class.create();
ShinrenFundInputHelper.prototype = {

    initialize: function() {},

    // ─────────────────────────────────────────────────
    // STEP 1: Get Confirmation Status
    // Returns: "Confirmed", "Pending", or null
    // ─────────────────────────────────────────────────
    getConfirmationStatus: function(processingMonth) {
        var gr = new GlideRecord('u_work_status_management');
        gr.addQuery('u_target_year_month', processingMonth);
        gr.addQuery('u_business_type', 'Shinren Fund Input');
        gr.addQuery('u_prefecture_code', '99');  // National
        gr.setLimit(1);
        gr.query();

        if (gr.next()) {
            return gr.getValue('u_status');  // e.g. "Confirmed"
        }
        return null;
    },

    // ─────────────────────────────────────────────────
    // FLOW 1 – STEP 3: Extract Data from Shinren Table
    // Returns array of record sys_ids extracted
    // ─────────────────────────────────────────────────
    extractShinrenData: function(processingMonth) {
        // "Previous month, current month, next month" per notes
        var months = this._getThreeMonths(processingMonth);
        var records = [];

        var gr = new GlideRecord('u_shinren_fund');
        gr.addQuery('u_record_month', 'IN', months.join(','));
        gr.query();

        while (gr.next()) {
            records.push({
                sys_id:            gr.getUniqueValue(),
                prefecture_code:   gr.getValue('u_prefecture_code'),
                record_month:      gr.getValue('u_record_month'),
                actual_prev_month: gr.getValue('u_actual_prev_month'),
                forecast_current:  gr.getValue('u_forecast_current_month'),
                forecast_next:     gr.getValue('u_forecast_next_month'),
                account_code:      gr.getValue('u_system_usage_rate_account_code')
            });
        }
        return records;
    },

    // ─────────────────────────────────────────────────
    // FLOW 1 – STEP 4: Update Usage Rate (Shinren)
    // Insert or Update System Usage Rate (Shinren Table)
    // ─────────────────────────────────────────────────
    updateUsageRateShinren: function(records) {
        var errors = [];

        records.forEach(function(rec) {
            var gr = new GlideRecord('u_system_usage_rate_shinren');
            gr.addQuery('u_prefecture_code', rec.prefecture_code);
            gr.addQuery('u_record_month',    rec.record_month);
            gr.addQuery('u_account_code',    rec.account_code);
            gr.setLimit(1);
            gr.query();

            if (gr.next()) {
                // UPDATE existing record
                gr.setValue('u_actual_prev_month',     rec.actual_prev_month);
                gr.setValue('u_forecast_current_month', rec.forecast_current);
                gr.setValue('u_forecast_next_month',   rec.forecast_next);
                if (!gr.update()) {
                    errors.push('Update failed for sys_id: ' + gr.getUniqueValue());
                }
            } else {
                // INSERT new record
                var newRec = new GlideRecord('u_system_usage_rate_shinren');
                newRec.initialize();
                newRec.setValue('u_prefecture_code',        rec.prefecture_code);
                newRec.setValue('u_record_month',           rec.record_month);
                newRec.setValue('u_account_code',           rec.account_code);
                newRec.setValue('u_actual_prev_month',      rec.actual_prev_month);
                newRec.setValue('u_forecast_current_month', rec.forecast_current);
                newRec.setValue('u_forecast_next_month',    rec.forecast_next);
                if (!newRec.insert()) {
                    errors.push('Insert failed for prefecture: ' + rec.prefecture_code);
                }
            }
        }, this);

        return errors;
    },

    // ─────────────────────────────────────────────────
    // FLOW 1 – STEP 5: Recalculate Aggregates (Shinren)
    // ─────────────────────────────────────────────────
    recalculateAggregatesShinren: function(processingMonth) {
        var months = this._getThreeMonths(processingMonth);
        var errors = [];

        months.forEach(function(month) {
            var agg = new GlideAggregate('u_system_usage_rate_shinren');
            agg.addQuery('u_record_month', month);
            agg.addAggregate('SUM', 'u_actual_prev_month');
            agg.addAggregate('SUM', 'u_forecast_current_month');
            agg.addAggregate('SUM', 'u_forecast_next_month');
            agg.addGroupBy('u_account_code');
            agg.query();

            while (agg.next()) {
                var accountCode   = agg.getValue('u_account_code');
                var sumActual     = agg.getAggregate('SUM', 'u_actual_prev_month');
                var sumForecastCur = agg.getAggregate('SUM', 'u_forecast_current_month');
                var sumForecastNxt = agg.getAggregate('SUM', 'u_forecast_next_month');

                // Write summary row (e.g., a "summary" flag record)
                var sumRec = new GlideRecord('u_system_usage_rate_shinren');
                sumRec.addQuery('u_record_month',    month);
                sumRec.addQuery('u_account_code',    accountCode);
                sumRec.addQuery('u_is_summary',      true);
                sumRec.setLimit(1);
                sumRec.query();

                if (sumRec.next()) {
                    sumRec.setValue('u_actual_prev_month',      sumActual);
                    sumRec.setValue('u_forecast_current_month', sumForecastCur);
                    sumRec.setValue('u_forecast_next_month',    sumForecastNxt);
                    sumRec.update();
                } else {
                    var newSum = new GlideRecord('u_system_usage_rate_shinren');
                    newSum.initialize();
                    newSum.setValue('u_record_month',           month);
                    newSum.setValue('u_account_code',           accountCode);
                    newSum.setValue('u_is_summary',             true);
                    newSum.setValue('u_actual_prev_month',      sumActual);
                    newSum.setValue('u_forecast_current_month', sumForecastCur);
                    newSum.setValue('u_forecast_next_month',    sumForecastNxt);
                    newSum.insert();
                }
            }
        }, this);

        return errors;
    },

    // ─────────────────────────────────────────────────
    // FLOW 1 – STEP 6: Recalculate National Total (Pref Code 99)
    // ─────────────────────────────────────────────────
    recalculateNationalTotal: function(processingMonth) {
        var months = this._getThreeMonths(processingMonth);

        months.forEach(function(month) {
            var agg = new GlideAggregate('u_system_usage_rate_shinren');
            agg.addQuery('u_record_month',   month);
            agg.addQuery('u_prefecture_code', '!=', '99'); // Exclude existing national
            agg.addAggregate('SUM', 'u_actual_prev_month');
            agg.addAggregate('SUM', 'u_forecast_current_month');
            agg.addAggregate('SUM', 'u_forecast_next_month');
            agg.addGroupBy('u_account_code');
            agg.query();

            while (agg.next()) {
                var accountCode    = agg.getValue('u_account_code');
                var nationalActual = agg.getAggregate('SUM', 'u_actual_prev_month');
                var nationalFcCur  = agg.getAggregate('SUM', 'u_forecast_current_month');
                var nationalFcNxt  = agg.getAggregate('SUM', 'u_forecast_next_month');

                var natRec = new GlideRecord('u_system_usage_rate_shinren');
                natRec.addQuery('u_prefecture_code', '99');
                natRec.addQuery('u_record_month',    month);
                natRec.addQuery('u_account_code',    accountCode);
                natRec.setLimit(1);
                natRec.query();

                if (natRec.next()) {
                    natRec.setValue('u_actual_prev_month',      nationalActual);
                    natRec.setValue('u_forecast_current_month', nationalFcCur);
                    natRec.setValue('u_forecast_next_month',    nationalFcNxt);
                    natRec.update();
                } else {
                    var newNat = new GlideRecord('u_system_usage_rate_shinren');
                    newNat.initialize();
                    newNat.setValue('u_prefecture_code',        '99');
                    newNat.setValue('u_record_month',           month);
                    newNat.setValue('u_account_code',           accountCode);
                    newNat.setValue('u_actual_prev_month',      nationalActual);
                    newNat.setValue('u_forecast_current_month', nationalFcCur);
                    newNat.setValue('u_forecast_next_month',    nationalFcNxt);
                    newNat.insert();
                }
            }
        }, this);
    },

    // ─────────────────────────────────────────────────
    // FLOW 2 – STEP 7: Extract Data (Integrated Prefecture)
    // ─────────────────────────────────────────────────
    extractIntegratedData: function(processingMonth) {
        var months = this._getThreeMonths(processingMonth);
        var records = [];

        var gr = new GlideRecord('u_shinren_fund_integrated');
        gr.addQuery('u_record_month', 'IN', months.join(','));
        gr.query();

        while (gr.next()) {
            records.push({
                sys_id:            gr.getUniqueValue(),
                prefecture_code:   gr.getValue('u_prefecture_code'),
                record_month:      gr.getValue('u_record_month'),
                actual_prev_month: gr.getValue('u_actual_prev_month'),
                forecast_current:  gr.getValue('u_forecast_current_month'),
                forecast_next:     gr.getValue('u_forecast_next_month'),
                account_code:      gr.getValue('u_system_usage_rate_account_code')
            });
        }
        return records;
    },

    // ─────────────────────────────────────────────────
    // FLOW 2 – STEP 8: Get Inheritance Information
    // Returns map: { prefecture_code: inheritance_month }
    // ─────────────────────────────────────────────────
    getInheritanceInfo: function() {
        var inheritanceMap = {};

        var gr = new GlideRecord('u_inheritance_master');
        gr.query();

        while (gr.next()) {
            var prefCode   = gr.getValue('u_prefecture_code');
            var inhMonth   = gr.getValue('u_inheritance_month');
            inheritanceMap[prefCode] = inhMonth;
        }

        return inheritanceMap;
    },

    // ─────────────────────────────────────────────────
    // FLOW 2 – STEP 9: Update Usage Rate (Integrated)
    // Rule: skip if record_month < inheritance_month
    //       update if record_month >= inheritance_month
    // ─────────────────────────────────────────────────
    updateUsageRateIntegrated: function(records, inheritanceMap) {
        var errors = [];

        records.forEach(function(rec) {
            var inheritanceMonth = inheritanceMap[rec.prefecture_code];

            // Apply inheritance rule
            if (inheritanceMonth) {
                if (rec.record_month < inheritanceMonth) {
                    // SKIP – record month is BEFORE inheritance month
                    gs.info('ShinrenFlow: Skipping ' + rec.prefecture_code +
                            ' month=' + rec.record_month +
                            ' (before inheritance month ' + inheritanceMonth + ')');
                    return; // continue forEach
                }
                // else: record_month >= inheritanceMonth → UPDATE (fall through)
            }

            var gr = new GlideRecord('u_system_usage_rate_integrated');
            gr.addQuery('u_prefecture_code', rec.prefecture_code);
            gr.addQuery('u_record_month',    rec.record_month);
            gr.addQuery('u_account_code',    rec.account_code);
            gr.setLimit(1);
            gr.query();

            if (gr.next()) {
                gr.setValue('u_actual_prev_month',      rec.actual_prev_month);
                gr.setValue('u_forecast_current_month', rec.forecast_current);
                gr.setValue('u_forecast_next_month',    rec.forecast_next);
                if (!gr.update()) {
                    errors.push('Integrated update failed: ' + gr.getUniqueValue());
                }
            } else {
                var newRec = new GlideRecord('u_system_usage_rate_integrated');
                newRec.initialize();
                newRec.setValue('u_prefecture_code',        rec.prefecture_code);
                newRec.setValue('u_record_month',           rec.record_month);
                newRec.setValue('u_account_code',           rec.account_code);
                newRec.setValue('u_actual_prev_month',      rec.actual_prev_month);
                newRec.setValue('u_forecast_current_month', rec.forecast_current);
                newRec.setValue('u_forecast_next_month',    rec.forecast_next);
                if (!newRec.insert()) {
                    errors.push('Integrated insert failed for: ' + rec.prefecture_code);
                }
            }
        }, this);

        return errors;
    },

    // ─────────────────────────────────────────────────
    // FLOW 2 – STEP 10: Recalculate Aggregates (Integrated)
    // ─────────────────────────────────────────────────
    recalculateAggregatesIntegrated: function(processingMonth) {
        var months = this._getThreeMonths(processingMonth);

        months.forEach(function(month) {
            var agg = new GlideAggregate('u_system_usage_rate_integrated');
            agg.addQuery('u_record_month', month);
            agg.addAggregate('SUM', 'u_actual_prev_month');
            agg.addAggregate('SUM', 'u_forecast_current_month');
            agg.addAggregate('SUM', 'u_forecast_next_month');
            agg.addGroupBy('u_account_code');
            agg.query();

            while (agg.next()) {
                var accountCode    = agg.getValue('u_account_code');
                var sumActual      = agg.getAggregate('SUM', 'u_actual_prev_month');
                var sumFcCur       = agg.getAggregate('SUM', 'u_forecast_current_month');
                var sumFcNxt       = agg.getAggregate('SUM', 'u_forecast_next_month');

                var sumRec = new GlideRecord('u_system_usage_rate_integrated');
                sumRec.addQuery('u_record_month', month);
                sumRec.addQuery('u_account_code', accountCode);
                sumRec.addQuery('u_is_summary',   true);
                sumRec.setLimit(1);
                sumRec.query();

                if (sumRec.next()) {
                    sumRec.setValue('u_actual_prev_month',      sumActual);
                    sumRec.setValue('u_forecast_current_month', sumFcCur);
                    sumRec.setValue('u_forecast_next_month',    sumFcNxt);
                    sumRec.update();
                } else {
                    var newSum = new GlideRecord('u_system_usage_rate_integrated');
                    newSum.initialize();
                    newSum.setValue('u_record_month',           month);
                    newSum.setValue('u_account_code',           accountCode);
                    newSum.setValue('u_is_summary',             true);
                    newSum.setValue('u_actual_prev_month',      sumActual);
                    newSum.setValue('u_forecast_current_month', sumFcCur);
                    newSum.setValue('u_forecast_next_month',    sumFcNxt);
                    newSum.insert();
                }
            }
        }, this);
    },

    // ─────────────────────────────────────────────────
    // STEP 11: Update Work Status to "Completed"
    // ─────────────────────────────────────────────────
    updateStatusCompleted: function(processingMonth) {
        var gr = new GlideRecord('u_work_status_management');
        gr.addQuery('u_target_year_month', processingMonth);
        gr.addQuery('u_business_type',     'Shinren Fund Input');
        gr.addQuery('u_prefecture_code',   '99');
        gr.query();

        if (gr.next()) {
            gr.setValue('u_status', 'Completed');
            return gr.update() ? true : false;
        }
        return false;
    },

    // ─────────────────────────────────────────────────
    // Log error to Operation Log
    // ─────────────────────────────────────────────────
    logError: function(processingMonth, errorMessage) {
        var logRec = new GlideRecord('u_operation_log');
        logRec.initialize();
        logRec.setValue('u_processing_month', processingMonth);
        logRec.setValue('u_business_type',    'Shinren Fund Input');
        logRec.setValue('u_log_level',        'Error');
        logRec.setValue('u_message',          errorMessage);
        logRec.setValue('u_executed_at',      new GlideDateTime());
        logRec.insert();

        gs.error('ShinrenFundInput ERROR [' + processingMonth + ']: ' + errorMessage);
    },

    // ─────────────────────────────────────────────────
    // Helper: returns [prevMonth, currentMonth, nextMonth]
    // Input format: "YYYY-MM"
    // ─────────────────────────────────────────────────
    _getThreeMonths: function(processingMonth) {
        // Parse YYYY-MM
        var parts = processingMonth.split('-');
        var year  = parseInt(parts[0]);
        var month = parseInt(parts[1]); // 1-12

        function formatMonth(y, m) {
            if (m < 1)  { y--; m += 12; }
            if (m > 12) { y++; m -= 12; }
            return y + '-' + (m < 10 ? '0' + m : '' + m);
        }

        return [
            formatMonth(year, month - 1), // previous month
            formatMonth(year, month),     // current month
            formatMonth(year, month + 1)  // next month
        ];
    },

    type: 'ShinrenFundInputHelper'
};
```

---

## Step 2 – Flow Designer Action Script (Main Orchestrator)

In **Flow Designer** → Create a **Subflow** named `Shinren Fund Input Processing`.  
Add a single **Script** step with the following:

```javascript
// ============================================================
// Flow Designer – Script Step
// Subflow: Shinren Fund Input Processing
// Input:  fd_data.processing_month  (String, format "YYYY-MM")
// Output: fd_data.return_code       ("Normal" | "Abnormal")
// ============================================================

(function execute(inputs, outputs) {

    var processingMonth = inputs.processing_month;
    var helper = new ShinrenFundInputHelper();
    var allErrors = [];

    try {

        // ── STEP 1: Get Confirmation Status ──────────────────
        var status = helper.getConfirmationStatus(processingMonth);

        // ── STEP 2: Check status ──────────────────────────────
        if (status !== 'Confirmed') {
            gs.info('ShinrenFundInput: Status is not Confirmed (' + status + '). Ending normally.');
            outputs.return_code = 'Normal';  // End Normally
            return;
        }

        // ════════════════════════════════════════════════════
        // FLOW 1: Shinren (Prefecture-Level Processing)
        // ════════════════════════════════════════════════════

        // ── STEP 3: Extract Data from Shinren Table ───────────
        var shinrenRecords = helper.extractShinrenData(processingMonth);
        if (shinrenRecords.length === 0) {
            allErrors.push('Flow1-Step3: No records extracted from Shinren Fund table.');
        }

        // ── STEP 4: Update Usage Rate (Shinren) ───────────────
        var step4Errors = helper.updateUsageRateShinren(shinrenRecords);
        allErrors = allErrors.concat(step4Errors);

        // ── STEP 5: Recalculate Aggregates (Shinren) ──────────
        var step5Errors = helper.recalculateAggregatesShinren(processingMonth);
        allErrors = allErrors.concat(step5Errors);

        // ── STEP 6: Recalculate National Total (Code=99) ──────
        helper.recalculateNationalTotal(processingMonth);

        // ════════════════════════════════════════════════════
        // FLOW 2: Integrated Prefecture Processing
        // ════════════════════════════════════════════════════

        // ── STEP 7: Extract Data (Integrated Prefecture) ──────
        var integratedRecords = helper.extractIntegratedData(processingMonth);
        if (integratedRecords.length === 0) {
            allErrors.push('Flow2-Step7: No records from Integrated Prefecture table.');
        }

        // ── STEP 8: Get Inheritance Information ───────────────
        var inheritanceMap = helper.getInheritanceInfo();

        // ── STEP 9: Update Usage Rate (Integrated) ────────────
        var step9Errors = helper.updateUsageRateIntegrated(integratedRecords, inheritanceMap);
        allErrors = allErrors.concat(step9Errors);

        // ── STEP 10: Recalculate Aggregates (Integrated) ──────
        helper.recalculateAggregatesIntegrated(processingMonth);

        // ════════════════════════════════════════════════════
        // STEP 11: Update Status to "Completed"
        // ════════════════════════════════════════════════════
        var updated = helper.updateStatusCompleted(processingMonth);
        if (!updated) {
            allErrors.push('Step11: Failed to update Work Status to Completed.');
        }

        // ── STEP 12: Did all steps complete successfully? ─────
        if (allErrors.length > 0) {
            // Abnormal End
            var errorMsg = allErrors.join(' | ');
            helper.logError(processingMonth, errorMsg);
            outputs.return_code = 'Abnormal';
        } else {
            // Normal End
            gs.info('ShinrenFundInput: All steps completed successfully for ' + processingMonth);
            outputs.return_code = 'Normal';
        }

    } catch (ex) {
        // Unexpected exception → Abnormal End
        helper.logError(processingMonth, 'Exception: ' + ex.message);
        outputs.return_code = 'Abnormal';
    }

})(inputs, outputs);
```

---

## Step 3 – Flow Designer: Input / Output Variables

| Variable Name      | Type   | Direction | Description                     |
|--------------------|--------|-----------|---------------------------------|
| `processing_month` | String | Input     | Format: `YYYY-MM`               |
| `return_code`      | String | Output    | `"Normal"` or `"Abnormal"`      |

---

## Step 4 – Calling the Subflow from a Parent Flow

```javascript
// In a parent Flow Designer Action Script:
var subflowResult = sn_fd.FlowAPI.getSubflow('global', 'shinren_fund_input_processing')
    .withInputs({ processing_month: '2024-03' })
    .run();

var returnCode = subflowResult.outputs.return_code;

if (returnCode === 'Abnormal') {
    // Handle error, notify operations team, etc.
    gs.error('Shinren Fund Input failed for processing month.');
}
```

---

## Step 5 – Scheduled Job (Optional Trigger)

Create a **Scheduled Script Execution** to run monthly:

```javascript
// Name: "Monthly Shinren Fund Input Processing"
// Run: Monthly, 1st of each month (or as required)

var today   = new GlideDateTime();
var year    = today.getYearUTC();
var month   = today.getMonthUTC(); // 1-12
var monthStr = (month < 10 ? '0' + month : '' + month);
var processingMonth = year + '-' + monthStr;

try {
    var result = sn_fd.FlowAPI
        .getSubflow('global', 'shinren_fund_input_processing')
        .withInputs({ processing_month: processingMonth })
        .run();

    gs.info('Scheduled Shinren run result: ' + result.outputs.return_code);
} catch (e) {
    gs.error('Scheduled Shinren run failed: ' + e.message);
}
```

---

## Key Design Decisions

| Decision                          | Rationale                                                    |
|-----------------------------------|--------------------------------------------------------------|
| Script Include for all logic      | Keeps Flow Designer steps thin; enables unit testing         |
| `forEach` with `return` for skip  | Clean implementation of inheritance skip rule (Step 9)       |
| `GlideAggregate` for totals       | Server-side aggregation is far more efficient than looping   |
| Error array accumulation          | Mirrors Step 12's "did ALL steps succeed?" check             |
| Operation Log table               | Replicates the "Output error message to log" branch          |
| YYYY-MM string comparison for months | Works correctly for lexicographic sort (ISO format)       |

---

## Notes

- **"Previous month, current month, next month"** → handled by `_getThreeMonths()` helper.
- **Prefecture Code "99"** → represents the National Total (Step 6).
- **System Usage Rate Account Code** → map to field `u_system_usage_rate_account_code` on source tables.
- All table/field names prefixed with `u_` follow ServiceNow custom table naming convention.