export const teamColors = [
  "#FF0000", // Red
  "#00FF00", // Lime
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FFA500", // Orange
  "#800080", // Purple
  "#008000", // Green
  "#000080", // Navy
  "#FFC0CB", // Pink
  "#A52A2A", // Brown
  "#808080", // Gray
  "#FFD700", // Gold
  "#4B0082", // Indigo
  "#7FFF00", // Chartreuse
  "#FF4500", // OrangeRed
  "#1E90FF", // DodgerBlue
  "#8A2BE2", // BlueViolet
  "#32CD32", // LimeGreen
  "#FF69B4", // HotPink
  "#20B2AA", // LightSeaGreen
]

export const getTeamColor = (teamId) => {
  const colorIndex = (Number.parseInt(teamId, 10) - 2) % teamColors.length
  return teamColors[colorIndex >= 0 ? colorIndex : 0]
}

// Add a default export
export default { teamColors, getTeamColor }

