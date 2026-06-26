import { useState, useEffect, useCallback } from "react";
import {
  ComposedChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const PRODUCTION_API_HOST = "https://vento-timing-backend.onrender.com"
const IS_PRODUCTION = typeof location !== "undefined" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1"
const API = IS_PRODUCTION ? PRODUCTION_API_HOST + "/api/tyre" : "/api/tyre";

export default function StrategyView() {
  var [drivers, setDrivers] = useState([]);
  var [selDriver, setSelDriver] = useState("");
  var [compDriver, setCompDriver] = useState("");
  var [selCompound, setSelCompound] = useState("ALL");
  var [driverR2Thresh, setDriverR2Thresh] = useState(0.3);
  var [driverSigma, setDriverSigma] = useState(0.0);
  var [driverMaxDeg, setDriverMaxDeg] = useState(5.0);
  var [compoundLines, setCompoundLines] = useState([]);
  var [stintLines, setStintLines] = useState([]);
  var [scatterData, setScatterData] = useState([]);
  var [loading, setLoading] = useState(false);
  var [qualyBest, setQualyBest] = useState(null);
  var [gridData, setGridData] = useState(null);
  var [gridCompound, setGridCompound] = useState("MEDIUM");
  var [gridR2Thresh, setGridR2Thresh] = useState(0.3);
  var [gridSigma, setGridSigma] = useState(0.0);
  var [gridMaxDeg, setGridMaxDeg] = useState(5.0);
  var [showStintLines, setShowStintLines] = useState(true);

  const COLORS = {SOFT:"#da291c", MEDIUM:"#ffd700", HARD:"#ffffff", INTERMEDIATE:"#4caf50", WET:"#2196f3"};

  useEffect(function() {
    fetch(API + "/drivers").then(r=>r.json()).then(d => {
      if (d.drivers) setDrivers(d.drivers);
      
    }).catch(()=>{});
  }, []);

  useEffect(function() {
    if (!selDriver) return;
    setLoading(true);
    const dl = selDriver + (compDriver && compDriver!==selDriver ? ","+compDriver : "");
    let params = "drivers="+dl;
    if (selCompound !== "ALL") params += "&compound="+selCompound;
    params += "&r2=" + driverR2Thresh + "&sigma=" + driverSigma + "&maxdeg=" + driverMaxDeg;

    fetch(API + "/compare?" + params).then(r=>r.json()).then(data => {
      const compLines=[], scPoints=[], stintLinesNew=[];
      if (data.drivers) {
        Object.entries(data.drivers).forEach(([dn, dd]) => {
          if (dd.per_compound) Object.entries(dd.per_compound).forEach(([comp, cd]) => {
            if (cd.model && cd.model.curve) compLines.push({
              driver: "#"+dn+" "+comp,
              compound: comp,
              curve: cd.model.curve.map(p => ({x: p.age, y: p.degradation})),
              color: COLORS[comp]||"#888", dashed: dn!==selDriver,
            });
            if (cd.points) cd.points.forEach(p => {
              scPoints.push({x: p.tyre_age, y: p.loss, driver: "#"+dn+" "+comp, compound: comp});
            });
          });
          if (dd.per_stint) {
            dd.per_stint.forEach(function(st) {
              if (dn !== selDriver) return;  // only main driver stints
              if (st.model && st.model.curve && st.model.curve.length > 0) {
                stintLinesNew.push({
                  driver: "#"+dn+" Stint "+st.stint,
                  compound: st.compound,
                  curve: st.model.curve.map(function(p) { return {x: p.age, y: p.degradation}; }),
                  color: COLORS[st.compound]||"#888",
                  dashed: true,
                });
              }
            });
          }
        });
      }
      setCompoundLines(compLines); setStintLines(stintLinesNew); setScatterData(scPoints);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, [selDriver, compDriver, selCompound, driverR2Thresh, driverSigma, driverMaxDeg]);

  useEffect(function() {
    if (!selDriver || selCompound==="ALL") { setQualyBest(null); return; }
    fetch(API+"/qualy-best?driver="+encodeURIComponent(selDriver)+"&compound="+encodeURIComponent(selCompound))
      .then(r=>r.json()).then(d=>setQualyBest(d.best_lap?{lap:d.best_lap,source:d.source||'Q'}:null)).catch(()=>setQualyBest(null));
  }, [selDriver, selCompound]);



  
  useEffect(function() {
    fetch(API + "/grid-degradation?compound=" + gridCompound + "&r2=" + gridR2Thresh + "&sigma=" + gridSigma + "&maxdeg=" + gridMaxDeg)
      .then(r => r.json())
      .then(d => setGridData(d))
      .catch(() => setGridData(null));
 }, [gridCompound, gridR2Thresh, gridSigma, gridMaxDeg]);
  // Shared X-axis max lap age for both charts
  var maxAge = "auto";
  var allAges = [];
  compoundLines.forEach(function(l) { l.curve.forEach(function(p) { if (p.x != null) allAges.push(p.x); }); });
  if (gridData && gridData.model && gridData.model.curve) {
    gridData.model.curve.forEach(function(p) { if (p.age != null) allAges.push(p.age); });
  }
  if (allAges.length > 0) {
    var mx = Math.max.apply(null, allAges);
    maxAge = Math.ceil(mx / 5) * 5;
    if (maxAge < 10) maxAge = 10;
  }
  if (typeof maxAge !== "number") maxAge = "auto";

// Group drivers by team for selector
  const driversByTeam = {};
  drivers.forEach(d => {
    const team = d.team_name || "Unknown";
    if (!driversByTeam[team]) driversByTeam[team] = [];
    driversByTeam[team].push(d);
  });
  const sortedTeams = Object.keys(driversByTeam).sort();
  // Group scatter points by compound for per-compound coloring
  const scatterByCompound = {};
  scatterData.forEach(p => {
    const isCompare = compDriver && p.driver && p.driver.startsWith("#"+compDriver);
    if (isCompare) return;
    const key = p.compound;
    if (!scatterByCompound[key]) scatterByCompound[key] = {pts: [], compound: p.compound, isCompare: false};
    scatterByCompound[key].pts.push(p);
  });
  return (
    <div className="strategy-view" style={{padding:"0 24px"}}>
      <div className="session-bar">
        <span className="meeting">TYRE STRATEGY</span>
        <span className="session">Degradation Analysis</span>
        <span className="status" style={{color:"#a855f7"}}>DEGRADATION CURVES</span>
      </div>
      <div className="eng-selector-bar" style={{alignItems:"center"}}>
        <div className="selector-group">
          <label>Driver</label>
          <select value={selDriver} onChange={e=>setSelDriver(e.target.value)} style={{maxWidth:220}}>
            <option value="">-- Select --</option>
            {sortedTeams.map(team =>
              <optgroup key={team} label={team}>
                {driversByTeam[team].map(d =>
                  <option key={d.driver_number} value={d.driver_number}>#{d.driver_number} {d.driver_name}</option>
                )}
              </optgroup>
            )}
          </select>
        </div>
        <div className="selector-group">
          <label>Compare</label>
          <select value={compDriver} onChange={e=>setCompDriver(e.target.value)} style={{maxWidth:220}}>
            <option value="">None</option>
            {sortedTeams.map(team =>
              <optgroup key={team} label={team}>
                {driversByTeam[team].filter(d=>String(d.driver_number)!==selDriver).map(d =>
                  <option key={d.driver_number} value={d.driver_number}>#{d.driver_number} {d.driver_name}</option>
                )}
              </optgroup>
            )}
          </select>
        </div>
        <div className="selector-group">
          <label>Compound</label>
          <select value={selCompound} onChange={e=>setSelCompound(e.target.value)}>
            <option value="ALL">All</option>
            {["SOFT","MEDIUM","HARD","INTERMEDIATE","WET"].map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button className="filter-btn" style={{background:showStintLines?'var(--accent)':'var(--surface)',color:'var(--text)',alignSelf:'center'}} onClick={()=>setShowStintLines(!showStintLines)}>
          STINTS {showStintLines?'ON':'OFF'}
        </button>
        {compoundLines.length>0?<div className="delta-badge">{compoundLines.length} compounds</div>:null}
        {qualyBest?<div className="delta-badge" style={{color:"#a855f7"}}>{qualyBest.source==="Practice"?"FP Best":"Q Best"}: {qualyBest.lap.toFixed(3)}s</div>:null}
      </div>
      <div className="dashboard" style={{gridTemplateColumns:"1fr"}}>
        <div className="panel">
          <div className="panel-header"><span>Degradation Curve</span></div>
            <div style={{display:"flex",gap:8,padding:"2px 8px",background:"var(--surface2)",fontSize:11}}>
              <label style={{display:"flex",alignItems:"center",gap:6}}>
                Cliff R: {driverR2Thresh.toFixed(2)}
                <input type="range" min="0" max="1" step="0.05" value={driverR2Thresh}
                  onChange={e=>setDriverR2Thresh(parseFloat(e.target.value))}
                  style={{width:80}} />
              </label>
              <label style={{display:"flex",alignItems:"center",gap:6}}>
                Max Loss: {driverMaxDeg.toFixed(1)}s
                <input type="range" min="1" max="20" step="0.5" value={driverMaxDeg}
                  onChange={e=>setDriverMaxDeg(parseFloat(e.target.value))}
                  style={{width:80}} />
              </label>
                          <label style={{display:"flex",alignItems:"center",gap:6}}>
                Smooth: {driverSigma.toFixed(1)}
                <input type="range" min="0" max="3" step="0.1" value={driverSigma}
                  onChange={e=>setDriverSigma(parseFloat(e.target.value))}
                  style={{width:80}} />
              </label>
            </div>
            <div className="panel-body" style={{padding:6}}>
            {loading?<div className="no-session" style={{height:200}}>Loading...</div>:null}
            {!loading && compoundLines.length===0 && selDriver?
              <div className="no-session" style={{height:200}}>No clean lap data</div>:null}
            {!loading && !selDriver?
              <div className="no-session" style={{height:200}}>Select a driver</div>:null}
            {!loading && compoundLines.length>0?
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="x" type="number" domain={[0,maxAge]} tick={{fill:"var(--text)"}}
                    label={{value:"Tyre Age (laps)",position:"insideBottom",offset:-3,fill:"var(--text)"}} />
                  <YAxis domain={[0, (maxY) => { const m = Math.ceil(maxY * 1.15 * 10) / 10; return m < 0.5 ? 0.5 : m; }]} label={{value:"Lap Time Loss (s)",angle:-90,position:"insideLeft",fill:"var(--text)"}} tick={{fill:"var(--text)"}} />
                  <Tooltip formatter={v=>[v.toFixed(3)+"s"]} labelFormatter={l=>"Age: "+l+" laps"} />
                  {showStintLines && stintLines.map((l,i)=>
                    <Line key={"st-"+i} data={l.curve} dataKey="y"
                      stroke={l.color} strokeWidth={1.5} strokeDasharray="4 4"
                      dot={false} connectNulls name={l.driver} legendType="none" />
                  )}
                  {compoundLines.map((l,i)=>
                    <Line key={"cp-"+i} data={l.curve} dataKey="y" stroke={l.color}
                      strokeWidth={l.dashed?2:3} strokeDasharray={l.dashed?"6 3":""} dot={false} name={l.driver}
                      connectNulls legendType="none" />
                  )}
                  {Object.values(scatterByCompound).map(g =>
                    <Line key={"sc-"+g.compound+(g.isCompare?"_cmp":"")} data={g.pts} dataKey="y" stroke="none"
                      dot={g.isCompare?(p)=>{const cx=p.cx,cy=p.cy,c=COLORS[g.compound]||"#888";let pts="";for(let i=0;i<5;i++){const a1=(i*72-90)*Math.PI/180,a2=(i*72+36-90)*Math.PI/180;pts+=Math.round(cx+4*Math.cos(a1))+","+Math.round(cy+4*Math.sin(a1))+" "+Math.round(cx+1.8*Math.cos(a2))+","+Math.round(cy+1.8*Math.sin(a2))+" ";}return<polygon points={pts} fill={c}/>}:{fill:COLORS[g.compound]||"#888",stroke:COLORS[g.compound]||"#888",strokeWidth:1,r:3,opacity:0.8}}
                      isAnimationActive={false} name={g.compound+(g.isCompare?" (compare)":"")}  legendType="none" />
                  )}

                </ComposedChart>

              </ResponsiveContainer>:null}
          </div>
        </div>
      </div>
      <div className="panel" style={{marginTop:0}}>
        <div className="panel-header">
          <span>Grid Degradation - {gridCompound}</span>
          <select value={gridCompound} onChange={e=>setGridCompound(e.target.value)}
            style={{marginLeft:"auto",fontSize:11,padding:"2px 6px",background:"var(--surface)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:4}}>
            {["SOFT","MEDIUM","HARD","INTERMEDIATE","WET"].map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{display:"flex",gap:8,padding:"2px 8px",background:"var(--surface2)",fontSize:11}}>
            <label style={{display:"flex",alignItems:"center",gap:6}}>
              Cliff R²: {gridR2Thresh.toFixed(2)}
              <input type="range" min="0" max="1" step="0.05" value={gridR2Thresh}
                onChange={e=>setGridR2Thresh(parseFloat(e.target.value))}
                style={{width:80}} />
            </label>
            <label style={{display:"flex",alignItems:"center",gap:6}}>
              Smooth σ: {gridSigma.toFixed(1)}
              <input type="range" min="0" max="3" step="0.1" value={gridSigma}
                onChange={e=>setGridSigma(parseFloat(e.target.value))}
                style={{width:80}} />
            </label>
            <label style={{display:"flex",alignItems:"center",gap:6}}>
              Max Loss: {gridMaxDeg.toFixed(1)}s
              <input type="range" min="1" max="20" step="0.5" value={gridMaxDeg}
                onChange={e=>setGridMaxDeg(parseFloat(e.target.value))}
                style={{width:80}} />
            </label>
          </div>
        <div className="panel-body" style={{padding:6}}>
          {gridData && gridData.model && gridData.model.curve && gridData.model.curve.length > 0 ?
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="x" type="number" domain={[0,maxAge]} tick={{fill:"var(--text)"}}
                  label={{value:"Tyre Age (laps)",position:"insideBottom",offset:-3,fill:"var(--text)"}} />
                <YAxis domain={[0, (maxY) => { const m = Math.ceil(maxY * 1.15 * 10) / 10; return m < 0.5 ? 0.5 : m; }]}
                  label={{value:"Lap Time Loss (s)",angle:-90,position:"insideLeft",fill:"var(--text)"}} tick={{fill:"var(--text)"}} />
                <Tooltip formatter={v=>[v.toFixed(3)+"s"]} labelFormatter={l=>"Age: "+l+" laps"} />
                <Line data={(gridData.scatter || []).map(p=>({x:p.tyre_age,y:p.loss,driver:p.driver}))} dataKey="y"
                  stroke="none" dot={{fill:"#888",stroke:"#888",strokeWidth:1,r:2,opacity:0.8}}
                  isAnimationActive={false} name="All drivers" legendType="none" />
                <Line data={(gridData.model.curve || []).map(p=>({x:p.age,y:p.degradation}))} dataKey="y"
                  stroke={COLORS[gridCompound]||"#888"} strokeWidth={2.5}
                  dot={false} connectNulls name={gridCompound}
                  isAnimationActive={false} legendType="none" />
              </ComposedChart>
            </ResponsiveContainer>
          : <div className="no-session" style={{height:200}}>No data</div>}
        </div>
      </div>
    </div>
  );
}
