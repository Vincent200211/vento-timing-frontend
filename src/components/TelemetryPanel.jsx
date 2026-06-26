import { formatGap, compoundColor, compoundBg, teamColor } from "../utils";

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

        <div className="metric-card"><div className="metric-value" style={{ color: latestCar.brake > 0.05 ? "#e10600" : "#8b949e" }}>{Math.round(latestCar.brake * 100)}%</div><div className="metric-label">Brake</div></div>

        <div className="metric-card"><div className="metric-value">{latestCar.n_gear || "-"}</div><div className="metric-label">Gear</div></div>

        <div className="metric-card"><div className="metric-value" style={{ color: latestCar.drs === 1 ? "#27c93f" : latestCar.drs === 0 ? "#8b949e" : "#888" }}>{latestCar.drs === 1 ? "OPEN" : latestCar.drs === 0 ? "CLOSED" : "---"}</div><div className="metric-label">DRS</div></div>

        <div className="metric-card"><div className="metric-value" style={{ color: latestCar.rpm === 0 ? "#e10600" : "#8b949e" }}>{latestCar.rpm === 0 ? "STALL" : "RUN"}</div><div className="metric-label">Engine</div></div>

      </div>

    </div>

  );

}



function RaceRing({ trackPositions, drivers, selectedDriver, onSelectDriver, lapCount, trackStatus, timing, pitMedian, trackLength, pitLossAvailable, appData, stintHistory, circuit, raceControl }) {

export default TelemetryPanel;
