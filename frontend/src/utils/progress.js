export function loadProgress() {
  try {
    const saved = localStorage.getItem('englishtalk_progress')
    if (saved) return JSON.parse(saved)
  } catch (e) {}
  return { xp: 0, streak: 0, lastPracticeDate: null, todaySessions: 0, totalSessions: 0, level: 1 }
}

export function saveProgress(progress) {
  localStorage.setItem('englishtalk_progress', JSON.stringify(progress))
}

export function addXP(amount) {
  const progress = loadProgress()
  progress.xp += amount
  progress.level = Math.floor(progress.xp / 500) + 1
  progress.totalSessions += 1

  const today = new Date().toDateString()
  if (progress.lastPracticeDate === today) {
    progress.todaySessions += 1
  } else if (progress.lastPracticeDate === new Date(Date.now() - 86400000).toDateString()) {
    progress.streak += 1
    progress.todaySessions = 1
  } else {
    progress.streak = 1
    progress.todaySessions = 1
  }
  progress.lastPracticeDate = today
  saveProgress(progress)
  return progress
}
