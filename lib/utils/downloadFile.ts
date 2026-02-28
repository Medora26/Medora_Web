export const downloadFile = (url: string, format?: string) => {
  try {
    let downloadUrl = url

    const lowerFormat = format?.toLowerCase()

    // If PDF → must use raw delivery
    if (lowerFormat === 'pdf') {
      downloadUrl = url
        .replace('/image/upload/', '/raw/upload/')
        .replace('/upload/', '/upload/fl_attachment/')
    } else {
      // Images & others
      downloadUrl = url.replace('/upload/', '/upload/fl_attachment/')
    }

    const link = document.createElement('a')
    link.href = downloadUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Download error:', error)
  }
}