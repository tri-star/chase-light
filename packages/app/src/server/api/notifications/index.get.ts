import { z } from 'zod'
import { notificationSchema } from '~/features/notification/notification'

export default defineEventHandler(async (_event) => {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return z.array(notificationSchema).parse([
    {
      id: '1',
      date: '2025-01-02 10:00:00',
      title: '以下の更新がありました',
      contents: [
        {
          title: 'some-owner/some-product',
          feedLogId: 'some-owner/some-product',
        },
        {
          title: 'some-owner2/some-product2',
          feedLogId: 'some-owner2/some-product2',
        },
        {
          title: 'another-owner/some-product2',
          feedLogId: 'another-owner/some-product2',
        },
      ],
    },
    {
      id: '2',
      date: '2025-01-01 10:00:00',
      title: '以下の更新がありました',
      contents: [
        {
          title: 'some-owner/some-product',
          feedLogId: 'some-owner/some-product',
        },
        {
          title: 'some-owner2/some-product2',
          feedLogId: 'some-owner2/some-product2',
        },
        {
          title: 'another-owner/some-product2',
          feedLogId: 'another-owner/some-product2',
        },
      ],
    },
  ])
})
