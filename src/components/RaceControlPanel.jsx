import { formatGap, compoundColor, compoundBg, teamColor } from "../utils";

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

export default RaceControl;
