import { formatGap, compoundColor, compoundBg, teamColor } from "../utils";

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

export default GGDiagram;
