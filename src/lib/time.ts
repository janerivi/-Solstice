
import tzlookup from 'tz-lookup';

/**
 * Returns the IANA Time Zone ID for a given latitude and longitude.
 */
export function getTimeZone(lat: number, lon: number): string {
    try {
        return tzlookup(lat, lon);
    } catch (e) {
        console.warn(`Could not determine timezone for ${lat}, ${lon}, defaulting to UTC`);
        return 'UTC';
    }
}

/**
 * Formats a date to HH:mm string in the local time of the given coordinates.
 */
export function formatLocalTime(date: Date | null, lat: number, lon: number, includeSeconds: boolean = false): string {
    if (!date) return '';
    const timeZone = getTimeZone(lat, lon);
    return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: includeSeconds ? '2-digit' : undefined,
        timeZone,
        hour12: false
    }).format(date);
}

/**
 * Returns the number of minutes since midnight in the local time of the given coordinates.
 */
export function getLocalMinutesFromMidnight(date: Date | null, lat: number, lon: number): number {
    if (!date) return 0;
    const timeZone = getTimeZone(lat, lon);

    // Get parts to reconstruct the local time values
    const parts = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
        timeZone
    }).formatToParts(date);

    let h = 0, m = 0;
    for (const p of parts) {
        if (p.type === 'hour') h = parseInt(p.value, 10);
        if (p.type === 'minute') m = parseInt(p.value, 10);
    }

    // Handle 24:00 edge case if it ever returns that (Intl usually 0-23)
    if (h === 24) h = 0;

    return h * 60 + m;
}

/**
 * Get the start of the day (00:00:00) in the local time of the coordinates,
 * returned as a UTC Date object (the absolute moment midnight happened there).
 */
export function getLocalMidnightDate(date: Date, lat: number, lon: number): Date {
    const timeZone = getTimeZone(lat, lon);

    // Create a formatter for the parts of the given date in the target TZ
    const fmt = new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        timeZone
    });

    // Get the "local date string" e.g. "12/15/2025"
    const localDateStr = fmt.format(date);

    // We want to find the UTC timestamp that corresponds to "12/15/2025 00:00:00" in that TimeZone.
    // Hacky but robust way: construct a string ISO-ish and let Date parse it? 
    // No, Date.parse defaults to local system time or UTC.
    // Cleaner: Use the fact that we can offset it.

    // Actually, finding the exact timestamp of midnight in a variable TZ without a library like Luxon/date-fns-tz is tricky
    // because of DST transitions. 
    // BUT, we can approximate and iterate or use string parsing.

    // Approach: 
    // 1. Get Y,M,D of the date in target TZ.
    // 2. new Date(Date.UTC(Y, M-1, D, ...)) -> This is the "face value" in UTC.
    // 3. We need to shift this back by the offset.
    // Too complex to do manually perfectly.

    // Simpler Approach for visualization loop:
    // We just need a "Start Time" for the graph loop (X=0) and "End Time" (X=24h).
    // The graph loop currently iterates 0..24h in minutes.
    // If we can just map "Target Local Date 00:00" to a set of absolute timestamps?

    // Let's go with the string parsing approach which is generally supported in modern environments if valid ISO/IETF.
    // Or: "12/15/2025, 00:00:00" -> string -> Date? 
    // `new Date("2025-12-15T00:00:00")` parses as Local (System) or UTC?

    // Let's use `Intl` to get the offset?
    // Let's use a binary search or known offset?
    // Wait, the graph iterates 24 hours. The X-axis is "Minutes from midnight".
    // I need the absolute timestamp for "00:00" today in that TZ to start the loop?
    // YES.

    // Helper:
    // 1. Get Y, M, D parts in target TZ.
    // 2. Construct a date object that represents that time *in UTC*? No.
    // 3. Find the offset.

    // Let's try:
    // `toLocaleString` with timeZone -> parse components -> construct formatted string with offset? No.

    // Implementation: "Find timestamp where local time is 00:00"
    // 1. Take current date.
    // 2. Format to "yyyy-mm-dd" in target TZ.
    // 3. Append "T00:00:00".
    // 4. Create a date from this "wall time".
    // 5. This date is likely interpreted in Browser Local or UTC.
    //    We need it interpreted in Target TZ.

    // Tech: `new Date("2025-12-15T00:00:00" + "Z")` invalid if we don't know offset.

    // Correct Native Way without Libraries:
    // 1. `const d = new Date()` associated with Y,M,D.
    // 2. Use `d.toLocaleString('en-US', { timeZone: 'target' })` to see what time it is there.
    // 3. Adjust `d` until it matches 00:00.

    // Optimized:
    // Get the Y/M/D from Intl.
    // Create a naive UTC date `Date.UTC(y, m, d)`.
    // Compare naive `naive.toISOString()` with `naive.toLocaleString(..., {timeZone})`.
    // Calculate difference approx and adjust.
    // Refine.

    const parts = new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        timeZone
    }).formatToParts(date);

    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;

    if (!y || !m || !d) return new Date(date); // Fallback

    // We want the timestamp TS such that formatted(TS) == "y-m-d 00:00:00"
    // Let's guess TS = Date.UTC(y, m-1, d).
    // Check formatted(TS). If it says "Previous Day 19:00", we are ahead/behind.

    // Actually, `tz-lookup` gives us the zone name.
    // Just use a simpler loop in SkyView?
    // For SkyView, we iterate 0..24*60 minutes.
    // We need `getSunPosition(time)`.
    // `time` = Midnight_Local_Abs + m * minutes.

    // So getting `Midnight_Local_Abs` is critical.

    // Let's write a robust findMidnight function in `time.ts` using the approximation method.

    return findMidnight(date, timeZone);
}


