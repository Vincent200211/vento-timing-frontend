import { useState, useEffect, useCallback, useRef } from "react"

import { useWebSocket } from "./hooks/useWebSocket"

import { fetchSnapshot } from "./services/api"

import { formatGap, compoundColor, compoundBg, teamColor } from "./utils"
import StrategyView from "./StrategyView.jsx";



function SectorBar({ segments }) {

  if (!segments) return null

  return (

    <div style={{ display: "flex", gap: 1, alignItems: "center" }}>

      {segments.map((s, i) => (

        <div key={i} style={{

          width: 4, height: 14, borderRadius: 1,

          background: s === 2049 ? "#27c93f" : s === 2048 ? "#ffd700" : s === 2051 ? "#a855f7" : "#30363d",

          opacity: s === 2049 || s === 2048 || s === 2051 ? 1 : 0.4,

        }} />

      ))}

    </div>

  );

}





function MiniSectorBar({ segments }) {

  if (!segments || segments.length === 0) return null

  const s1 = segments.slice(0, 7)

  const s2 = segments.slice(7, 15)

  const s3 = segments.slice(15, 22)

  const blockStyle = (s) => ({

    width: 4, height: 14, borderRadius: 1,

    background: s === 2049 ? "#27c93f" : s === 2048 ? "#ffd700" : s === 2051 ? "#a855f7" : "#30363d",

    opacity: s === 2049 || s === 2048 || s === 2051 ? 1 : 0.25,

  })

  return (

    <div className="mini-sector-bar">

      <div className="sector-group">

        <span className="sector-label">S1</span>

        <div className="sector-blocks">{s1.map((s, i) => <div key={i} style={blockStyle(s)} />)}</div>

      </div>

      <div className="sector-group">

        <span className="sector-label">S2</span>

        <div className="sector-blocks">{s2.map((s, i) => <div key={i} style={blockStyle(s)} />)}</div>

      </div>

      <div className="sector-group">

        <span className="sector-label">S3</span>

        <div className="sector-blocks">{s3.map((s, i) => <div key={i} style={blockStyle(s)} />)}</div>

      </div>

    </div>

  );

}



function TimingTower({ timing, drivers, appData, selectedDriver, onSelectDriver, showSectors, trackPositions, stintHistory }) {

  if (!timing || timing.length === 0) {

    return <div className="no-session">Waiting for timing data...</div>

  }

  var prevPositionsRef = useRef({});
  var flashTimersRef = useRef({});
  var [flashingDrivers, setFlashingDrivers] = useState({});

  var prevPositionsRef = useRef({});
  var flashTimersRef = useRef({});
  var [flashingDrivers, setFlashingDrivers] = useState({});


  useEffect(function() {
    if (!timing || timing.length === 0) return;
    var prev = prevPositionsRef.current;
    timing.forEach(function(entry) {
      var dn = entry.driver_number;
      if (prev[dn] !== undefined && prev[dn] !== entry.position) {
        setFlashingDrivers(function(old) {
          var next = {};
          Object.assign(next, old);
          next[dn] = true;
          return next;
        });
        if (flashTimersRef.current[dn]) clearTimeout(flashTimersRef.current[dn]);
        flashTimersRef.current[dn] = setTimeout(function() {
          setFlashingDrivers(function(old) {
            var next = {};
            Object.assign(next, old);
            delete next[dn];
            return next;
          });
        }, 800);
      }
      prev[dn] = entry.position;
    });
  }, [timing]);
  
  useEffect(function() {
    return function() {
      Object.values(flashTimersRef.current).forEach(function(t) { clearTimeout(t); });
    };
  }, []);

  useEffect(function() {
    if (!timing || timing.length === 0) return;
    var prev = prevPositionsRef.current;
    timing.forEach(function(entry) {
      var dn = entry.driver_number;
      if (prev[dn] !== undefined && prev[dn] !== entry.position) {
        setFlashingDrivers(function(old) {
          var next = {};
          Object.assign(next, old);
          next[dn] = true;
          return next;
        });
        if (flashTimersRef.current[dn]) clearTimeout(flashTimersRef.current[dn]);
        flashTimersRef.current[dn] = setTimeout(function() {
          setFlashingDrivers(function(old) {
            var next = {};
            Object.assign(next, old);
            delete next[dn];
            return next;
          });
        }, 800);
      }
      prev[dn] = entry.position;
    });
  }, [timing]);
  
  useEffect(function() {
    return function() {
      Object.values(flashTimersRef.current).forEach(function(t) { clearTimeout(t); });
    };
  }, []);
  var orderedTiming = timing;

  return (

    <table className="timing-table">

      <thead>

        <tr>

          <th>Pos</th>

          <th>Driver</th>

          <th>Gap</th>

          <th>Int</th>

          {showSectors && <th style={{textAlign:"center",fontSize:10,color:"#8b949e"}}>Sec</th>}

          <th>Tyres</th>

        </tr>

      </thead>

      <tbody>

        {orderedTiming.map((entry) => {

          const driver = drivers[entry.driver_number]

          const app = appData[entry.driver_number]

          return (

            <tr key={entry.driver_number}

              className={"driver-row" + (selectedDriver === entry.driver_number ? " selected" : "") + (entry.position === 0 ? " retired" : "") + (entry.in_pit ? " in-pit" : "") + (flashingDrivers[entry.driver_number] ? " pos-flash" : "")}

              onClick={() => onSelectDriver(entry.driver_number)}

            >

              <td>

                <span className={"pos-badge" + (entry.position === 0 ? " retired" : "") + (entry.in_pit ? " in-pit" : "") + (flashingDrivers[entry.driver_number] ? " pos-flash" : "")} style={{ background: entry.position === 0 ? "#555" : (teamColor(driver?.team_colour)) }}>{entry.position === 0 ? "R" : entry.position}</span>

              </td>

              <td>

                <div className={"driver-tla" + (entry.position === 0 ? " retired" : "") + (entry.in_pit ? " in-pit" : "") + (flashingDrivers[entry.driver_number] ? " pos-flash" : "")} style={{ color: entry.position === 0 ? "#666" : teamColor(driver?.team_colour) }}>{driver?.tla || entry.driver_number}</div>

                <div className="driver-team">{driver?.team_name || ""}</div>

              </td>

              <td><span className={"gap" + (entry.gap_to_leader === "LAP" ? " lap" : "")}>{formatGap(entry.gap_to_leader) || "-"}</span></td>

              <td><span className="gap">{formatGap(entry.interval) || "-"}</span></td>

              {showSectors && <td style={{padding:"2px 4px"}}><MiniSectorBar segments={entry.segments} /></td>}

              <td>

                {app ? <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: compoundBg(app.compound), color: compoundColor(app.compound), fontWeight: 600 }}>{app.compound || ""}{app.tyre_age > 0 ? "+" + app.tyre_age : ""}</span> : ""}

                {stintHistory && stintHistory[entry.driver_number] && stintHistory[entry.driver_number].length > 0 && (

                  <div style={{ display: "flex", gap: 2, marginTop: 2, flexWrap: "wrap" }}>

                    {stintHistory[entry.driver_number].map((comp, j) => (

                      <div key={j} style={{ width: 6, height: 6, borderRadius: "50%", background: compoundColor(comp) || "#555" }} />

                    ))}

                  </div>

                )}

              </td>

            </tr>

          );

        })}

      </tbody>

    </table>

  );

}



// TelemetryChart

