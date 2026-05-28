export async function abrirChromium(chromium) {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || null

  return chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
}
