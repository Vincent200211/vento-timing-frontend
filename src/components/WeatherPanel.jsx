import { formatGap, compoundColor, compoundBg, teamColor } from "../utils";

function WeatherPanel({ weather }) {

  if (!weather) return <div className="no-session">No weather data</div>;

  return (

    <div className="weather-grid">

      <div className="weather-item"><span className="value">{weather.air_temperature?.toFixed(1)}閹虹煰</span><span className="label">Air Temp</span></div>

      <div className="weather-item"><span className="value">{weather.track_temperature?.toFixed(1)}閹虹煰</span><span className="label">Track Temp</span></div>

      <div className="weather-item"><span className="value">{weather.humidity?.toFixed(0)}%</span><span className="label">Humidity</span></div>

      <div className="weather-item"><span className="value">{weather.wind_speed?.toFixed(0)}</span><span className="label">Wind (m/s)</span></div>

      <div className="weather-item"><span className="value">{weather.pressure?.toFixed(0)}</span><span className="label">Pressure (hPa)</span></div>

      <div className="weather-item"><span className="value" style={{ color: weather.rainfall ? "#58a6ff" : "#8b949e" }}>{weather.rainfall ? "YES" : "NO"}</span><span className="label">Rain</span></div>

    </div>

  );

}

export default WeatherPanel;
