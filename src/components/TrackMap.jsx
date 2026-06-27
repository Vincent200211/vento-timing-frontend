import { useState, useEffect, useRef, useCallback } from "react";
import { formatGap, compoundColor, compoundBg, teamColor } from "../utils";

function RaceRing({ trackPositions, drivers, selectedDriver, onSelectDriver, lapCount, trackStatus, timing, pitMedian, trackLength, pitLossAvailable, appData, stintHistory, circuit, raceControl, session }) {

// RaceRing



    const isPracticeQualifying = session?.session_type && (session.session_type.toLowerCase().includes("practice") || session.session_type.toLowerCase().includes("qualifying"));
    const [countdown, setCountdown] = useState("");
    const countdownRef = useRef(0);
    const countdownTimerRef = useRef(null);

    function formatCountdown(totalSec) {
      if (totalSec <= 0) return "00:00";
      var h = Math.floor(totalSec / 3600);
      var m = Math.floor((totalSec % 3600) / 60);
      var s = totalSec % 60;
      if (h > 0) return String(h).padStart(2,'0') + ":" + String(m).padStart(2,'0') + ":" + String(s).padStart(2,'0');
      return String(m).padStart(2,'0') + ":" + String(s).padStart(2,'0');
    }

    useEffect(() => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (!isPracticeQualifying) { setCountdown(""); return; }
      if (session?.remaining) {
        var parts = session.remaining.split(':');
        if (parts.length >= 2) {
          var totalSec = (parseInt(parts[0])||0)*3600 + (parseInt(parts[1])||0)*60 + (parseInt(parts[2])||0);
          if (totalSec <= 0) { setCountdown("00:00"); return; }
          setCountdown(formatCountdown(totalSec));
          countdownRef.current = totalSec;
          countdownTimerRef.current = setInterval(function() {
            countdownRef.current -= 1;
            if (countdownRef.current <= 0) {
              setCountdown("00:00");
              if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            } else {
              setCountdown(formatCountdown(countdownRef.current));
            }
          }, 1000);
          return function() { if (countdownTimerRef.current) clearInterval(countdownTimerRef.current); };
        }
      }
      if (session?.end_date) {
        var endDateStr = session.end_date;
        var offsetStr = session.gmt_offset || "00:00:00";
        var sign = offsetStr.startsWith("-") ? "" : "+";
        var offsetParts = offsetStr.split(":");
          var offsetTrimmed = offsetParts[0] + ":" + (offsetParts[1] || "00");
          var fullIso = endDateStr + sign + offsetTrimmed;
        var endDate = new Date(fullIso);
        function updateCountdown() {
          var diff = endDate - new Date();
          if (diff <= 0) { setCountdown("00:00"); return; }
          var hours = Math.floor(diff / 3600000);
          var mins = Math.floor((diff % 3600000) / 60000);
          var secs = Math.floor((diff % 60000) / 1000);
          setCountdown(hours > 0
            ? String(hours).padStart(2,'0') + ":" + String(mins).padStart(2,'0') + ":" + String(secs).padStart(2,'0')
            : String(mins).padStart(2,'0') + ":" + String(secs).padStart(2,'0'));
        }
        updateCountdown();
        var interval = setInterval(updateCountdown, 1000);
        return function() { clearInterval(interval); };
      }
      setCountdown("");
    }, [isPracticeQualifying, session?.remaining, session?.end_date, session?.gmt_offset]);
const started = isPracticeQualifying ? (session && session.session_type) : (lapCount && lapCount.current_lap >= 1);

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

       <svg viewBox="0 0 160 160" style={{fontFamily:"-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"}}>

         <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth="12" opacity={0.4} />

         {/* Coloured stint segments */}
         {isPracticeQualifying ? (
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#30363d" strokeWidth={12} opacity={0.15} />
         ) : (


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



         })()})}



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

          {isPracticeQualifying && <text x={80} y={78} textAnchor="middle" fontSize="20" fill="var(--text)" fontWeight="700">
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

export default RaceRing;