function TelemetryChart({ data, yKey, label, color, height, trackLength, refData, step, fill, corners }) {

  var containerRef = useRef(null);

  var [chartWidth, setChartWidth] = useState(500);

  useEffect(function() {

    function measure() {

      if (containerRef.current) {

        var w = containerRef.current.getBoundingClientRect().width;

        if (w > 0) setChartWidth(w);

      }

    }

    measure();

    window.addEventListener("resize", measure);

    return function() { window.removeEventListener("resize", measure); };

  }, []);

  if (!data || data.length < 2) {

    return <div ref={containerRef} className="no-session" style={{ height: height || 100 }}>No data</div>;

  }

  var h = height || 100;

  var pad = { top: 16, right: 12, bottom: 20, left: 40 };

  var iw = chartWidth - pad.left - pad.right;

  var ih = h - pad.top - pad.bottom;

  // Build point array, skipping entries with null values

 var pts = [];

 for (var i = 0; i < data.length; i++) {

   var p = data[i];

   if (p[yKey] == null) continue;

   var dist = p.distance != null ? p.distance : i * 10;

   var val = p[yKey];

   if (yKey === "brake") {

     if (typeof val === "boolean") val = val ? 1 : 0;

     else if (typeof val === "number") val = Math.min(1, Math.max(0, val));

   }

   pts.push({ distance: dist, value: val, lap: p.lap });

 }

  if (pts.length < 2) {

    return <div ref={containerRef} className="no-session" style={{ height: h }}>Waiting for data...</div>;

  }



  // Build reference driver point array

  var refPts = [];

  if (refData && refData.length > 0) {

    for (var i = 0; i < refData.length; i++) {

      var p = refData[i];

      if (p[yKey] == null) continue;

      var dist = p.distance != null ? p.distance : i * 10;

      var val = p[yKey];

      if (yKey === "brake") {

        if (typeof val === "boolean") val = val ? 1 : 0;

        else if (typeof val === "number") val = Math.min(1, Math.max(0, val));

      }

      refPts.push({ distance: dist, value: val, lap: p.lap });

    }

  }



  // Detect actual track length from data by finding the largest

  // Split points into individual laps by lap number

  var laps = [];

  var cur = [];

  var prevLap = pts.length > 0 ? pts[0].lap : undefined;

  for (var i = 0; i < pts.length; i++) {

    var p = pts[i];

    if (p.lap !== prevLap) {

      if (cur.length > 0) laps.push(cur);

      cur = [];

      prevLap = p.lap;

    }

    cur.push({ distance: p.distance, value: p.value });

  }

  if (cur.length > 0) laps.push(cur);



  // Keep only the latest lap for display

  if (laps.length > 0) {

    laps = [laps[laps.length - 1]];

  } else {

    laps = [pts.map(function(p) {

      return { distance: p.distance, value: p.value };

    })];

  }



  // Split reference driver points into laps

  var refLaps = [];

  if (refPts.length > 0) {

    var cur2 = [];

    var prevLap2 = refPts[0].lap;

    for (var i = 0; i < refPts.length; i++) {

      var p = refPts[i];

      if (p.lap !== prevLap2) {

        if (cur2.length > 0) refLaps.push(cur2);

        cur2 = [];

        prevLap2 = p.lap;

      }

      cur2.push({ distance: p.distance, value: p.value });

    }

    if (cur2.length > 0) refLaps.push(cur2);



    // Keep only the latest lap for display

    if (refLaps.length > 0) {

      refLaps = [refLaps[refLaps.length - 1]];

    } else {

      refLaps = [refPts.map(function(p) {

        return { distance: p.distance, value: p.value };

      })];

    }

  }



  // Fixed x-axis range: always use track length
  var xRange = trackLength || 4655;



  // Determine y-axis range (use fixed ranges for known metrics, data-driven otherwise).

  var yRanges = { speed: [0, 360], rpm: [0, 15000], n_gear: [0, 8], throttle: [0, 100], brake: [0, 1] };

  var minV, maxV;

  var fixedRange = yRanges[yKey];

  if (fixedRange) { minV = fixedRange[0]; maxV = fixedRange[1]; }

  else {

    minV = Infinity; maxV = -Infinity;

    for (var li = 0; li < laps.length; li++) {

      for (var pi = 0; pi < laps[li].length; pi++) {

        var vv = laps[li][pi].value;

        if (vv < minV) minV = vv;

        if (vv > maxV) maxV = vv;

      }

    }

  }

  var vRange = maxV - minV || 1;



 // Build one polyline per lap; newer laps render more opaque.

 var polylineData = laps.map(function(lap, li) {

   var opacity = laps.length === 1 ? 1 : 0.25 + 0.75 * (li + 1) / laps.length;

   var pts;

   if (step) {

     pts = [];

     var prevY = null;

     for (var pi = 0; pi < lap.length; pi++) {

       var x = pad.left + (lap[pi].distance / xRange) * iw;

       var y = pad.top + ih - ((lap[pi].value - minV) / vRange) * ih;

       if (prevY != null) pts.push(x + "," + prevY);

       pts.push(x + "," + y);

       prevY = y;

     }

   } else {

     pts = lap.map(function(p) {

       var x = pad.left + (p.distance / xRange) * iw;

       var y = pad.top + ih - ((p.value - minV) / vRange) * ih;

       return x + "," + y;

     });

   }

   var points = pts.join(" ");

   var fillPoints = null;

   if (step && fill) {

     var yZero = pad.top + ih - ((0 - minV) / vRange) * ih;

     var fpts = [];

     var firstX = lap.length > 0 ? pad.left + (lap[0].distance / xRange) * iw : pad.left;

     var lastX = lap.length > 0 ? pad.left + (lap[lap.length-1].distance / xRange) * iw : pad.left + iw;

     fpts.push(firstX + "," + yZero);

     var fprevY = null;

     for (var pi = 0; pi < lap.length; pi++) {

       var x = pad.left + (lap[pi].distance / xRange) * iw;

       var y = pad.top + ih - ((lap[pi].value - minV) / vRange) * ih;

       if (fprevY != null) fpts.push(x + "," + fprevY);

       fpts.push(x + "," + y);

       fprevY = y;

     }

     fpts.push(lastX + "," + yZero);

     fillPoints = fpts.join(" ");

   }

   return { points: points, fillPoints: fillPoints, opacity: opacity };

 });



  // Build reference driver polyline (interpolated to match main driver X-axis)

  var refPolylineData = null;

  if (refLaps && refLaps.length > 0 && refLaps[0].length > 1 && laps && laps.length > 0 && laps[0].length > 1) {

    var refSorted = refLaps[0].slice().sort(function(a, b) { return a.distance - b.distance; });

    var mainLine = laps[0];

    var refInterpolated = [];

    var refIdx = 0;

    for (var mi = 0; mi < mainLine.length; mi++) {

      var targetDist = mainLine[mi].distance;

      while (refIdx < refSorted.length - 1 && refSorted[refIdx + 1].distance < targetDist) {

        refIdx++;

      }

      if (refIdx < refSorted.length - 1) {

        var p0 = refSorted[refIdx];

        var p1 = refSorted[refIdx + 1];

        if (p1.distance - p0.distance > 0.001) {

          var t = (targetDist - p0.distance) / (p1.distance - p0.distance);

          var interpVal = p0.value + t * (p1.value - p0.value);

          refInterpolated.push({ distance: targetDist, value: interpVal });

        }

      }

    }

    if (refInterpolated.length > 1) {

      var refPoints = refInterpolated.map(function(p) {

        var x = pad.left + (p.distance / xRange) * iw;

        var y = pad.top + ih - ((p.value - minV) / vRange) * ih;

        return x + "," + y;

      }).join(" ");

      refPolylineData = { points: refPoints };

    }

  }



  // Y-axis ticks

  var yTicks = 4;

  var tickLabels = [];

  for (var t = 0; t <= yTicks; t++) {

    var val = minV + (vRange * t) / yTicks;

    var yy = pad.top + ih - (t / yTicks) * ih;

     tickLabels.push({ val: vRange > 2 ? val.toFixed(0) : val.toFixed(1), y: yy });

  }



  return (

    <div ref={containerRef} style={{ width: "100%" }}>

      <svg viewBox={"0 0 " + Math.ceil(chartWidth) + " " + Math.ceil(h)} style={{ width: "100%", height: h, overflow: "visible" }}>

        <text x={chartWidth / 2} y={12} textAnchor="middle" fill="var(--text2)" fontSize="10" fontWeight="600">{label}</text>

        {tickLabels.map(function(t, i) {

          return <line key={"g" + i} x1={pad.left} y1={t.y} x2={chartWidth - pad.right} y2={t.y} stroke="var(--border)" strokeWidth="0.3" />;

        })}

        {tickLabels.map(function(t, i) {

          return <text key={"l" + i} x={pad.left - 4} y={t.y + 3} textAnchor="end" fill="var(--text2)" fontSize="8">{t.val}</text>;

        })}

      {corners ? corners.map(function(c, i) {

        var cx = pad.left + (c.distance / xRange) * iw;

        if (cx < pad.left || cx > chartWidth - pad.right) return null;

        return <g key={"c"+i}>

          <line x1={cx} y1={pad.top} x2={cx} y2={pad.top+ih} stroke="var(--text2)" strokeWidth="0.5" strokeDasharray="2,3" opacity="0.4" />

          <rect x={cx-4} y={pad.top-14} width={8} height={10} rx={1.5} fill="var(--surface2)" stroke="var(--text2)" strokeWidth="0.4" />

          <text x={cx} y={pad.top-6} textAnchor="middle" fill="var(--text2)" fontSize="6" fontWeight="600">{c.no}</text>

        </g>;

      }) : null}

       {refPolylineData ? <polyline points={refPolylineData.points} fill="none" stroke={color || "#58a6ff"} strokeWidth="0.8" opacity="0.25" /> : null}

       {step && fill ? polylineData.map(function(pl, i) {

         return pl.fillPoints ? <polygon key={"fill-" + i} points={pl.fillPoints} fill={color || "#58a6ff"} fillOpacity="0.3" /> : null;

       }) : null}

       {polylineData.map(function(pl, i) {

         return <polyline key={"lap-" + i} points={pl.points} fill="none" stroke={color || "#58a6ff"} strokeWidth="1.2" opacity={pl.opacity} />;

       })}

        <text x={pad.left} y={h - 2} textAnchor="start" fill="var(--text2)" fontSize="7">0m</text>

        <text x={chartWidth - pad.right} y={h - 2} textAnchor="end" fill="var(--text2)" fontSize="7">{Math.round(xRange)}m</text>

      </svg>

    </div>

  );

 }

 

 // TelemetryDeltaChart

