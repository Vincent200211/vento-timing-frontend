function formatTime(date) {
  return new Date(date).toLocaleTimeString("zh-CN", { hour12: false })
}

function formatGap(gap) {
  if (!gap || gap === "None") return null
  if (gap.startsWith("+")) return gap
  if (gap === "LAP") return "LAP"
  return gap
}

function compoundColor(compound) {
  const colors = {
    SOFT: "#da291c",
    MEDIUM: "#ffffff",
    HARD: "#ffd700",
    INTERMEDIATE: "#4caf50",
    WET: "#2196f3",
  }
  return colors[compound] || "#888"
}

function compoundBg(compound) {
  const colors = {
    SOFT: "#da291c22",
    MEDIUM: "#ffd70022",
    HARD: "#ffffff11",
    INTERMEDIATE: "#4caf5022",
    WET: "#2196f322",
  }
  return colors[compound] || "transparent"
}

function teamColor(colour) {
  if (!colour || colour === "#cccccc") return "#58a6ff"
  if (typeof colour === "string" && !colour.startsWith("#")) return "#" + colour
  return colour
}

export { formatTime, formatGap, compoundColor, compoundBg, teamColor }
