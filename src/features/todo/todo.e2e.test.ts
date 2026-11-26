import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '@/app'
import { HttpStatus } from '@/shared/consts'
import type { AppResponse } from '@/shared/types'
import type { Todo } from './todo.entity'

const app = createApp()
const TODOS_PATH = '/todos'

describe('todos API', () => {
  it('runs a todo through create → read → toggle → delete', async () => {
    const created = await request(app).post(TODOS_PATH).send({ title: 'Smoke test' })
    expect(created.status).toBe(HttpStatus.CREATED)
    const { id } = (created.body as AppResponse<Todo>).data as Todo

    const found = await request(app).get(`${TODOS_PATH}/${id}`)
    expect(found.status).toBe(HttpStatus.OK)
    expect((found.body as AppResponse<Todo>).data?.title).toBe('Smoke test')

    const toggled = await request(app).patch(`${TODOS_PATH}/${id}/toggle`)
    expect(toggled.status).toBe(HttpStatus.OK)
    expect((toggled.body as AppResponse<Todo>).data?.done).toBe(true)

    const removed = await request(app).delete(`${TODOS_PATH}/${id}`)
    expect(removed.status).toBe(HttpStatus.OK)

    const gone = await request(app).get(`${TODOS_PATH}/${id}`)
    expect(gone.status).toBe(HttpStatus.NOT_FOUND)
  })
})