function TelemetryDeltaChart({ mainData, refData, height, trackLength }) {

   var containerRef = useRef(null);

   var [chartWidth, setChartWidth] = useState(500);

   useEffect(function() {

     function measure() {

       if (containerRef.current) {

         var w = containerRef.current.getBoundingClientRect().width;

         if (w > 0) setChartWidth(w);

       }

     }

     measure();

     window.addEventListener("resize", measure);

     return function() { window.removeEventListener("resize", measure); };

   }, []);

   var refSorted = (refData || []).filter(function(p) { return p.speed != null && p.distance != null; }).sort(function(a, b) { return a.distance - b.distance; });

   var mainPts = (mainData || []).filter(function(p) { return p.speed != null && p.distance != null; }).sort(function(a, b) { return a.distance - b.distance; });

    // Use latest lap only (reset cumTime per lap, show partial laps)

    function _latestLap(arr) {

      var mx = -1;

      for (var i = 0; i < arr.length; i++) {

        if (arr[i].lap != null && arr[i].lap > mx) mx = arr[i].lap;

      }

      if (mx < 0) return arr;

      var latest = arr.filter(function(p) { return p.lap === mx; });

      if (latest.length < 10 && mx > 0) {

        var prev = arr.filter(function(p) { return p.lap === mx - 1; });

        if (prev.length > 0) return prev.sort(function(a, b) { return a.distance - b.distance; });

      }

      return latest.sort(function(a, b) { return a.distance - b.distance; });

    }

    var _allMain = mainPts;

    var _allRef = refSorted;

    mainPts = _latestLap(_allMain);

    refSorted = _latestLap(_allRef);

    var mLap = mainPts.length > 0 ? mainPts[0].lap : -1;

    var rLap = refSorted.length > 0 ? refSorted[0].lap : -1;

    // Sync to common lap (slower driver's lap) so both have data on same lap

    if (mLap > 0 && rLap > 0 && mLap !== rLap) {

      var commonLap = Math.min(mLap, rLap);

      mainPts = _allMain.filter(function(p) { return p.lap != null && p.lap === commonLap; }).sort(function(a, b) { return a.distance - b.distance; });

      refSorted = _allRef.filter(function(p) { return p.lap != null && p.lap === commonLap; }).sort(function(a, b) { return a.distance - b.distance; });

    }

    var _maxRef = refSorted.length > 0 ? refSorted[refSorted.length-1].distance : 0;

    mainPts = mainPts.filter(function(p, idx, a) { return p.distance <= _maxRef; });

   // Smooth speed data with 3-point moving average to reduce noise

   if (mainPts.length >= 3) {

     mainPts = mainPts.map(function(p, i) {

       var s = p.speed, c = 1;

       if (i > 0) { s += mainPts[i-1].speed; c++; }

       if (i < mainPts.length - 1) { s += mainPts[i+1].speed; c++; }

       return { distance: p.distance, speed: s / c, lap: p.lap };

     });

   }

   if (refSorted.length >= 3) {

     refSorted = refSorted.map(function(p, i) {

       var s = p.speed, c = 1;

       if (i > 0) { s += refSorted[i-1].speed; c++; }

       if (i < refSorted.length - 1) { s += refSorted[i+1].speed; c++; }

       return { distance: p.distance, speed: s / c, lap: p.lap };

     });

   }

   if (refSorted.length < 2 || mainPts.length < 2) { var _h = height || 140; return <div ref={containerRef} style={{ width: "100%" }}><svg viewBox={"0 0 " + Math.ceil(chartWidth) + " " + Math.ceil(_h)} style={{ width: "100%", height: _h }}><text x={chartWidth/2} y={_h/2} textAnchor="middle" fill="var(--text2)" fontSize="12">Select main & reference driver for delta</text></svg></div>; }

   function interpRef(d) {

     if (d <= refSorted[0].distance) return refSorted[0].speed;

     if (d >= refSorted[refSorted.length-1].distance) return refSorted[refSorted.length-1].speed;

     for (var i = 0; i < refSorted.length-1; i++) {

       if (d >= refSorted[i].distance && d <= refSorted[i+1].distance) {

         var t = (d - refSorted[i].distance) / (refSorted[i+1].distance - refSorted[i].distance);

         return refSorted[i].speed + t * (refSorted[i+1].speed - refSorted[i].speed);

       }

     }

     return null;

   }

   var pts = [];

   var cumTime = 0;

   for (var i = 0; i < mainPts.length; i++) {

     var p = mainPts[i];

     var refSpd = interpRef(p.distance);

     var dSpeed = p.speed - refSpd;

     if (i > 0) {

       var ds = p.distance - mainPts[i-1].distance;

       if (ds > 0 && p.speed > 0 && refSpd > 0) {

         var avgMain = (mainPts[i-1].speed + p.speed) / 2;

         cumTime += 3.6 * ds * (refSpd - avgMain) / (avgMain * refSpd);

       }

     }

     pts.push({ dist: p.distance, ds: dSpeed, ct: cumTime });

   }

   if (pts.length < 2) { var _h2 = height || 140; return <div ref={containerRef} style={{ width: "100%" }}><svg viewBox={"0 0 " + Math.ceil(chartWidth) + " " + Math.ceil(_h2)} style={{ width: "100%", height: _h2 }}><text x={chartWidth/2} y={_h2/2} textAnchor="middle" fill="var(--text2)" fontSize="12">Insufficient data</text></svg></div>; }

   var h = height || 140;

   var p = { t: 28, r: 44, b: 20, l: 40 };

   var xRange = trackLength || 4655;

   var cw = chartWidth - p.l - p.r;

   var ch = h - p.t - p.b;

   var da = 100;

   var tmn = -2;

   var tmx = 2;

   var tr = tmx - tmn;

   var dr = 2 * da;

   var zy = p.t + ch - ((0 - (-da)) / dr) * ch;

   function mx(d) { return p.l + (d / xRange) * cw; }

   function my(v, mn, rng) { return p.t + ch - ((v - mn) / rng) * ch; }

   // Fill segments (speed delta clipped to range)

   var segs = [];

   var cur = { sgn: null, xys: [] };

   for (var i = 0; i < pts.length; i++) {

     var clippedDs = Math.min(da, Math.max(-da, pts[i].ds));

     var sgn = clippedDs >= 0 ? 1 : -1;

     var xpt = { x: mx(pts[i].dist), y: my(clippedDs, -da, dr), v: clippedDs };

     if (cur.sgn !== null && cur.sgn !== sgn) {

       if (cur.xys.length > 1) { segs.push({ xys: cur.xys, sgn: cur.sgn }); }

       cur = { sgn: sgn, xys: [xpt] };

     } else { cur.xys.push(xpt); }

   }

   if (cur.xys.length > 1) segs.push({ xys: cur.xys, sgn: cur.sgn });

   var spdStr = pts.map(function(x) { return mx(x.dist) + "," + my(x.ds, -da, dr); }).join(" ");

    var timStr = pts.map(function(x) { return mx(x.dist) + "," + my(x.ct, tmn, tr); }).join(" ");

    var _blockClr = pts.length > 0 && pts[pts.length-1].ds > 0 ? "#27c93f" : (pts.length > 0 && pts[pts.length-1].ds < 0 ? "#e10600" : "#8b949e");

   var ytks = [];

   for (var t = 0; t <= 4; t++) { var val = -da + (dr * t) / 4; ytks.push({ val: val.toFixed(1), y: my(val, -da, dr) }); }

    // var ttks = [];

    // for (var t = 0; t <= 4; t++) { var val = tmn + (tr * t) / 4; ttks.push({ val: val.toFixed(2), y: my(val, tmn, tr) }); }

   return (

     <div ref={containerRef} style={{ width: "100%" }}>

       <svg viewBox={"0 0 " + Math.ceil(chartWidth) + " " + Math.ceil(h)} style={{ width: "100%", height: h, overflow: "visible" }}>

         <text x={chartWidth/2} y={12} textAnchor="middle" fill="var(--text2)" fontSize="10" fontWeight="600">Delta</text>

         <rect x={chartWidth-p.r-18} y={2} width={18} height={18} rx={3} fill={_blockClr} />

         {ytks.map(function(t, i) { return <line key={"g"+i} x1={p.l} y1={t.y} x2={chartWidth-p.r} y2={t.y} stroke="var(--border)" strokeWidth="0.3" />; })}

         {ytks.map(function(t, i) { return <text key={"l"+i} x={p.l-4} y={t.y+3} textAnchor="end" fill="var(--text2)" fontSize="8">{t.val}</text>; })}

         <line x1={p.l} y1={zy} x2={chartWidth-p.r} y2={zy} stroke="var(--text2)" strokeWidth="0.5" strokeDasharray="3,3" />

         {segs.map(function(s, i) {

           var fill = s.xys.map(function(x) { return x.x + "," + x.y; }).join(" ");

           fill += " " + s.xys[s.xys.length-1].x + "," + zy + " " + s.xys[0].x + "," + zy;

           return <polygon key={"f"+i} points={fill} fill={s.sgn > 0 ? "#27c93f" : "#e10600"} fillOpacity="0.15" />;

         })}

         <polyline points={spdStr} fill="none" stroke="#a78bfa" strokeWidth="1.5" />

          <polyline points={timStr} fill="none" stroke="#fb923c" strokeWidth="1" strokeDasharray="4,2" />

         <text x={p.l} y={h-2} textAnchor="start" fill="var(--text2)" fontSize="7">0m</text>

         <text x={chartWidth-p.r} y={h-2} textAnchor="end" fill="var(--text2)" fontSize="7">{Math.round(xRange)}m</text>

         <text x={p.l+4} y={p.t+12} fill="#a78bfa" fontSize="8">Speed Delta (km/h)</text>

         <text x={p.l+4} y={p.t+22} fill="#fb923c" fontSize="8">Time Gap (s)</text>

       </svg>

     </div>

   );

 }

 

 // TelemetryPanel