function findMidnight(date: Date, timeZone: string): Date {
    // Get target YMD
    const fmt = new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        timeZone
    });
    const parts = fmt.formatToParts(date);
    const y = parseInt(parts.find(p => p.type === 'year')!.value);
    const m = parseInt(parts.find(p => p.type === 'month')!.value);
    const d = parseInt(parts.find(p => p.type === 'day')!.value);

    // Start guess: UTC midnight
    let guess = new Date(Date.UTC(y, m - 1, d));

    // Check offsets.
    // We can just step by hours until we hit 00:00 local?
    // Or binary search.
    // Better: Get offset at guess.

    // Approx offset:
    // Format guess in target TZ.
    // Compare hour.

    // Let's use a brute force since we are only doing this once per render frame/update?
    // No, once per day change.

    // Refined Guess:
    // 1. Guess UTC.
    // 2. Format Guess in TZ -> "H:M".
    // 3. Calculate diff from 00:00.
    // 4. Apply diff.
    // 5. Check again (DST edge cases).

    for (let i = 0; i < 3; i++) {
        const parts2 = new Intl.DateTimeFormat('en-US', {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hour12: false,
            timeZone
        }).formatToParts(guess);

        let h = 0, min = 0, s = 0;
        for (const p of parts2) {
            if (p.type === 'hour') h = parseInt(p.value) % 24;
            if (p.type === 'minute') min = parseInt(p.value);
            if (p.type === 'second') s = parseInt(p.value);
        }

        // We want H=0, M=0, S=0.
        // Diff in ms = (h*3600 + m*60 + s) * 1000.
        // If local time is 04:00, we are "late" (time is advanced). We passed midnight 4 hours ago.
        // So we SUBTRACT 4 hours from the underlying timestamp?
        // Wait, if at UTC 00:00 it is Local 19:00 (prev day), we are "early".
        // H=19. We want 00. Diff = 19h.
        // Should we subtract 19h? No, add 5h.
        // Distance to 24h?

        // Easier:
        // Current Local Time in Minutes from Midnight = h*60 + m.
        // If > 12h (e.g. 19:00), we act as if it is "negative" time from next midnight?
        // No, we want "Today's" Midnight.
        // If we extracted Y/M/D from "Today", then "UTC Midnight" should be reasonably close (within 24h).

        // Case: NY (UTC-5).
        // Target: 2025-12-15 00:00 EST.
        // Guess: 2025-12-15 00:00 UTC.
        // Actual at Guess: 2025-12-14 19:00 EST.
        // We want to ADD 5 hours.
        // 19:00 is 1140 mins.
        // Target is 0 or 24?
        // We want to move FORWARD.
        // Delta = 24*60 - 1140 = 300 mins (5h).
        // New Guess = Guess + 5h.

        // Case: Tokyo (UTC+9).
        // Target: 2025-12-15 00:00 JST.
        // Guess: 2025-12-15 00:00 UTC.
        // Actual at Guess: 2025-12-15 09:00 JST.
        // We want to SUBTRACT 9 hours.
        // 09:00 is 540 mins.
        // Delta = -540 mins.
        // New Guess = Guess - 9h.

        // Logic:
        // diffMinutes = h*60 + m.
        // If diffMinutes > 720 (12h), assume we are "Previous Day" -> We need to move forward.
        //    diff = diffMinutes - 1440. (e.g. 1140 - 1440 = -300. Wait, strict arithmetic: we want target 0.)
        //    We have current `h:m`. We want `00:00` of the SAME logical day?
        //    Wait, "UTC Midnight" gave us "Dec 14 19:00". That is Y=Dec 14.
        //    But we initialized `guess` using Y=Dec 15!
        //    Ah. `Date.UTC(2025, 11, 15)` is `2025-12-15T00:00:00Z`.
        //    In NY, that is `2025-12-14T19:00:00-05:00`.
        //    The Date Object *is* `Dec 15 00h`. The formatted string says `Dec 14`.
        //    We want the formatted string to say `Dec 15 00:00`.
        //    So we are BEHIND. We need to ADVANCE.
        //    How much? 19:00 to 00:00 (next day) is 5 hours.

        //    Check: `guess` timestamp is correct?
        //    We want `Local Midnight`.
        //    If `guess` -> `Dec 14 19:00`.
        //    We want `Dec 15 00:00`.
        //    Diff is +5 hours.

        //    How to detect if we are "Dec 14" vs "Dec 15"?
        //    Check full date string parts?

        //    Let's use `getTimezoneOffset` logic via parts.
        //    It's complicated to do generative logic.

        //    Alternative: `guess` - `offset`.
        //    How to get offset?
        //    `(localTime - utcTime)`.
        //    But we don't have `localTime` as a number.

        //    Let's trust `guess` is within +/- 24h.
        //    We construct `naive target` = `Date.UTC(targetY, targetM, targetD)`.
        //    We construct `naive current` from the formatted parts of `guess`?
        //    `naive current` = `Date.UTC(partY, partM, partD, partH, partMin)`.
        //    `diff` = `naive target` - `naive current`.
        //    `guess` += `diff`.
        //    This should converge instantly.

        const y2 = parseInt(parts2.find(p => p.type === 'year')!.value);
        const m2 = parseInt(parts2.find(p => p.type === 'month')!.value);
        const d2 = parseInt(parts2.find(p => p.type === 'day')!.value);

        const currentNaive = Date.UTC(y2, m2 - 1, d2, h, min, s);
        const targetNaive = Date.UTC(y, m - 1, d); // 00:00:00 target

        const diff = targetNaive - currentNaive;
        if (Math.abs(diff) < 1000) break; // Close enough

        guess = new Date(guess.getTime() + diff);
    }

    return guess;
}
