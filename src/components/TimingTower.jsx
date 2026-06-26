import { useState, useEffect, useRef } from "react";
import { formatGap, teamColor, compoundColor, compoundBg } from "../utils";

function TimingTower({ timing, drivers, appData, selectedDriver, onSelectDriver, showSectors, trackPositions, stintHistory }) {

  if (!timing || timing.length === 0) {

    return <div className="no-session">Waiting for timing data...</div>

  }

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

              className={"driver-row" + (selectedDriver === entry.driver_number ? " selected" : "") + (entry.position === 0 ? " retired" : "")}

              onClick={() => onSelectDriver(entry.driver_number)}

            >

              <td>

                <span className={"pos-badge" + (entry.position === 0 ? " retired" : "")} style={{ background: entry.position === 0 ? "#555" : (teamColor(driver?.team_colour)) }}>{entry.position === 0 ? "R" : entry.position}</span>

              </td>

              <td>

                <div className={"driver-tla" + (entry.position === 0 ? " retired" : "")} style={{ color: entry.position === 0 ? "#666" : teamColor(driver?.team_colour) }}>{driver?.tla || entry.driver_number}</div>

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

export default TimingTower;
