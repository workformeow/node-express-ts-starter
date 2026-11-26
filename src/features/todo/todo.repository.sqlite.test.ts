import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createSqliteTodoRepository } from './todo.repository.sqlite'
import type { NewTodo, Todo } from './todo.entity'

const makeRepo = () => createSqliteTodoRepository(new DatabaseSync(':memory:'))
const MISSING_ID = 'missing-id'

describe('createSqliteTodoRepository', () => {
  it('creates an undone todo with a UUID', async () => {
    const newTodo: NewTodo = {
      title: 'Buy Milk',
    }
    const repo = makeRepo()
    const todo = await repo.create(newTodo)

    expect(z.uuid().safeParse(todo.id).success).toBe(true)
    expect(todo.title).toBe('Buy Milk')
    expect(todo.done).toBe(false)
    expect(todo.createdAt).toBeInstanceOf(Date)
  })

  it('reads a stored todo back by id', async () => {
    const newTodo: NewTodo = {
      title: 'Buy Milk',
    }
    const repo = makeRepo()

    const todo = await repo.create(newTodo)
    const foundTodo = await repo.findById(todo.id)

    expect(foundTodo).toEqual(todo)
  })

  it('returns an empty list when there are no todos', async () => {
    const repo = makeRepo()
    const todos: Todo[] = await repo.findAll()

    expect(todos).toEqual([])
  })

  it('lists every stored todo', async () => {
    const repo = makeRepo()

    await repo.create({ title: 'Buy milk' })
    await repo.create({ title: 'Implement Go' })

    const todos: Todo[] = await repo.findAll()
    const titles = todos.map((todo) => todo.title)

    expect(titles).toEqual(['Buy milk', 'Implement Go'])
  })

  it('finds a todo by title', async () => {
    const repo = makeRepo()

    const newTodo = await repo.create({ title: 'Buy milk' })
    const todo = await repo.findByTitle('Buy milk')

    expect(todo).toEqual(newTodo)
  })

  it('returns null when no todo matches by Id', async () => {
    const repo = makeRepo()

    await repo.create({ title: 'Buy milk' })
    const todo = await repo.findById(MISSING_ID)

    expect(todo).toBeNull()
  })

  it('returns null when no todo matches by title', async () => {
    const repo = makeRepo()

    await repo.create({ title: 'Buy milk' })
    const todo = await repo.findByTitle('Implement Go')

    expect(todo).toBeNull()
  })

  it('changes the title and keeps done', async () => {
    const repo = makeRepo()

    const newTodo = await repo.create({ title: 'Buy milk' })
    const changes = await repo.update(newTodo.id, { title: 'Implement Go' })

    expect(changes?.title).toBe('Implement Go')
    expect(changes?.done).toBe(false)
  })

  it('changes done and keeps the title', async () => {
    const repo = makeRepo()

    const newTodo = await repo.create({ title: 'Buy milk' })
    const changes = await repo.update(newTodo.id, { done: true })

    expect(changes?.title).toBe('Buy milk')
    expect(changes?.done).toBe(true)
  })

  it('returns null when updating a missing todo', async () => {
    const repo = makeRepo()

    await repo.create({ title: 'Buy milk' })
    const changes = await repo.update(MISSING_ID, { done: true })

    expect(changes).toBeNull()
  })

  it('removes a todo and returns true', async () => {
    const repo = makeRepo()

    const newTodo = await repo.create({ title: 'Buy milk' })
    const changes = await repo.remove(newTodo.id)
    const todo = await repo.findById(newTodo.id)

    expect(changes).toBe(true)
    expect(todo).toBeNull()
  })

  it('returns false when removing a missing todo', async () => {
    const repo = makeRepo()

    await repo.create({ title: 'Buy milk' })
    const changes = await repo.remove(MISSING_ID)

    expect(changes).toBe(false)
  })

  it('stores titles with quotes as plain text', async () => {
    const repo = makeRepo()
    const title = `"O'Brien's list"`

    const newTodo = await repo.create({ title })
    const todo = await repo.findByTitle(title)

    expect(newTodo.title).toBe(title)
    expect(todo).toEqual(newTodo)
  })
})