function TelemetryPanel({ carData, positions, driverNumber }) {

  const latestCar = carData?.[driverNumber]?.[carData?.[driverNumber]?.length - 1];

  if (!latestCar) {

    return <div className="no-session">Select a driver to view telemetry</div>;

  }

  return (

    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

      <div className="telemetry-metrics">

        <div className="metric-card"><div className="metric-value" style={{ color: "#58a6ff" }}>{latestCar.speed}</div><div className="metric-label">Speed (km/h)</div></div>

        <div className="metric-card"><div className="metric-value" style={{ color: latestCar.rpm > 10000 ? "#e10600" : "#27c93f" }}>{latestCar.rpm?.toLocaleString()}</div><div className="metric-label">RPM</div></div>

        <div className="metric-card"><div className="metric-value" style={{ color: latestCar.throttle > 50 ? "#27c93f" : "#8b949e" }}>{latestCar.throttle}%</div><div className="metric-label">Throttle</div></div>

        <div className="metric-card"><div className="metric-value" style={{ color: latestCar.brake ? "#e10600" : "#8b949e" }}>{latestCar.brake ? "ON" : "OFF"}</div><div className="metric-label">Brake</div></div>

        <div className="metric-card"><div className="metric-value">{latestCar.n_gear || "-"}</div><div className="metric-label">Gear</div></div>

        <div className="metric-card"><div className="metric-value" style={{ color: latestCar.drs === 1 ? "#27c93f" : latestCar.drs === 0 ? "#8b949e" : "#888" }}>{latestCar.drs === 1 ? "OPEN" : latestCar.drs === 0 ? "CLOSED" : "---"}</div><div className="metric-label">DRS</div></div>

        <div className="metric-card"><div className="metric-value" style={{ color: latestCar.rpm === 0 ? "#e10600" : "#8b949e" }}>{latestCar.rpm === 0 ? "STALL" : "RUN"}</div><div className="metric-label">Engine</div></div>

      </div>

    </div>

  );

}



