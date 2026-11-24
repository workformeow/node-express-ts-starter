import type { NewTodo, Todo, TodoChanges } from './todo.entity'

export interface TodoRepository {
  findAll(): Promise<Todo[]>
  findById(id: string): Promise<Todo | null>
  findByTitle(title: string): Promise<Todo | null>
  create(body: NewTodo): Promise<Todo>
  update(id: string, body: TodoChanges): Promise<Todo | null>
  remove(id: string): Promise<boolean>
}
