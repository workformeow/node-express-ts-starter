import { randomUUID } from 'node:crypto'
import type { Todo } from './todo.entity'
import type { TodoRepository } from './todo.repository'

const clone = (todo: Todo): Todo => ({ ...todo, createdAt: new Date(todo.createdAt) })

export const createMemoryTodoRepository = (seed: Todo[] = []): TodoRepository => {
  const store = new Map(seed.map((todo) => [todo.id, clone(todo)]))
  const cloneOrNull = (todo: Todo | undefined): Todo | null => (todo ? clone(todo) : null)

  return {
    findAll: async () => [...store.values()].map(clone),
    findById: async (id) => cloneOrNull(store.get(id)),
    findByTitle: async (title) =>
      cloneOrNull([...store.values()].find((todo) => todo.title === title)),
    create: async ({ title }) => {
      const todo: Todo = { id: randomUUID(), title, done: false, createdAt: new Date() }
      store.set(todo.id, todo)
      return clone(todo)
    },
    update: async (id, changes) => {
      const current = store.get(id)
      if (!current) {
        return null
      }

      const updated: Todo = { ...current, ...changes }
      store.set(id, updated)
      return clone(updated)
    },
    remove: async (id) => store.delete(id),
  }
}
