import * as Astronomy from 'astronomy-engine';

export const WGS84 = {
    radiusEquator: 6378.137, // km
    radiusPolar: 6356.752, // km
    flattening: 1 / 298.257223563
};

export type SphericalCoords = {
    lat: number;
    lon: number;
};

export type Vector3D = {
    x: number;
    y: number;
    z: number;
};

/**
 * Returns the position of the Earth in the Heliocentric coordinate system (J2000).
 * Scale: 1 unit = 1 AU (Astronomical Unit) typically, but astronomy-engine uses AU for HelioVector?
 * Checking docs/types: HelioVector returns AU.
 */
export function getEarthOrbitPosition(date: Date): Vector3D {
    const vector = Astronomy.HelioVector(Astronomy.Body.Earth, date);
    // vector is {x, y, z} in AU (J2000 Equatorial)

    // Rotate around X axis by -Obliquity to flatten the orbit (convert to Ecliptic)
    const eps = getObliquity() * (Math.PI / 180);
    const cosE = Math.cos(eps);
    const sinE = Math.sin(eps);

    // Rotation X(-eps):
    // x' = x
    // y' = y*cos - z*sin
    // z' = y*sin + z*cos  <-- No, rotating J2000 Equ to Ecliptic means rotating X axis by +eps? or -eps?
    // J2000 Z is Celestial Pole. Ecliptic Z is Ecliptic Pole.
    // Celestial Pole is TILTED relative to Ecliptic Pole.
    // We want Ecliptic Z to be UP (Y in Three.js terms, or Z in Astro terms).
    // So we want to rotate J2000 such that Ecliptic Plane becomes XY plane.
    // Equator is inclined to Ecliptic.
    // Rotation is around X axis (Vernal Equinox).
    // To bring Equator P (inclined) to Ecliptic P (vertical), we rotate by Obliquity.
    // Vector rotation:
    const y_ecl = vector.y * cosE + vector.z * sinE;
    const z_ecl = -vector.y * sinE + vector.z * cosE;

    return { x: vector.x, y: y_ecl, z: z_ecl };
}

/**
 * Returns the position of the Sun relative to an observer on Earth.
 */
export function getSunPosition(date: Date, location: SphericalCoords) {
    const observer = new Astronomy.Observer(location.lat, location.lon, 0);
    const equator = Astronomy.Equator(Astronomy.Body.Sun, date, observer, true, true);
    const horizon = Astronomy.Horizon(date, observer, equator.ra, equator.dec, 'normal');
    return {
        azimuth: horizon.azimuth,
        altitude: horizon.altitude
    };
}

/**
 * Get sunrise and sunset times for a location.
 */
export function getSunTimes(date: Date, location: SphericalCoords) {
    const observer = new Astronomy.Observer(location.lat, location.lon, 0);
    // Check events for the given date's day (UTC or local?). Astronomy engine usually searches forward?
    // MakeSearchRiseSet returns the event.
    const rise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, date, 1);
    const set = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, date, 1);

    return {
        sunrise: rise ? rise.date : null,
        sunset: set ? set.date : null // date property of the event
    };
}

/**
 * Get solstices and equinoxes for a year.
 */
/**
 * Get solstices and equinoxes for a year with detailed info.
 */
export function getSeasons(year: number) {
    const seasons = Astronomy.Seasons(year);

    const enrich = (date: Date, name: string) => {
        const pos = Astronomy.HelioVector(Astronomy.Body.Earth, date);
        // Calculate heliocentric longitude
        // atan2(y, x) gives angle in radians. Convert to degrees.
        // Range [-180, 180]. Normalize to [0, 360].
        let lonDeg = Math.atan2(pos.y, pos.x) * (180 / Math.PI);
        if (lonDeg < 0) lonDeg += 360;

        return {
            date: date,
            longitude: lonDeg
        };
    };

    return {
        marchEquinox: enrich(seasons.mar_equinox.date, "March Equinox"),
        juneSolstice: enrich(seasons.jun_solstice.date, "June Solstice"),
        sepEquinox: enrich(seasons.sep_equinox.date, "September Equinox"),
        decSolstice: enrich(seasons.dec_solstice.date, "December Solstice")
    };
}

/**
 * Get perihelion and aphelion for a year.
 */
export function getApsis(year: number) {
    return {
        perihelion: findExtremumDistance(year, 0, 4, true), // Jan
        aphelion: findExtremumDistance(year, 6, 4, false)  // July
    };
}



function findExtremumDistance(year: number, month: number, day: number, isMin: boolean) {
    let bestDate = new Date(year, month, day);
    let bestDist = Astronomy.HelioVector(Astronomy.Body.Earth, bestDate).Length();

    // Simple gradient descent / scan
    for (let i = -10; i <= 10; i++) {
        const d = new Date(year, month, day + i);
        const dist = Astronomy.HelioVector(Astronomy.Body.Earth, d).Length();
        if ((isMin && dist < bestDist) || (!isMin && dist > bestDist)) {
            bestDist = dist;
            bestDate = d;
        }
    }
    return bestDate;
}

/**
 * Calculate axial tilt (obliquity of the ecliptic) for visual usage.
 * J2000 obliquity is ~23.44 degrees.
 * Astronomy engine provides this via various calcs, but static approximation is okay for simple visual,
 * or we can get exact if needed.
 */
export function getObliquity() {
    // Mean obliquity of ecliptic J2000
    return 23.4392911;
}

/**
 * Returns the rotation of the Earth in radians for the given date.
 * Based on Greenwich Apparent Sidereal Time (GAST).
 */
export function getEarthRotation(date: Date) {
    const gast = Astronomy.SiderealTime(date); // Hours [0, 24)
    return (gast / 24) * 2 * Math.PI;
}
