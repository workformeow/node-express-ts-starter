import { db } from '@/core/database'
import { createTodoController } from './todo.controller'
import { createSqliteTodoRepository } from './todo.repository.sqlite'
import { createTodoRouter } from './todo.routes'
import { createTodoService } from './todo.service'

const todoRepo = createSqliteTodoRepository(db)
const todoService = createTodoService({ todoRepo })
const todoController = createTodoController(todoService)

export const todoRouter = createTodoRouter(todoController)
export type { Todo } from './todo.entity'
