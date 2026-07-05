/**
 * Future scheduler entry point.
 * MVP intentionally has no background or automatic jobs. A future cron worker
 * should call runPriceCheck with the same adapter, throttling, and audit path.
 */
export const automaticSchedulingEnabled = false;