function RaceRing({ trackPositions, drivers, selectedDriver, onSelectDriver, lapCount, trackStatus, timing, pitMedian, trackLength, pitLossAvailable, appData, stintHistory, circuit, raceControl, session }) {

// RaceRing

   const isPracticeQualifying = session?.session_type && (session.session_type.toLowerCase().includes("practice") || session.session_type.toLowerCase().includes("qualifying"));
   const [countdown, setCountdown] = useState("");

   useEffect(() => {
         if (!isPracticeQualifying || !session?.end_date) { setCountdown(""); return; }
         const updateCountdown = () => {
           var endDateStr = session.end_date;
           var offsetStr = session.gmt_offset || "00:00:00";
           var sign = offsetStr.startsWith("-") ? "" : "+";
           var offsetParts = offsetStr.split(":");
          var offsetTrimmed = offsetParts[0] + ":" + (offsetParts[1] || "00");
          var fullIso = endDateStr + sign + offsetTrimmed;
           var endDate = new Date(fullIso);
           var diff = endDate - new Date();
           if (diff <= 0) { setCountdown("00:00"); return; }
           var hours = Math.floor(diff / 3600000);
           var mins = Math.floor((diff % 3600000) / 60000);
           var secs = Math.floor((diff % 60000) / 1000);
           setCountdown((hours > 0
             ? String(hours).padStart(2,'0') + ":" + String(mins).padStart(2,'0') + ":" + String(secs).padStart(2,'0')
             : String(mins).padStart(2,'0') + ":" + String(secs).padStart(2,'0')));
         };
         updateCountdown();
         var interval = setInterval(updateCountdown, 1000);
         return function() { clearInterval(interval); };
       }, [isPracticeQualifying, session?.end_date, session?.gmt_offset]);



   const started = (trackStatus && trackStatus.status) || (session && session.session_type);

   const redFlag = trackStatus?.status?.includes("Red");

   // Detect SC/VSC from RaceControlMessages (fallback: trackStatus)

   var raceMsgs = raceControl || [];

    var hasActiveSC = (() => {

      var currentLap = (lapCount && lapCount.current_lap) || 0;

      for (var ri = raceMsgs.length - 1; ri >= 0; ri--) {

        var msg = raceMsgs[ri];

        if (msg && msg.category === "SafetyCar") {

          // Only consider messages up to current lap (for proper timeline simulation)

          if (msg.lap != null && msg.lap > currentLap) continue;

          var m = (msg.message || "").toUpperCase();

          if (m.includes("END")) return null;

          if (m.includes("VSC")) return "VSC";

          return "SC";

        }

      }

      // Fallback: check trackStatus if no race control data

      if (trackStatus?.status?.includes("SafetyCar")) return "SC";

      if (trackStatus?.status?.includes("VirtualSafetyCar")) return "VSC";

      return null;

    })();

   const isSC = hasActiveSC === "SC";

   const isVSC = hasActiveSC === "VSC";

   const cars = (trackPositions || []).map(tp => {

     return { number: tp.driver_number, angle: tp.angle || 0, color: teamColor(drivers[tp.driver_number]?.team_colour), tla: tp.tla || tp.driver_number };

   });

   const gapByDriver = {};

   if (timing) {

     timing.forEach(t => {

       gapByDriver[t.driver_number] = t.gap_to_leader;

     });

   }

   const R = 68; const CX = 80; const CY = 80;

   const compoundColors = {SOFT:"#da291c",HARD:"#ffffff",MEDIUM:"#ffd700",INTERMEDIATE:"#4caf50",WET:"#2196f3"};

   const stintComps = (stintHistory && selectedDriver != null) ? (stintHistory[selectedDriver] || stintHistory[String(selectedDriver)] || []) : [];

   const currentCompound = (appData && selectedDriver && appData[selectedDriver] && appData[selectedDriver].compound) || null;

    function polar(a, r) { var rad = (a - 90) * Math.PI / 180; return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)]; }

   return (

      <div className={"track-map" + (isSC || isVSC ? " safety-car-active" : "")}>

          {/* SC indicator */}

          <div style={{position:"absolute",top:6,left:6,zIndex:2,display:"flex",gap:4,pointerEvents:"none"}}>

            <div style={{display:"flex",flexDirection:"column",alignItems:"center",

              border:isSC?"1px solid #ffd700":"1px solid rgba(255,255,255,0.08)",

              borderRadius:4,padding:"2px 7px",lineHeight:1.2,transition:"all 0.4s",

              background:isSC?"rgba(255,215,0,0.12)":"var(--surface)"}}>

              <span style={{fontSize:13,fontWeight:900,color:isSC?"#ffd700":"var(--text2)",lineHeight:1}}>SC</span>

              <span style={{fontSize:6,fontWeight:600,color:isSC?"#ffd700":"var(--text2)",letterSpacing:"0.5px",lineHeight:1}}>SAFETY CAR</span>

            </div>

            <div style={{display:"flex",flexDirection:"column",alignItems:"center",

              border:isVSC?"1px solid #ffd700":"1px solid rgba(255,255,255,0.08)",

              borderRadius:4,padding:"2px 7px",lineHeight:1.2,transition:"all 0.4s",

              background:isVSC?"rgba(255,215,0,0.12)":"var(--surface)"}}>

              <span style={{fontSize:13,fontWeight:900,color:isVSC?"#ffd700":"var(--text2)",lineHeight:1}}>VSC</span>

              <span style={{fontSize:6,fontWeight:600,color:isVSC?"#ffd700":"var(--text2)",letterSpacing:"0.5px",lineHeight:1}}>VIRTUAL SC</span>

            </div>

          </div>

       {redFlag ? (

         <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",width:"100%",position:"relative",minHeight:180}}>

           <span className="flash-text" style={{fontSize:20,fontWeight:700,color:"#e10600",letterSpacing:2}}>RED FLAG</span>

         </div>

       ) : !started ? (

         <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",width:"100%",position:"relative",minHeight:180}}>

           <span className="flash-text" style={{fontSize:24,fontWeight:700,color:"#e10600",letterSpacing:2}}>NOT START</span>

         </div>

       ) : (

       <svg viewBox="0 0 160 160">

         <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth="12" opacity={0.4} />

         {/* Coloured stint segments */}
         {isPracticeQualifying ? (
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#30363d" strokeWidth={12} opacity={0.15} />
         ) : (() => {


          const circumference = 2 * Math.PI * R;

          var parsed = (stintComps || []).map(function(s) {

            return typeof s === 'string' ? { compound: s, lap_count: 1 } : { compound: s.compound, lap_count: s.lap_count || 1 };

          });

          var curLap = lapCount ? (lapCount.current_lap || 0) : 0;

          var doneLaps = parsed.reduce(function(a, s) { return a + s.lap_count; }, 0);

          var curEst = curLap - doneLaps;

          if (currentCompound && curEst > 0) { parsed.push({ compound: currentCompound, lap_count: curEst }); }

          if (parsed.length === 0) {

            return <circle cx={CX} cy={CY} r={R} fill="none" stroke="#30363d" strokeWidth={12} opacity={0.15} />;

          }

          var totalLaps = parsed.reduce(function(a, s) { return a + s.lap_count; }, 0);

          // Use race total laps as denominator so the ring fills progressively

          var raceTotal = lapCount ? (lapCount.total_laps || 0) : 0;

          var denom = raceTotal > 0 ? raceTotal : Math.max(totalLaps, 60);

          var off = 0;

          return parsed.map(function(s, i) {

            var segLen = Math.max((s.lap_count / denom) * circumference, 2);

            var startAngle = (off / circumference) * 360;

            var endAngle = ((off + segLen) / circumference) * 360;

            off += segLen;

            var sa = (startAngle - 90) * Math.PI / 180;

            var ea = (endAngle - 90) * Math.PI / 180;

            var x1 = CX + R * Math.cos(sa);

            var y1 = CY + R * Math.sin(sa);

            var x2 = CX + R * Math.cos(ea);

            var y2 = CY + R * Math.sin(ea);

            var la = (endAngle - startAngle) > 180 ? 1 : 0;

            var d = "M " + x1.toFixed(2) + " " + y1.toFixed(2) + " A " + R + " " + R + " 0 " + la + " 1 " + x2.toFixed(2) + " " + y2.toFixed(2);

            var color = compoundColors[s.compound] || "#555";

            return <path key={i} d={d} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" opacity={0.85} />;

          });



         })()}



        {(() => {

          const splits = circuit && circuit.sector_splits;

          const tLen = trackLength || 4657;

          const angles = splits ? [

            (splits.s1 / tLen) * 360,

            (splits.s2 / tLen) * 360,

            0,

          ] : [0, 120, 240];

          return angles.map(function(deg) {

           const rad = (deg - 90) * Math.PI / 180;

           return <line key={deg} x1={CX+(R-10)*Math.cos(rad)} y1={CY+(R-10)*Math.sin(rad)} x2={CX+R*Math.cos(rad)} y2={CY+R*Math.sin(rad)} stroke="var(--border)" strokeWidth="1.8" />;

          });

        })()}



        {/* Corner markers: short tick marks + number */}

        {circuit?.corners?.map(function(cr) {

          const deg = (cr.distance / trackLength) * 360;

          const rad = (deg - 90) * Math.PI / 180;

          const x1 = CX + (R-7) * Math.cos(rad);

          const y1 = CY + (R-7) * Math.sin(rad);

          const x2 = CX + (R-2) * Math.cos(rad);

          const y2 = CY + (R-2) * Math.sin(rad);

          const nx = CX + (R-10) * Math.cos(rad);

          const ny = CY + (R-10) * Math.sin(rad);

          return <g key={"c"+cr.no}>

            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text2)" strokeWidth="0.8" opacity={0.4} />

            <text x={nx} y={ny} textAnchor="middle" dominantBaseline="central" fill="var(--text2)" fontSize="3.5" fontWeight="600" opacity={0.55}>{cr.no}</text>

          </g>;

        })}

          {/* PITLOSS */}
            {pitMedian != null ? (

            <text x={80} y={46} textAnchor="middle" fontSize="6" fill="#ff8800" fontWeight="700">

              PITLOSS {pitMedian.toFixed(1)}s

              <animate attributeName="opacity" values="0.2;1;0.2;1;0.2;1" dur="0.8s" repeatCount="1" fill="freeze" />

            </text>

          ) : (

            <text x={80} y={46} textAnchor="middle" fontSize="6" fill="var(--text2)" fontWeight="700" opacity={0.15}>

              PITLOSS --

            </text>

          )}

          {isPracticeQualifying && <text x={80} y={86} textAnchor="middle" fontSize="20" fill="var(--text)" fontWeight="700">
              {session?.session_name || "SESSION"}
            </text>}
          {isPracticeQualifying && <text x={80} y={120} textAnchor="middle" fontSize="14" fill="var(--text)" fontWeight="900">
              {countdown || "--:--"}
            </text>}
          {!isPracticeQualifying && lapCount && <text x={80} y={96} textAnchor="middle" fontSize="36" fill="var(--text)" fontWeight="900">

              {lapCount.current_lap}

              <tspan fontSize="14" fill="none" stroke="var(--text)" strokeWidth="0.8" dx="4">/{lapCount.total_laps}</tspan>

            </text>}



         <line x1={CX} y1={CY-R-4} x2={CX} y2={CY-R+8} stroke="#e10600" strokeWidth="1.5" />

         {cars.map(car => {

           const rad = (car.angle - 90) * Math.PI / 180;

           return <circle key={"m"+car.number} cx={CX + (R+1) * Math.cos(rad)} cy={CY + (R+1) * Math.sin(rad)} r={2} fill={car.color} />;

         })}

         {cars.map(car => {

           const rad = (car.angle - 90) * Math.PI / 180;

           const x = CX + R * Math.cos(rad);

           const y = CY + R * Math.sin(rad);

           return (

             <g key={car.number} onClick={() => onSelectDriver?.(car.number)} style={{cursor: "pointer"}}>

               <circle cx={x} cy={y} r={4} fill={car.color} stroke="#fff" strokeWidth="0.6" />

               <text x={x} y={y} textAnchor="middle" dy=".3em" fontSize="3.2" fill="var(--text)" style={{pointerEvents: "none", fontWeight: 700}}>{car.number}</text>

             </g>

           );

         })}

         {cars.map(car => {

           const rad = (car.angle - 90) * Math.PI / 180;

           const gap = gapByDriver[car.number];

           if (gap == null) return null;

           const gx = CX + (R+8) * Math.cos(rad);

           const gy = CY + (R+8) * Math.sin(rad);

           return <text key={"g"+car.number} x={gx} y={gy} textAnchor="middle" dominantBaseline="central" fontSize="2.6" fill={car.color} fontWeight="600" style={{pointerEvents: "none"}}>{formatGap(gap)}</text>;

         })}

          {!isPracticeQualifying && pitMedian != null && selectedDriver && trackPositions && trackLength && (() => {

           var entry = trackPositions.find(tp => tp.driver_number === selectedDriver);

           if (!entry || !entry.pit_window_delta) return null;

           // Handle both object {min, max} and legacy number format

           var pwd = entry.pit_window_delta;

           var minDist = (typeof pwd === 'object' ? pwd.min : pwd) || 0;

           var maxDist = (typeof pwd === 'object' ? pwd.max : pwd) || 0;

           if (minDist <= 0) return null;

           var R_ARC = R + 5;

           var a = entry.angle || 0;

           // Min arc (solid orange)

           var arcAngleMin = Math.min(360, (minDist / trackLength) * 360);

           if (arcAngleMin <= 1) return null;

           var saMin = ((a - arcAngleMin + 360) % 360);

           var srMin = ((saMin - 90) * Math.PI) / 180;

           var erMin = ((a - 90) * Math.PI) / 180;

           var x1Min = CX + R_ARC * Math.cos(srMin);

           var y1Min = CY + R_ARC * Math.sin(srMin);

           var x2Min = CX + R_ARC * Math.cos(erMin);

           var y2Min = CY + R_ARC * Math.sin(erMin);

           var laMin = arcAngleMin > 180 ? 1 : 0;

           var dMin = "M " + x1Min + " " + y1Min + " A " + R_ARC + " " + R_ARC + " 0 " + laMin + " 1 " + x2Min + " " + y2Min;

           // Max arc (dashed lighter) if different

           var hasMax = maxDist > minDist;

           var dMax = null;

           if (hasMax) {

               var arcAngleMax = Math.min(360, (maxDist / trackLength) * 360);

               if (arcAngleMax > 1 && Math.abs(arcAngleMax - arcAngleMin) > 0.5) {

                   var saMax = ((a - arcAngleMax + 360) % 360);

                   var srMax = ((saMax - 90) * Math.PI) / 180;

                   var erMax = ((a - 90) * Math.PI) / 180;

                   var x1Max = CX + R_ARC * Math.cos(srMax);

                   var y1Max = CY + R_ARC * Math.sin(srMax);

                   var x2Max = CX + R_ARC * Math.cos(erMax);

                   var y2Max = CY + R_ARC * Math.sin(erMax);

                   var laMax = arcAngleMax > 180 ? 1 : 0;

                   dMax = "M " + x1Max + " " + y1Max + " A " + R_ARC + " " + R_ARC + " 0 " + laMax + " 1 " + x2Max + " " + y2Max;

               }

           }

           return <>

             <path d={dMin} fill="none" stroke="#ff8800" strokeWidth="3" strokeLinecap="round" opacity="1" />

             {dMax && <path d={dMax} fill="none" stroke="#ff8800" strokeWidth="2" strokeLinecap="round" opacity="0.4" strokeDasharray="3,3" />}

           </>;

         })()}

       </svg>

      )}

     </div>

   );

 }



// WeatherPanel

function WeatherPanel({ weather }) {

  if (!weather) return <div className="no-session">No weather data</div>;

  return (

    <div className="weather-grid">

      <div className="weather-item"><span className="value">{weather.air_temperature?.toFixed(1)}°C</span><span className="label">Air Temp</span></div>

      <div className="weather-item"><span className="value">{weather.track_temperature?.toFixed(1)}°C</span><span className="label">Track Temp</span></div>

      <div className="weather-item"><span className="value">{weather.humidity?.toFixed(0)}%</span><span className="label">Humidity</span></div>

      <div className="weather-item"><span className="value">{weather.wind_speed?.toFixed(0)}</span><span className="label">Wind (m/s)</span></div>

      <div className="weather-item"><span className="value">{weather.pressure?.toFixed(0)}</span><span className="label">Pressure (hPa)</span></div>

      <div className="weather-item"><span className="value" style={{ color: weather.rainfall ? "#58a6ff" : "#8b949e" }}>{weather.rainfall ? "YES" : "NO"}</span><span className="label">Rain</span></div>

    </div>

  );

}



