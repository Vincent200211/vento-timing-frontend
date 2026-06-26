import { useState, useEffect, useRef, useCallback } from "react";
import TelemetryPanel from "./TelemetryPanel";
import RaceRing from "./TrackMap";

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
        if (acc.length > 500) {
          carDataAccRef.current[dnStr] = acc.slice(-500);
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

        <span style={{ marginLeft: "auto", fontSize: 11, color: "#8b949e" }}>L {lap_count?.current_lap || 0}/{lap_count?.total_laps || "-"}</span>

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

export default EngineeringView;
