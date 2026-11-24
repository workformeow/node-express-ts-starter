import { randomUUID } from 'node:crypto'
import type { NewTodo, Todo, TodoChanges } from './todo.entity'
import type { TodoRepository } from './todo.repository'
import type { DatabaseSync } from 'node:sqlite'

interface TodoRow {
  id: string
  title: string
  done: number
  createdAt: string
}

const mapTodo = (row: TodoRow): Todo => ({
  id: row.id,
  title: row.title,
  done: row.done === 1,
  createdAt: new Date(row.createdAt),
})

export const createSqliteTodoRepository = (db: DatabaseSync): TodoRepository => {
  const query = `CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  )`
  db.exec(query)

  const findAll = async (): Promise<Todo[]> => {
    const query = 'SELECT * FROM todos'
    const rows = db.prepare(query).all() as TodoRow[] | []
    return rows.map(mapTodo)
  }

  const findById = async (id: string): Promise<Todo | null> => {
    const query = 'SELECT * FROM todos WHERE id = ?'
    const row = db.prepare(query).get(id) as TodoRow | undefined
    return row ? mapTodo(row) : null
  }

  const findByTitle = async (title: string): Promise<Todo | null> => {
    const query = 'SELECT * FROM todos WHERE title = ?'
    const row = db.prepare(query).get(title) as TodoRow | undefined
    return row ? mapTodo(row) : null
  }

  const create = async ({ title }: NewTodo): Promise<Todo> => {
    const todo: Todo = { id: randomUUID(), title, done: false, createdAt: new Date() }
    const query = 'INSERT INTO todos (id, title, done, createdAt) VALUES (?, ?, ?, ?)'
    db.prepare(query).run(todo.id, todo.title, 0, todo.createdAt.toISOString())

    return todo
  }

  const update = async (id: string, body: TodoChanges): Promise<Todo | null> => {
    const title = body.title ?? null
    const done = body.done === undefined ? null : Number(body.done)
    const query =
      'UPDATE todos SET title = COALESCE(?, title), done = COALESCE(?, done) WHERE id = ?'

    const result = db.prepare(query).run(title, done, id)
    return result.changes > 0 ? findById(id) : null
  }

  const remove = async (id: string) => {
    const query = 'DELETE FROM todos WHERE id = ?'
    const result = db.prepare(query).run(id)

    return result.changes > 0
  }

  return {
    findAll,
    findById,
    findByTitle,
    create,
    update,
    remove,
  }
}