// RaceControl

function RaceControl({ messages }) {

  if (!messages || messages.length === 0) {

    return <div className="no-session" style={{ height: 80 }}>No messages</div>;

  }

  return (

    <div className="race-control-list">

      {messages.map((m, i) => (

        <div key={i} className="rc-message">

          <span className={"rc-flag " + (m.flag?.toLowerCase() || "")}>{m.flag || "INFO"}</span>

          <span style={{ flex: 1 }}>{m.message}</span>

          <span style={{ color: "#8b949e", fontSize: 10 }}>{m.lap ? "L" + m.lap : ""}</span>

        </div>

      ))}

    </div>

  );

}



// GGDiagram

function GGDiagram({ data, height }) {

  var containerRef = useRef(null);

  var [chartWidth, setChartWidth] = useState(400);

  useEffect(function() {

    function measure() {

      if (containerRef.current) {

        var rect = containerRef.current.getBoundingClientRect();

        if (rect.width > 0) setChartWidth(rect.width);

      }

    }

    measure();

    window.addEventListener("resize", measure);

    return function() { window.removeEventListener("resize", measure); };

  }, [height]);

  if (!data || data.length < 3) {

    return <div ref={containerRef} className="no-session" style={{ height: height || 250 }}>Collecting G-G data...</div>;

  }

  var h = height || chartWidth;

  var pad = { top: 20, right: 20, bottom: 24, left: 24 };

  var iw = chartWidth - pad.left - pad.right;

  var ih = h - pad.top - pad.bottom;

  var gRangeX = 0.5;

  var cx = pad.left + iw / 2;

 var cy = pad.top + ih / 2;

 function toX(g) { return cx + (g / gRangeX) * (iw / 2); }

  function toY(g) { return cy + (g < 0 ? g / 5.0 : g / 2.0) * (ih / 2); }

  var refRx = (0.5 / gRangeX) * (iw / 2);

  var refRy = (0.5 / 5.0) * (ih / 2);

  var ptR = Math.max(1, Math.min(2.5, 300 / data.length));

  var n = data.length;

  var pts = data.map(function(p, i) { return { x: toX(p.lat), y: toY(p.lon), a: 0.4 + 0.6 * (i / n) }; });

  return (

    <div ref={containerRef} style={{ width: "100%" }}>

      <svg viewBox={"0 0 " + Math.ceil(chartWidth) + " " + Math.ceil(h)} style={{ width: "100%", height: h }}>

        {[-0.5,-0.25,0,0.25,0.5].map(function(v) { return <line key={"gx"+v} x1={toX(v)} y1={pad.top} x2={toX(v)} y2={pad.top+ih} stroke="var(--border)" strokeWidth="0.4" />; })}

        {[-5,-4,-3,-2,-1,0,0.5,1,1.5,2].map(function(v) { return <line key={"gy"+v} x1={pad.left} y1={toY(v)} x2={pad.left+iw} y2={toY(v)} stroke="var(--border)" strokeWidth="0.4" />; })}

        <line x1={pad.left} y1={cy} x2={pad.left+iw} y2={cy} stroke="var(--text2)" strokeWidth="0.6" />

        <line x1={cx} y1={pad.top} x2={cx} y2={pad.top+ih} stroke="var(--text2)" strokeWidth="0.6" />

        <ellipse cx={cx} cy={cy} rx={refRx} ry={refRy} fill="none" stroke="var(--text2)" strokeWidth="0.4" strokeDasharray="3,3" opacity="0.3" />

       {pts.map(function(p, i) { return <circle key={i} cx={p.x} cy={p.y} r={ptR} fill="#58a6ff" opacity={p.a} />; })}

        {pts.length > 0 ? <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r={5} fill="#ff4444" stroke="#fff" strokeWidth="1.5" /> : null}

        <text x={cx} y={h-4} textAnchor="middle" fill="var(--text2)" fontSize="8">Lateral G</text>

        <text x={10} y={cy+3} textAnchor="start" fill="var(--text2)" fontSize="8">Brake →</text>
        <text x={chartWidth-10} y={pad.top+2} textAnchor="end" fill="#8b949e" fontSize="7" opacity="0.6">+5G</text>

        <text x={pad.left} y={pad.top+ih+10} textAnchor="start" fill="#8b949e" fontSize="7" opacity="0.6">-2G</text>

        <text x={chartWidth-10} y={h-14} textAnchor="end" fill="#8b949e" fontSize="7" opacity="0.6">+0.5G</text>

        <text x={pad.left} y={h-14} textAnchor="start" fill="#8b949e" fontSize="7" opacity="0.6">-0.5G</text>

      </svg>

    </div>

  );

}



// GeneralView

function GeneralView({ snapshot, selectedDriver, onSelectDriver, trackPositions }) {

  if (!snapshot) return null;

  const { session, drivers, timing_sorted, app_data, positions, weather, race_control, lap_count, track_status, pit_median, circuit, pit_loss_available, stint_history } = snapshot;

  // Fallback: direct API fetch for race_control (bypasses WebSocket timing issues)

  const [apiRaceControl, setApiRaceControl] = useState(null);

  useEffect(() => {

    var attempts = 0;

    var maxAttempts = 5;

    var timer;

    function tryFetch() {

      fetch("/api/race_control")

        .then(function(r) { return r.json(); })

        .then(function(data) {

          if (data && data.length > 0) {

            setApiRaceControl(data);

          } else if (++attempts < maxAttempts) {

            timer = setTimeout(tryFetch, 2000);

          }

        })

        .catch(function() {

          if (++attempts < maxAttempts) { timer = setTimeout(tryFetch, 2000); }

        });

    }

    tryFetch();

    return function() { if (timer) clearTimeout(timer); };

  }, []);

  const effectiveRaceControl = (race_control && race_control.length > 0) ? race_control : (apiRaceControl || []);

  const sessionStatus = session?.session_status === "Started" ? "LIVE" : session?.session_status || "N/A";

  const w = weather;

  return (

    <>

      <div className="session-bar">

        <span className="meeting">{session?.meeting_name || "F1"}</span>

        <span className="session">{session?.session_name || ""}</span>

        {session?.circuit_short && <span style={{ color: "#8b949e" }}>{session.circuit_short}</span>}

        <span className="status">{sessionStatus}</span>

        

        <span style={{ marginLeft: "auto", fontSize: 11, color: "#8b949e" }}>{session?.session_type && (session.session_type.toLowerCase().includes("practice") || session.session_type.toLowerCase().includes("qualifying")) ? (session?.session_name || "SESSION") : ("L " + (lap_count?.current_lap || 0) + "/" + (lap_count?.total_laps || "-"))}</span>

      </div>

      <div className="dashboard">

        <div className="panel">

          <div className="panel-header"><span>Timing</span></div>

          <div className="panel-body" style={{ maxHeight: "calc(100vh - 160px)", overflowY: "auto" }}>

            <TimingTower timing={timing_sorted} drivers={drivers} appData={app_data} selectedDriver={selectedDriver} onSelectDriver={onSelectDriver} showSectors={true} trackPositions={trackPositions} stintHistory={stint_history} />

          </div>

        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0, height: "100%" }}>

          <div className="panel" style={{ flex: "0 0 auto" }}>

            <div className="panel-header"><span>Track</span>{selectedDriver && drivers?.[selectedDriver] && <span style={{ color: "#58a6ff" }}>{drivers[selectedDriver].tla} #{selectedDriver}</span>}</div>

          {w ? (

            <div className="track-weather-bar">

              <span>&#127777; Air {w.air_temperature?.toFixed(0)}°C</span>

              <span>&#127777; Track {w.track_temperature?.toFixed(0)}°C</span>

              <span>&#128167; {w.humidity?.toFixed(0)}%</span>

              <span>&#127744; {w.wind_speed?.toFixed(0)} m/s</span>

              {w.rainfall ? <span style={{color:"#58a6ff",fontWeight:700}}>&#127783; RAIN</span> : null}

            </div>

          ) : null}

            <div className="panel-body"><RaceRing trackPositions={trackPositions} drivers={drivers} selectedDriver={selectedDriver} onSelectDriver={onSelectDriver} lapCount={lap_count} trackStatus={track_status} timing={timing_sorted} pitMedian={pit_median} trackLength={circuit?.length_m || 4655} pitLossAvailable={pit_loss_available} appData={app_data} stintHistory={stint_history} circuit={circuit} raceControl={effectiveRaceControl} session={session} /></div>

          </div>

          <div className="panel" style={{ flex: "1 1 auto", overflow: "hidden", display: "flex", flexDirection: "column" }}><div className="panel-header">Race Control</div><div className="panel-body" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}><RaceControl messages={race_control} /></div></div>

        </div>

      </div>

    </>

  );

}



