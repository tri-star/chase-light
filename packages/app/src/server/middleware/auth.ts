export default defineEventHandler((event) => {
  if (event.context.needSyncSession) {
    setResponseHeaders(event, {
      'X-Need-Sync-Session': 1,
    })
  } else {
    // TODO: 動作確認が取れたら削除
    setResponseHeaders(event, {
      'X-Need-Sync-Session': 0,
    })
  }
})