// EngineeringView

 function EngineeringView({ snapshot, selectedDriver, onSelectDriver, carDataStream, trackLength, mainDriverRef, refDriverRef, trackPositions }) {

 var [mainDriver, setMainDriver] = useState(null);

 var [refDriver, setRefDriver] = useState(null);

var [visibleColumns, setVisibleColumns] = useState({ speed: true, throttle: true, brake: true, gear: true, delta: true, rpm: true });

 useEffect(function() {

   if (mainDriverRef && mainDriverRef.current) { setMainDriver(mainDriverRef.current); if (onSelectDriver) onSelectDriver(mainDriverRef.current); }

   if (refDriverRef && refDriverRef.current) { setRefDriver(refDriverRef.current); }

 }, []);

 // GG data accumulation

  // Sync mainDriver from selectedDriver (when switching from General to Dynamic tab)
  useEffect(function() {
    if (selectedDriver != null) {
      setMainDriver(selectedDriver);
    }
  }, [selectedDriver]);

  // GG data accumulation
  var ggDataRef = useRef({});

 var lastGgTsRef = useRef({});

  var lastGgLapRef = useRef({});

 var [, ggUpdate] = useState(0);
 // Car data accumulation (telemetry)
 var carDataAccRef = useRef({});
 var lastCarLapRef = useRef({});

 useEffect(function() {

    if (!snapshot?.positions) return;

    var pos = snapshot.positions;

    var updated = false;

    Object.keys(pos).forEach(function(dnStr) {

      var dn = parseInt(dnStr);

      var pts = pos[dnStr];

     if (!pts || pts.length === 0) return;









     var lastTs = lastGgTsRef.current[dn] || 0;

      // Use the LAST (most recent) point for lap detection, not the first
      if (pts.length > 0) {
        var lastPt = pts[pts.length - 1];
        if (lastPt.lap != null) {
          var curLap = lastPt.lap;
          if (lastGgLapRef.current[dn] != null && lastGgLapRef.current[dn] !== curLap) {
            ggDataRef.current[dn] = [];
            lastGgTsRef.current[dn] = 0;
          }
          lastGgLapRef.current[dn] = curLap;
        }
      }
   var dnUpdated = false;
     pts.forEach(function(p) {

        if (p.timestamp > lastTs && p.lateral_g != null && p.longitudinal_g != null) {
          if (!ggDataRef.current[dn]) ggDataRef.current[dn] = [];

          ggDataRef.current[dn].push({ lat: p.lateral_g, lon: p.longitudinal_g });

          dnUpdated = true;

        }

      });

      // Only advance timestamp when at least one point was added
      // Prevents timestamp exhaustion when G values are null in early broadcasts
     if (dnUpdated) {
       lastGgTsRef.current[dn] = pts[pts.length - 1].timestamp;
        updated = true;
     }

if (ggDataRef.current[dn] && ggDataRef.current[dn].length > 500) {

 ggDataRef.current[dn] = ggDataRef.current[dn].slice(-500);

      }

    });

   if (updated) ggUpdate(function(v) { return v + 1; });

 }, [snapshot]);

  // GG fallback: fetch positions from REST API when broadcast G values are null
  var ggApiFetched = useRef({});
  useEffect(function() {
    if (!mainDriver) return;
    var dn = mainDriver;
    function fetchGG() {
      fetch("/api/positions/" + dn)
      .then(function(r) { return r.json(); })
      .then(function(pts) {
        if (!pts || pts.length < 3) return;
        var ggPts = [];
        for (var i = 0; i < pts.length; i++) {
          var p = pts[i];
          if (p.lateral_g != null && p.longitudinal_g != null) {
            ggPts.push({ lat: p.lateral_g, lon: p.longitudinal_g });
          }
        }
        if (ggPts.length >= 3) {
          ggDataRef.current[dn] = ggPts;
          ggUpdate(function(v) { return v + 1; });
        }
      })
      .catch(function() {});
    }
    fetchGG();
    var timer = setInterval(fetchGG, 8000);
    return function() { clearInterval(timer); };
  }, [mainDriver]);

  // Telemetry data accumulation: accumulate car_data across broadcasts, clear on lap change
  useEffect(function() {
    // 1. Check for lap changes (from positions) and clear accumulated telemetry
    if (snapshot?.positions) {
      Object.keys(snapshot.positions).forEach(function(dnStr) {
        var pts = snapshot.positions[dnStr];
        if (!pts || pts.length === 0) return;
        var lastPt = pts[pts.length - 1];
        if (lastPt.lap != null && lastCarLapRef.current[dnStr] != null && lastCarLapRef.current[dnStr] !== lastPt.lap) {
          carDataAccRef.current[dnStr] = [];
        }
        lastCarLapRef.current[dnStr] = lastPt.lap;
      });
    }
    // 2. Accumulate new car data from broadcasts
    if (carDataStream) {
      Object.keys(carDataStream).forEach(function(dnStr) {
        var incoming = carDataStream[dnStr];
        if (!incoming || incoming.length === 0) return;
        if (!carDataAccRef.current[dnStr]) carDataAccRef.current[dnStr] = [];
        var acc = carDataAccRef.current[dnStr];
        var lastTs = acc.length > 0 ? acc[acc.length - 1].timestamp : 0;
        incoming.forEach(function(p) {
          if (p.timestamp > lastTs) {
            acc.push(p);
          }
        });
        if (acc.length > 3000) {
          carDataAccRef.current[dnStr] = acc.slice(-3000);
        }
      });
    }
  }, [carDataStream, snapshot?.positions]);

 if (!snapshot) return null;

  var session = snapshot.session, drivers = snapshot.drivers || {};

  var timing_sorted = snapshot.timing_sorted, app_data = snapshot.app_data;

  var car_data = snapshot.car_data || {}, lap_count = snapshot.lap_count;

  var stint_history = snapshot.stint_history;

  var corners = snapshot?.circuit?.corners || null;

 var allCarData = {};

 Object.keys(car_data || {}).forEach(function(dn) { allCarData[dn] = car_data[dn]; });





  // Override with accumulated telemetry data across broadcasts
  Object.keys(carDataAccRef.current || {}).forEach(function(dn) {
    if (carDataAccRef.current[dn] && carDataAccRef.current[dn].length >= 2) {
      allCarData[dn] = carDataAccRef.current[dn];
    }
  });

  var teams = {};

  Object.keys(drivers).forEach(function(num) {

    var d = drivers[num];

    var team = d.team_name || "Unknown";

    if (!teams[team]) teams[team] = [];

    teams[team].push({ number: parseInt(num), tla: d.tla, team_name: d.team_name, team_colour: d.team_colour });

  });

  var handleMainChange = function(e) {

    var val = parseInt(e.target.value);

    setMainDriver(val);

    if (mainDriverRef) mainDriverRef.current = val;

    if (onSelectDriver) onSelectDriver(val);

  };

 var handleRefChange = function(e) {

   var val = parseInt(e.target.value) || null;

   setRefDriver(val);

   if (refDriverRef) refDriverRef.current = val;

 };

 var handleToggleColumn = function(key) {

   setVisibleColumns(function(prev) {

     var next = {};

     Object.keys(prev).forEach(function(k) { next[k] = prev[k]; });

     next[key] = !prev[key];

     return next;

   });

 };

 var deltaInfo = null;

  if (mainDriver && refDriver && timing_sorted) {

    var main = null, ref = null;

    for (var i = 0; i < timing_sorted.length; i++) {

      if (timing_sorted[i].driver_number === mainDriver) main = timing_sorted[i];

      if (timing_sorted[i].driver_number === refDriver) ref = timing_sorted[i];

    }

    if (main && ref) {

      var mg = parseFloat(main.gap_to_leader) || 0;

      var rg = parseFloat(ref.gap_to_leader) || 0;

      deltaInfo = (mg - rg).toFixed(3);

    }

  }

  return (

    <>

      <div className="session-bar">

        <span className="meeting">{session?.meeting_name || "F1"}</span>

        <span className="session">ENGINEERING</span>

        {session?.circuit_short && <span style={{ color: "#8b949e" }}>{session.circuit_short}</span>}

        <span style={{ marginLeft: "auto", fontSize: 11, color: "#8b949e" }}>{session?.session_type && (session.session_type.toLowerCase().includes("practice") || session.session_type.toLowerCase().includes("qualifying")) ? (session?.session_name || "SESSION") : ("L " + (lap_count?.current_lap || 0) + "/" + (lap_count?.total_laps || "-"))}</span>

      </div>

      <div className="eng-selector-bar">

        <div className="selector-group"><label>Main Driver</label>

          <select onChange={handleMainChange} value={mainDriver || ""}>

            <option value="">-- Select --</option>

            {Object.keys(teams).map(function(team) {

              return <optgroup key={team} label={team}>{teams[team].map(function(d) { return <option key={d.number} value={d.number}>#{d.number} {d.tla || "---"}</option>; })}</optgroup>;

            })}

          </select>

        </div>

        <div className="selector-group"><label>Reference Driver</label>

          <select onChange={handleRefChange} value={refDriver || ""}>

            <option value="">-- Select --</option>

            {Object.keys(teams).map(function(team) {

              return <optgroup key={team} label={team}>{teams[team].map(function(d) { return <option key={d.number} value={d.number}>#{d.number} {d.tla || "---"}</option>; })}</optgroup>;

            })}

          </select>

        </div>

        {deltaInfo != null && <div className="delta-badge">Delta: <span style={{ color: parseFloat(deltaInfo) > 0 ? "#e10600" : "#27c93f", fontWeight: 700 }}>{parseFloat(deltaInfo) > 0 ? "+" : ""}{deltaInfo}s</span></div>}

      </div>

       <div className="dashboard" style={{ gridTemplateColumns: "280px 1fr" }}>

         <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "calc(100vh - 180px)" }}>

           <div className="panel" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>

             <div className="panel-header"><span>Timing</span></div>

             <div className="panel-body">

               <TimingTower timing={timing_sorted} drivers={drivers} appData={app_data} selectedDriver={mainDriver} onSelectDriver={handleMainChange} showSectors={false} trackPositions={trackPositions} stintHistory={stint_history} />

             </div>

           </div>

           <div className="panel" style={{ flex: "0 0 auto" }}>

             <div className="panel-header"><span>G-G Diagram</span></div>

             <div className="panel-body" style={{ padding: 4 }}>

               <GGDiagram data={ggDataRef.current[mainDriver] || []} />

             </div>

           </div>

         </div>

 

         <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", maxHeight: "calc(100vh - 180px)" }}>

           <div className="panel">

             <div className="panel-header">

               <span>Charts</span>

               <div style={{ display: "flex", gap: 8, alignItems: "center" }}>

                 {[["speed","Speed"],["throttle","Throttle"],["brake","Brake"],["gear","Gear"],["rpm","RPM"],["delta","Delta"]].map(function(kv) {

                   var key = kv[0], label = kv[1];

                   return <label key={key} className="chart-toggle"><input type="checkbox" checked={visibleColumns[key]} onChange={function() { handleToggleColumn(key); }} /><span>{label}</span></label>;

                 })}

               </div>

             </div>

             <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 2 }}>

               {visibleColumns.speed && <TelemetryChart data={allCarData[mainDriver] || []} refData={refDriver ? (allCarData[refDriver] || undefined) : undefined} yKey="speed" label="Speed (km/h)" color="#58a6ff" height={120} corners={corners} trackLength={trackLength} />}

               {visibleColumns.throttle && <TelemetryChart data={allCarData[mainDriver] || []} refData={refDriver ? (allCarData[refDriver] || undefined) : undefined} yKey="throttle" label="Throttle %" color="#27c93f" height={90} corners={corners} trackLength={trackLength} />}

              {visibleColumns.brake && <TelemetryChart data={allCarData[mainDriver] || []} refData={refDriver ? (allCarData[refDriver] || undefined) : undefined} yKey="brake" label="Brake" color="#e10600" height={80} corners={corners} trackLength={trackLength} step={true} />}

               {visibleColumns.gear && <TelemetryChart data={allCarData[mainDriver] || []} refData={refDriver ? (allCarData[refDriver] || undefined) : undefined} yKey="n_gear" label="Gear" color="#ffd700" height={80} corners={corners} trackLength={trackLength} />}

               {visibleColumns.rpm && <TelemetryChart data={allCarData[mainDriver] || []} refData={refDriver ? (allCarData[refDriver] || undefined) : undefined} yKey="rpm" label="RPM" color="#00d2ff" height={90} corners={corners} trackLength={trackLength} />}

               {visibleColumns.delta && refDriver && allCarData[refDriver] && <TelemetryDeltaChart mainData={allCarData[mainDriver] || []} refData={allCarData[refDriver] || []} height={140} trackLength={trackLength} />}

            </div>

          </div>

         </div>

      </div>

    </>

  );

}



// App

// StrategyView 鈥?杞儙閫€鍖栫瓥鐣ラ〉闈?
function App() {
  const isEmbed = new URLSearchParams(window.location.search).get("embed") === "true";

  const [snapshot, setSnapshot] = useState(null);

  const [selectedDriver, setSelectedDriver] = useState(null);

  const handleSelectDriver = useCallback((driverNumber) => {

    setSelectedDriver(prev => prev === driverNumber ? null : driverNumber);

  }, []);

  const [activeTab, setActiveTab] = useState("general");

  const [carDataStream, setCarDataStream] = useState({});

  const [trackLength, setTrackLength] = useState(4655);

  const [trackPositions, setTrackPositions] = useState([]);

  const [theme, setTheme] = useState("dark");



  const mainDriverRef = useRef(null);

  const refDriverRef = useRef(null);

  const snapRef = useRef(null);



  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);



  const handleMessage = useCallback((msg) => {

    const updateTypes = ["timing_sorted", "timing", "positions", "car_data", "weather", "track_status", "session", "drivers", "lap_count", "race_control", "app_data", "stint_history", "circuit"];

    if (msg.type === "snapshot") {

      // Always accept snapshot data

      if (msg.data) {

        setSnapshot(msg.data); snapRef.current = msg.data;

        if (msg.data?.circuit?.length_m) setTrackLength(msg.data.circuit.length_m);

      }

   } else if (msg.type === "car_data") {

   // Replace carDataStream with latest snapshot (300 pts/driver covers full lap)

   setCarDataStream(msg.data || {});

   // Don't overwrite snapshot car_data
   return;

} else if (msg.type === "track_positions") {

   setTrackPositions(msg.data || []);

  } else if (msg.type === "timing" && snapRef.current) {

    // Use sorted list directly from backend (includes position 0 at bottom)

    if (Array.isArray(msg.data)) {

      snapRef.current = {

        ...snapRef.current,

        timing_sorted: msg.data,

      };

      setSnapshot({ ...snapRef.current });

    }

} else if (msg.type === "circuit") {

  if (msg.data?.length_m) setTrackLength(msg.data.length_m);

  if (snapRef.current) { snapRef.current = { ...snapRef.current, circuit: msg.data }; setSnapshot({ ...snapRef.current }); }

   } else if (updateTypes.includes(msg.type) && snapRef.current) {

      snapRef.current = { ...snapRef.current, [msg.type]: msg.data };

      setSnapshot({ ...snapRef.current });

    }

  }, []);



 const { connected } = useWebSocket(handleMessage);



  useEffect(() => {

    fetchSnapshot().then(data => { setSnapshot(data); snapRef.current = data; if (data?.circuit?.length_m) setTrackLength(data.circuit.length_m); }).catch(() => {});

    fetch("/api/status").then(r => r.json()).then(d => { if (d.track_length) setTrackLength(d.track_length); }).catch(() => {});

  }, []);

  // Poll for circuit data in case it wasn't in the initial snapshot

  useEffect(function() {

    var timer = setInterval(function() {

      fetch('/api/circuit').then(function(r) { return r.json(); }).then(function(data) {

        if (data && data.corners) {

          setTrackLength(data.length_m);

          setSnapshot(function(prev) { return { ...prev, circuit: data }; });

          clearInterval(timer);

        }

      }).catch(function() {});

    }, 5000);

    return function() { clearInterval(timer); };

  }, []);

 

  // postMessage: notify parent container of height changes for iframe embedding
  useEffect(() => {
    if (!isEmbed) return;
    const sendHeight = () => {
      const height = document.body.scrollHeight;
      parent.postMessage({ type: "resize", height }, "*");
    };
    const initialTimer = setTimeout(sendHeight, 500);
    window.addEventListener("resize", sendHeight);
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);
    const onMessage = (e) => {
      if (e.data?.type === "request_resize") sendHeight();
    };
    window.addEventListener("message", onMessage);
    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener("resize", sendHeight);
      window.removeEventListener("message", onMessage);
      observer.disconnect();
    };
  }, [isEmbed]);
  if (!snapshot) {

    return (

      <div className={"app" + (isEmbed ? " embed" : "")}>

        {!isEmbed && <div className="header"><h1><span>VENTO</span> TIMING</h1></div>}

        <div className="loading-bar active" />

        <div className="no-session" style={{ height: "60vh" }}>Connecting to F1 live timing feed...</div>

      </div>

    );

  }

  return (

    <div className={"app" + (isEmbed ? " embed" : "")}>

      {!isEmbed && <div className="header">

        <div className="header-left">

          <h1><span>VENTO</span> TIMING</h1>

        </div>

        <div className="header-center">

          <nav className="tab-nav">

            <button className={"tab-btn" + (activeTab === "general" ? " active" : "")} onClick={() => setActiveTab("general")}>GENERAL</button>

            <button className={"tab-btn" + (activeTab === "dynamic" ? " active" : "")} onClick={() => setActiveTab("dynamic")}>DYNAMIC</button>

            <button className={"tab-btn" + (activeTab === "strategy" ? " active" : "")} onClick={() => setActiveTab("strategy")}>STRATEGY</button>

          </nav>

        </div>

        <div className="header-right">

          <div className="connection-badge">

            <span className={"dot " + (connected ? "connected" : "disconnected")} />

            {connected ? "Live" : "Disconnected"}

          </div>

          <button className="theme-toggle" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>

            {theme === "dark" ? "\u{1F319}" : "\u2600\uFE0F"}

          </button>

        </div>

      </div>}

      {activeTab === "general" ? (

        <GeneralView snapshot={snapshot} selectedDriver={selectedDriver} onSelectDriver={handleSelectDriver} trackPositions={trackPositions} />

      ) : activeTab === "dynamic" ? (

        <EngineeringView snapshot={snapshot} selectedDriver={selectedDriver} onSelectDriver={handleSelectDriver} carDataStream={carDataStream} trackLength={trackLength} mainDriverRef={mainDriverRef} refDriverRef={refDriverRef} trackPositions={trackPositions} />

      ) : activeTab === "strategy" ? (

        <StrategyView snapshot={snapshot} />

      ) : (

        <GeneralView snapshot={snapshot} selectedDriver={selectedDriver} onSelectDriver={handleSelectDriver} trackPositions={trackPositions} />

      )}

    </div>

  );

}



export default App








